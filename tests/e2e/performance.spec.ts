/// <reference types="node" />
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page, type Response } from './fixtures';
import { watchPage } from './helpers';

/**
 * The performance budget (roadmap Phase 1): a failing test, so the site cannot quietly
 * get heavier as 35 more tools and 75 more pages arrive. Two kinds of check, because a
 * regression can show up in either:
 *
 *   - **Per-chunk ceilings**, read straight off disk. Cheap, and the only check that
 *     catches a chunk nobody navigates to directly.
 *   - **Per-page budgets**, measured in a real browser: total transferred bytes, LCP
 *     and CLS for a representative page of each kind.
 *
 * This file exists because of a real bug it would have caught: `useTask.ts` imported
 * `PdfInputError` from `lib/pdf/load.ts`, which pulls in @cantoo/pdf-lib — on the *main
 * thread*, for every tool page, to use one error class. That was 569KB of dead weight
 * on every single tool page (see src/lib/pdf/inputError.ts for the fix). The per-chunk
 * ceiling below would have failed loudly on day one instead of silently shipping.
 */

/** Resolves the build Playwright just produced, matching astro.config.mjs's own default. */
function distDir(): string {
  return path.join(process.cwd(), process.env.LEAFLOCK_OUT_DIR ?? 'dist');
}

// ---------------------------------------------------------------------------
// Per-chunk ceilings
// ---------------------------------------------------------------------------

/**
 * Three chunks are legitimately heavy and deliberately excluded from the tight default
 * ceiling, because each is fetched well away from the critical path:
 *
 *   - The job worker (`pdf.worker-*.js`, named for its source file `pdf.worker.ts`,
 *     the pattern integrations/service-worker.mjs also keys off) bundles pdf-lib and
 *     every operation. It is warmed on idle (`warmPdfWorker()` in ToolApp) rather than
 *     on load, specifically so it never blocks a page from rendering.
 *   - pdf.js's own renderer, identified by `GlobalWorkerOptions` — a name specific
 *     enough that nothing else should ever contain it — rather than by filename, which
 *     Vite's chunking can rename on an unrelated dependency bump. Only loaded by tools
 *     that render page previews, and not fetched just by opening the page.
 *   - mammoth's DOCX-to-HTML conversion (Word → PDF), identified by its own exported
 *     `convertToHtml`, for the same filename-instability reason as pdf.js above. It is
 *     dynamically imported from `src/lib/convert/docxBlocks.ts` and fetched only when
 *     someone actually converts a .docx — never by opening the tool page.
 *
 * Everything else gets the tight ceiling. That is deliberate: a chunk nobody expects to
 * be heavy is exactly where an accidental import like the one above hides.
 */
const WORKER_CEILING = 750 * 1024;
const PDFJS_RENDERER_CEILING = 500 * 1024;
const MAMMOTH_CEILING = 350 * 1024;
const DEFAULT_CEILING = 250 * 1024;

test('no built chunk exceeds its weight ceiling', async () => {
  const astroDir = path.join(distDir(), '_astro');
  const files = (await readdir(astroDir)).filter((name) => name.endsWith('.js'));
  expect(files.length, 'the build produced no JS at all — did it actually run?').toBeGreaterThan(10);

  const failures: string[] = [];
  for (const file of files) {
    const full = path.join(astroDir, file);
    const { size } = await stat(full);
    const isWorker = /^pdf\.worker-[^/]+\.js$/.test(file);
    const content = isWorker ? '' : await readFile(full, 'utf8');
    const isPdfRenderer = !isWorker && content.includes('GlobalWorkerOptions');
    const isMammoth = !isWorker && !isPdfRenderer && content.includes('convertToHtml');
    const ceiling = isWorker ? WORKER_CEILING : isPdfRenderer ? PDFJS_RENDERER_CEILING : isMammoth ? MAMMOTH_CEILING : DEFAULT_CEILING;
    if (size > ceiling) {
      failures.push(`${file}: ${(size / 1024).toFixed(0)}KB > ${(ceiling / 1024).toFixed(0)}KB ceiling`);
    }
  }
  expect(failures, failures.join('\n')).toEqual([]);
});

/**
 * The job worker must not carry metrics for standard fonts we never embed.
 *
 * pdf-lib imports all fourteen eagerly and files them in a lookup object, which defeats
 * tree-shaking; `integrations/standard-fonts.mjs` stubs every one outside the four
 * Helvetica weights this product actually embeds (`blocksToPdf.ts`'s Office → PDF
 * rendering is what uses bold/oblique/bold-oblique, not just the plain weight). The stub
 * keys off pdf-lib's internal file layout, so a dependency bump could silently stop
 * applying it — this is the test that makes that loud rather than silent.
 */
test('the job worker carries only the standard-font metrics it uses', async () => {
  const astroDir = path.join(distDir(), '_astro');
  const worker = (await readdir(astroDir)).find((name) => /^pdf\.worker-[^/]+\.js$/.test(name));
  expect(worker, 'no job worker chunk in the build').toBeDefined();

  const content = await readFile(path.join(astroDir, worker!), 'utf8');

  // The stub landed at all: if pdf-lib moves these files, the sentinel disappears.
  expect(content, 'the standard-font stub did not apply — see integrations/standard-fonts.mjs').toContain(
    'LEAFLOCK_STANDARD_FONT_NOT_BUNDLED',
  );

  // Helvetica's own metrics have to survive, since the product embeds all four weights.
  expect(content, "Helvetica's metrics are missing from the worker").toMatch(/Helvetica/);
});

// ---------------------------------------------------------------------------
// Per-page budgets
// ---------------------------------------------------------------------------

interface Budget {
  /** The page's own HTML document. */
  html: number;
  /** Every same-origin .js and .css response, excluding the two chunks above. */
  jsCss: number;
  /** Milliseconds. Google's "good" LCP threshold is 2500ms on real-world networks; CI
   * has none of that latency, so this is set far tighter to catch a real regression
   * rather than to model a real visitor's connection. */
  lcpMs: number;
  /** Google's "good" CLS threshold, used as-is: there is no CI-specific reason to move it. */
  cls: number;
}

// Raised from 60_000/70_000: the persistent tools sidebar (src/components/
// ToolsSidebar.astro) renders all ~43 tools across every category into every page's
// HTML so it works with JS disabled and needs no client fetch, and the skin picker
// (src/components/SkinPicker.astro) renders all 15 options the same way — a real,
// deliberate cost of shipping both site-wide rather than a measurement regression.
// Current weight sits around 93-98KB; the budget leaves headroom without being toothless.
// HTML 105_000 -> 106_000 on 9 Nov 2026: the sidebar's phone rules (the lone hide/show handle as a
// bottom-corner button) are inlined into every page's head, and the front page was already within
// a few hundred bytes of the old limit. About 0.5 KB; the front page went from 104.9 to 105.4 KB.
// HTML 106_000 -> 106_500 on 12 Nov 2026: the home and pricing pages carry a small inline script
// (Base.astro `memberHint`, about 0.3 KB) that reads the plan from the signed-in cookie before first
// paint, so a paying member sees their own view at once instead of the new-visitor page for a second or
// two. Only these two pages carry it; tool pages (their own budget below) do not.
// HTML 106_500 -> 107_000 and tool pages 105_000 -> 105_500 on 15 Nov 2026: every page now carries a
// robots meta (index,follow,max-image-preview,max-snippet) and twitter:title / twitter:description for
// search and AI-answer visibility. About 0.3 KB per page.
// HTML 107_000 -> 110_000 on 17 Nov 2026 (the redesign): the front page now ships its category tabs as a
// script-free radio group (four radios, a label bar and a panel per category, all 43 tools still in the HTML),
// its own stylesheet (src/styles/home.css, inlined, about 3 KB), and the sixteenth skin (Playful Rounded, kept as
// an alternate) plus a rule pinning three tokens for the other alternates, both in skins.css which every page
// inlines. The front page went from 106.5 to 108.6 KB. The collapsible-section CSS it replaced is gone from
// global.css, which already offset part of this.
// HTML 110_000 -> 112_000 on 18 Nov 2026: the hero now carries the bento of eight major tools (a second, shorter
// description of tools that are also in the list below) and the one all-tools list tags each tool with its category
// and adds an All tab plus four "See all" links. The front page went from 108.6 to about 111.1 KB.
const CONTENT_BUDGET: Budget = { html: 112_000, jsCss: 320_000, lcpMs: 1500, cls: 0.1 };
// Tool pages' HTML 100_000 -> 102_000 on 7 Nov 2026: the language switcher (src/components/
// LanguageSwitcher.astro) lists every translated language in every page so it works without
// JS. Ten languages cost about 1.2 KB per page (~0.12 KB per language added); /ocr-pdf went
// from just under the old limit to 100,066. The banner's sentences are NOT in the HTML: they are
// fetched from /lang-offers.json only when shown. Revisit if the language count passes ~20.
// Tool pages' HTML 102_000 -> 105_000 on 8 Nov 2026: the feature-request and feedback dialog
// (ToolsSidebar.astro) ships its wording in a <template> on every page with the sidebar, so it is in
// the visitor's language and needs no request to open. About 1.9 KB; /ocr-pdf went from just under
// the old limit to 103.5 KB. Build the dialog from a fetched fragment instead if this is raised again.
// Tool pages' HTML 105_500 -> 108_500 on 18 Nov 2026 (the redesign): src/styles/tool-page.css (the two tiles under the tool,
// numbered steps, bordered questions; inlined, about 2.7 KB, tool pages only) and a little more in global.css for the
// header's Log in button, the sidebar's search box and the footer strip (about 1 KB on every page). /organize-pdf went
// from just under the old limit to 106.8 KB.
const TOOL_BUDGET: Budget = { html: 108_500, jsCss: 380_000, lcpMs: 1500, cls: 0.1 };

/** One representative page per kind, not all 52: this is a real-browser measurement
 * with response-body capture, materially slower per page than site.spec.ts's "loads
 * cleanly" check, which already covers every tool page's correctness. */
const PAGES: { path: string; budget: Budget }[] = [
  { path: '/', budget: CONTENT_BUDGET },
  { path: '/pricing', budget: CONTENT_BUDGET },
  { path: '/guides/merge-pdf-without-uploading', budget: CONTENT_BUDGET },
  { path: '/compare/leaflock-vs-ilovepdf', budget: CONTENT_BUDGET },
  { path: '/merge-pdf', budget: TOOL_BUDGET },
  { path: '/organize-pdf', budget: TOOL_BUDGET }, // renders page previews: exercises the pdf.js chunk's own ceiling, just not this one's budget
  { path: '/ocr-pdf', budget: TOOL_BUDGET },
  { path: '/redact-pdf', budget: TOOL_BUDGET }, // Pro tier; same budget — early access means it is not gated, and should not cost more to load either
];

/** Starts the LCP/CLS observers before any script on the page runs. Buffered, so an
 * entry that fired before this evaluates (unlikely, but possible on a fast load) is
 * still captured. */
async function observeWebVitals(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __vitals: { lcp: number; cls: number } }).__vitals = { lcp: 0, cls: 0 };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as unknown as { __vitals: { lcp: number } }).__vitals.lcp = entry.startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) {
          if (!entry.hadRecentInput) (window as unknown as { __vitals: { cls: number } }).__vitals.cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      /* Not every engine supports both observer types; an unmeasured run must not crash. */
    }
  });
}

for (const { path: pagePath, budget } of PAGES) {
  test(`${pagePath || '/'} stays within its performance budget`, async ({ page, baseURL }) => {
    const watch = watchPage(page, baseURL!);

    // One throwaway visit first. The very first navigation anywhere pays for the
    // service worker's install and the browser's own cold start — real, but not the
    // regression this test exists to catch, and including it would make the budget
    // either flaky or so loose it catches nothing. Every subsequent visitor on this
    // domain gets the warm number measured below, courtesy of the Phase 1 service
    // worker (tests/e2e/offline.spec.ts proves that cache exists and works offline).
    await page.goto('/', { waitUntil: 'networkidle' });

    await observeWebVitals(page);
    const responses: { pathname: string; size: number }[] = [];
    const onResponse = async (response: Response) => {
      try {
        const url = new URL(response.url());
        if (url.origin !== baseURL) return;
        responses.push({ pathname: url.pathname, size: (await response.body()).length });
      } catch {
        /* A redirect or an aborted request has no body; it contributes nothing to pay for. */
      }
    };
    page.on('response', onResponse);

    await page.goto(pagePath, { waitUntil: 'networkidle' });
    // networkidle already means nothing is in flight; this only lets late PerformanceObserver callbacks settle.
    await page.waitForTimeout(250);
    page.off('response', onResponse);

    const counted = responses.filter(
      (r) => !/^\/_astro\/pdf\.worker-/.test(r.pathname) && !r.pathname.startsWith('/vendor/'),
    );
    const html = counted.find((r) => r.pathname === pagePath || r.pathname === `${pagePath}/`)?.size ?? 0;
    const jsCss = counted
      .filter((r) => r.pathname.endsWith('.js') || r.pathname.endsWith('.css'))
      .reduce((sum, r) => sum + r.size, 0);
    const vitals = await page.evaluate(() => (window as unknown as { __vitals: { lcp: number; cls: number } }).__vitals);

    expect(html, 'HTML weight').toBeLessThanOrEqual(budget.html);
    expect(jsCss, 'JS + CSS weight').toBeLessThanOrEqual(budget.jsCss);
    expect(vitals.lcp, 'largest contentful paint').toBeLessThanOrEqual(budget.lcpMs);
    expect(vitals.cls, 'cumulative layout shift').toBeLessThanOrEqual(budget.cls);

    watch.assertClean();
  });
}
