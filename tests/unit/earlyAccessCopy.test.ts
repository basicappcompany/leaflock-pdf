import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { paidPlansAvailable, proToolsGated } from '../../src/lib/pricing';

/**
 * The promise that paid tools are free right now, checked against whether they are.
 *
 * Written for roadmap 4.12, which is the item that will flip `paidPlansAvailable` and end
 * early access. The flip is one line; the damage is everywhere else. About eight strings
 * across the site state, in prose, that the Pro and Practice tools are free during early
 * access, and none of them interpolate the flag — so the moment it goes true the site is
 * charging for tools it is still promising for nothing. That is the `statedClaims` failure
 * mode with money attached, and it is the reason 4.12 carries a day rather than an hour.
 *
 * This test is written now, while the flag is still false, so it is in place before the
 * change rather than after it.
 *
 * Two files are deliberately out of scope:
 *
 * - `src/i18n/en/common.ts` holds the `note` / `noteGated` pair for each tier. Those are
 *   the one piece of copy that *is* switched by the flag (`[tool].astro` picks between
 *   them), so they are correct in both states and must not be rewritten.
 * - `src/content/pages/en/business.md` says "early access" about the Business edition,
 *   which is a different early access entirely: it means the product is not yet generally
 *   released, and it has nothing to do with whether Pro and Practice cost money.
 */

const ROOTS = ['src/content', 'src/i18n'];
const EXTENSIONS = ['.md', '.ts'];
const EXEMPT = ['src/i18n/en/common.ts', 'src/content/pages/en/business.md'];

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return walk(path);
      return EXTENSIONS.some((ext) => entry.name.endsWith(ext)) ? [path] : [];
    }),
  );
  return files.flat();
}

/** Sentences that both mention early access and claim something is free. */
async function freePromises(): Promise<{ file: string; line: number; text: string }[]> {
  const root = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const files = (await Promise.all(ROOTS.map((dir) => walk(join(root, dir))))).flat();
  const found: { file: string; line: number; text: string }[] = [];

  for (const file of files) {
    const relativePath = relative(root, file).split(sep).join('/');
    if (EXEMPT.includes(relativePath)) continue;

    const text = await readFile(file, 'utf8');
    // Sentence-ish: enough to keep "early access" and "free" in the same breath rather
    // than matching a page that mentions both paragraphs apart.
    for (const [index, sentence] of text.split(/(?<=[.!?])\s+|\n/).entries()) {
      if (!/early access/i.test(sentence)) continue;
      if (!/\bfree\b/i.test(sentence)) continue;
      const offset = text.indexOf(sentence);
      const line = offset >= 0 ? text.slice(0, offset).split('\n').length : index + 1;
      found.push({ file: relativePath, line, text: sentence.trim().slice(0, 120) });
    }
  }
  return found;
}

describe('early-access copy', () => {
  it('matches whether the paid tools are actually free', async () => {
    const promises = await freePromises();

    if (paidPlansAvailable) {
      // The flip has happened: every one of these is now a false promise, and the site is
      // charging for tools it still advertises as free.
      expect(
        promises.map((p) => `${p.file}:${p.line} "${p.text}"`),
        'paid plans are open, so these can no longer promise free access (roadmap 4.12)',
      ).toEqual([]);
      return;
    }

    // Guards the guard. While the flag is false these promises SHOULD exist, so finding
    // none means the patterns above have stopped matching real copy and the assertion
    // above would pass for the wrong reason the day it matters most.
    expect(
      promises.length,
      'found no early-access promises at all — the patterns here have gone stale',
    ).toBeGreaterThan(3);
  });

  it('keeps the gate tied to whether anything can be bought', () => {
    // The coupling src/lib/pricing.ts explains: payments may open while the tools stay
    // free, but tools must never be locked with no way to buy them. If this inverts, a
    // visitor hits a paywall for a plan that does not exist.
    expect(proToolsGated && !paidPlansAvailable).toBe(false);
  });
});
