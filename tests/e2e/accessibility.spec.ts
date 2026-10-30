/// <reference types="node" />
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { makePdf } from '../fixtures/pdfs';
import { pdfUpload } from './helpers';

/**
 * The accessibility audit (roadmap 6.4), as a spec rather than a one-off report — a report
 * is true on the day it is written, and this has to stay true as pages are added.
 *
 * axe-core is MPL-2.0 and a devDependency, so it never reaches a bundle. It is injected
 * through `page.evaluate`, which runs over CDP and is therefore not subject to our
 * `script-src 'self'` — worth stating, because an injected `<script>` tag would have been
 * blocked and this suite would have been silently testing nothing.
 *
 * WCAG 2.0/2.1 A and AA only. axe's "best-practice" rules are deliberately excluded: they
 * are opinions worth reading, not a standard worth failing a build over.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const scan = (page: Page) => new AxeBuilder({ page }).withTags(WCAG).analyze();

/** axe's own output, trimmed to what identifies a fault in a failure message. */
function describe(violations: Awaited<ReturnType<typeof scan>>['violations']) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.slice(0, 4).map((node) => node.target.join(' ')),
  }));
}

test('the scanner itself reports faults, so a clean run means something', async ({ page }) => {
  // Every axe assertion in this file passes. That is only reassuring if the scanner would
  // have failed on a real violation, so this plants two unambiguous ones and insists they
  // are found. Without this, a misconfigured rule set would read as a perfect site.
  await page.goto('/');
  // Injected as markup rather than as elements: this file carries a Node type reference
  // for `Buffer`, which makes TypeScript resolve `document.body.append` against Node's
  // types instead of the DOM's. A string avoids the element typing altogether.
  await page.evaluate(() => {
    const pixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    document.body.insertAdjacentHTML('beforeend', `<img src="${pixel}"><button></button>`);
  });

  const { violations } = await scan(page);
  const found = violations.map((violation) => violation.id);
  expect(found, `axe found ${found.length} violations in a deliberately broken page`).toContain(
    'image-alt',
  );
  expect(found).toContain('button-name');
});

/**
 * One page of each kind the site actually produces, not all sixty: the generators mean a
 * fault on one tool page is a fault on forty, and a fault in a guide is a fault in every
 * guide. `seo.spec.ts` takes the same approach for the same reason.
 */
const PAGES = [
  { path: '/', what: 'home, the densest page — the full tool grid' },
  { path: '/merge-pdf', what: 'the simplest tool: file picker and one action' },
  { path: '/organize-pdf', what: 'the most complex tool: page grid, drag handles, presets' },
  { path: '/pricing', what: 'plan cards and prices' },
  { path: '/login', what: 'the only real form on the site' },
  { path: '/help', what: 'long-form FAQ' },
  { path: '/compare/leaflock-vs-ilovepdf', what: 'comparison prose and tables' },
  { path: '/guides/merge-pdf-without-uploading', what: 'a guide, standing for all of them' },
  { path: '/tools/organize', what: 'a category hub' },
  { path: '/verify', what: 'the live demo: aria-live regions and a disclosure' },
  { path: '/404', what: 'the error page' },
];

for (const { path, what } of PAGES) {
  test(`${path} has no WCAG A/AA violations (${what})`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await scan(page);
    expect(describe(violations), `${path} — ${what}`).toEqual([]);
  });
}

test('the result panel and retention picker are accessible', async ({ page }) => {
  // The newest UI on the site (shipped 30 October) and the least audited: a fieldset of
  // radios, a number field, and a live region that appears after the work finishes.
  const first = await makePdf([[200, 300]]);
  const second = await makePdf([[400, 500]]);
  await page.goto('/merge-pdf');
  await page.locator('input[type="file"]').setInputFiles([
    pdfUpload('first.pdf', first),
    pdfUpload('second.pdf', second),
  ]);
  await page.getByRole('button', { name: 'Merge PDFs' }).click();
  await expect(page.getByRole('link', { name: 'Download', exact: true })).toBeVisible();

  const { violations } = await scan(page);
  expect(describe(violations), 'result panel with the retention picker').toEqual([]);
});

test('the kept-files shelf is accessible', async ({ page }) => {
  const bytes = await makePdf([[200, 300]]);
  await page.goto('/merge-pdf');
  await page.locator('input[type="file"]').setInputFiles([
    pdfUpload('a.pdf', bytes),
    pdfUpload('b.pdf', bytes),
  ]);
  await page.getByRole('button', { name: 'Merge PDFs' }).click();
  await page.getByRole('radio', { name: '1 hour' }).check();
  await expect(page.getByText('Kept for 1 hour.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Still on this device' })).toBeVisible();

  const { violations } = await scan(page);
  expect(describe(violations), 'the shelf listing kept files').toEqual([]);
});

test('every interactive element on a tool page is reachable and shows focus', async ({ page }) => {
  // axe checks that a control *has* an accessible name; it cannot check that a keyboard
  // can actually get to it, or that you can see where you are when it does.
  await page.goto('/merge-pdf');

  const reached: string[] = [];
  for (let step = 0; step < 40; step += 1) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        name: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40),
        // A visible focus ring is either an outline or a box-shadow; several designs use
        // the latter, so accepting only `outline` would report false failures.
        visible: style.outlineStyle !== 'none' || style.boxShadow !== 'none',
      };
    });
    if (!focused) break;
    expect(focused.visible, `focus is invisible on <${focused.tag}> "${focused.name}"`).toBe(true);
    reached.push(`${focused.tag}:${focused.name}`);
  }

  // The two things the page exists for must be keyboard-reachable.
  expect(reached.some((entry) => entry.startsWith('input')), `tab order: ${reached.join(' | ')}`).toBe(true);
  expect(reached.length, 'nothing was focusable at all').toBeGreaterThan(3);
});

test('the skip link is the first tab stop and becomes visible when focused', async ({ page }) => {
  // It exists in Base.astro, parked at `top: -10rem` until focused. That is the correct
  // pattern and the easiest one to break silently — a stacking context or an
  // `overflow: hidden` added elsewhere can leave it off-screen while still focused, which
  // no axe rule detects because the markup stays perfectly valid.
  await page.goto('/');
  await page.keyboard.press('Tab');

  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toHaveText('Skip to content');

  const box = await skip.boundingBox();
  expect(box, 'the focused skip link has no box at all').not.toBeNull();
  expect(box!.y, 'the skip link is still off-screen while focused').toBeGreaterThanOrEqual(0);

  // And it has to arrive somewhere: an href pointing at a missing id is a dead control
  // that reads as a working one.
  await expect(page.locator('#content')).toHaveCount(1);
});

test('reflows at 320px, the width WCAG 1.4.10 actually names', async ({ page }) => {
  // mobile.spec.ts already checks 360px. 1.4.10 specifies 320, which is where a long
  // unbroken string or a fixed min-width starts to push the page sideways.
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of ['/', '/merge-pdf', '/pricing', '/compare/leaflock-vs-ilovepdf']) {
    await page.goto(path);
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(overflow.scroll, `${path} scrolls sideways at 320px`).toBeLessThanOrEqual(overflow.client);
  }
});

/**
 * What "reduced motion" has to mean here, decided against the stylesheet's own stated
 * philosophy rather than invented: `global.css`'s reduced-motion block keeps a 0.15s
 * border-colour transition and drops the `translateY` lift, with the comment "the lift is
 * decoration; the colour change alone carries the affordance". So a colour fade is not the
 * hazard and must not fail — **movement** is. This checks for running animations and for
 * anything that still transitions `transform`.
 *
 * The first version of this test matched durations with a regex and flagged every ordinary
 * link, because `\b[1-9]\d*s` finds "15s" inside "0.15s". Durations are parsed as numbers
 * now; a test that reports a fault on a correct stylesheet is worse than no test.
 */
const MOTION_PROBE = () => {
  const seconds = (value: string) =>
    Math.max(
      0,
      ...value.split(',').map((part) => {
        const trimmed = part.trim();
        const scale = trimmed.endsWith('ms') ? 1000 : 1;
        return (Number.parseFloat(trimmed) || 0) / scale;
      }),
    );

  const faults: string[] = [];
  for (const el of document.querySelectorAll('*')) {
    const style = getComputedStyle(el);
    const where = `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(' ')[0]}` : ''}`;
    if (style.animationName !== 'none' && seconds(style.animationDuration) > 0) {
      faults.push(`${where} runs animation "${style.animationName}"`);
    }
    const properties = style.transitionProperty;
    if ((properties.includes('transform') || properties.includes('all')) && seconds(style.transitionDuration) > 0) {
      faults.push(`${where} transitions ${properties}`);
    }
  }
  return [...new Set(faults)].slice(0, 8);
};

for (const path of ['/', '/merge-pdf', '/pricing']) {
  test(`${path} holds still under prefers-reduced-motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    expect(await page.evaluate(MOTION_PROBE), `${path} still moves`).toEqual([]);
  });
}

test('without that request, the motion is actually there to reduce', async ({ page }) => {
  // Guards the three tests above from passing because the selectors found nothing: if the
  // hover lift ever stops existing, those become vacuous rather than meaningful.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  expect(await page.evaluate(MOTION_PROBE), 'expected the tool-grid lift to be present').not.toEqual([]);
});
