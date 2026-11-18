import { expect, test } from './fixtures';

/**
 * A browser zoom of Z on a 1440 x 900 window is a (1440 / Z) x (900 / Z) CSS-pixel window, so zooming in is the same
 * as a smaller viewport. This is the check for what that does to a page: text running over other text, a page that
 * scrolls sideways, content cut off by `overflow: hidden`, and a pinned header that takes most of the window.
 *
 * It exists because the redesign first shipped a hero with a fixed height and tiles squeezed into equal rows, which
 * overlapped at 175%. It measures; it does not look at screenshots. Text inside a collapsed <details> and inside the
 * sidebar (an overlay by design) is left out.
 */
const ZOOMS = [1, 1.5, 1.75, 2, 3, 4];
const PAGES = ['/', '/compress-pdf', '/merge-pdf', '/pricing', '/security', '/tools/organize'];

interface Issue {
  kind: string;
  detail: string;
}

function probe(): Issue[] {
  const issues: Issue[] = [];
  const vw = window.innerWidth;
  if (document.documentElement.scrollWidth > vw + 1) {
    issues.push({ kind: 'h-scroll', detail: `scrollWidth ${document.documentElement.scrollWidth} > ${vw}` });
  }

  const skip = (el: Element) =>
    el.closest('.tools-sidebar, .visually-hidden, .skip-link, script, style, noscript, .lang-switcher__list, .skin-picker__panel, .tools-menu__panel');
  const isFixed = (el: Element) => {
    for (let e: Element | null = el; e && e !== document.body; e = e.parentElement) {
      const position = getComputedStyle(e).position;
      if (position === 'fixed' || position === 'sticky') return true;
    }
    return false;
  };
  const describe = (el: Element) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '');

  interface Box {
    el: Element;
    text: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }
  const boxes: Box[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = (node.nodeValue ?? '').replace(/\s+/g, ' ').trim();
    const el = node.parentElement;
    if (!text || !el || skip(el)) continue;
    if (el.closest('details:not([open])') && !el.closest('summary')) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none' || parseFloat(style.opacity) === 0) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const rect of Array.from(range.getClientRects())) {
      if (rect.width < 2 || rect.height < 2) continue;
      boxes.push({ el, text: text.slice(0, 40), x: rect.left + window.scrollX, y: rect.top + window.scrollY, w: rect.width, h: rect.height });
    }
  }
  let overlaps = 0;
  for (let i = 0; i < boxes.length && overlaps < 5; i++) {
    for (let j = i + 1; j < boxes.length && overlaps < 5; j++) {
      const a = boxes[i]!;
      const b = boxes[j]!;
      if (a.el === b.el) continue;
      const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      // Tight line spacing makes neighbouring lines' boxes touch; a real overlap is a good fraction of a line.
      if (dx > 3 && dy > Math.max(4, 0.35 * Math.min(a.h, b.h)) && isFixed(a.el) === isFixed(b.el)) {
        issues.push({ kind: 'overlap', detail: `"${a.text}" (${describe(a.el)}) over "${b.text}" (${describe(b.el)}) by ${Math.round(dx)}x${Math.round(dy)}` });
        overlaps++;
      }
    }
  }

  let clipped = 0;
  for (const el of Array.from(document.querySelectorAll('main *, .site-header *, .site-footer *'))) {
    if (clipped >= 3) break;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || el.closest('.visually-hidden')) continue;
    if (style.overflowY !== 'hidden' && style.overflowX !== 'hidden') continue;
    const clamped = (style as unknown as { webkitLineClamp?: string }).webkitLineClamp;
    if ((clamped && /\d/.test(clamped)) || style.getPropertyValue('-webkit-box-orient') === 'vertical') continue; // a deliberate line clamp
    const html = el as HTMLElement;
    if (!html.innerText?.trim() || html.clientHeight === 0) continue;
    if (html.scrollHeight > html.clientHeight + 3) {
      issues.push({ kind: 'clipped', detail: `${describe(el)}: ${html.scrollHeight}px of content in ${html.clientHeight}px` });
      clipped++;
    }
  }

  const chrome = document.querySelector('.site-chrome');
  if (chrome && getComputedStyle(chrome).position === 'sticky' && chrome.getBoundingClientRect().height > window.innerHeight * 0.45) {
    issues.push({ kind: 'chrome-tall', detail: `a pinned header of ${Math.round(chrome.getBoundingClientRect().height)}px in a ${window.innerHeight}px window` });
  }
  return issues;
}

for (const path of PAGES) {
  test(`${path} has no overlap, sideways scroll or clipping from 100% to 400% zoom`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path, { waitUntil: 'networkidle' });
    // Run the scroll-reveal once so nothing below the fold is still faded out.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      window.scrollTo(0, 0);
    });
    const found: string[] = [];
    for (const zoom of ZOOMS) {
      await page.setViewportSize({ width: Math.round(1440 / zoom), height: Math.round(900 / zoom) });
      await page.waitForTimeout(200);
      for (const issue of await page.evaluate(probe)) found.push(`${Math.round(zoom * 100)}%: ${issue.kind}: ${issue.detail}`);
    }
    expect(found, `layout problems on ${path}`).toEqual([]);
  });
}
