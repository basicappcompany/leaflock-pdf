import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ANONYMOUS_DAILY_JOBS, FREE_ACCOUNT_DAILY_JOBS } from '../../src/lib/server/usage';

/**
 * Every place the site states a daily allowance in words must agree with the constants
 * the server actually enforces.
 *
 * This exists because it already went wrong. The allowances were raised 5 → 20 and
 * 30 → 60 on 28 October 2026, and `docs/TODO.md` §5 recorded that "no other file needed a
 * change" because the dashboard meter and the limit messages interpolate `{used}`/`{limit}`.
 * That was true of the meter and false of the site: the pricing page, the help page, the
 * sign-up note, the account panel and both comparison pages each spelled the old numbers
 * out in prose, so for a day the product advertised a third of the allowance it granted —
 * on the pricing page, and in the one table where a more generous free tier is the
 * competitive argument. Six wrong strings, none of which a type checker or any existing
 * test could see.
 *
 * Interpolating everywhere would not have caught it either: two of the six are Markdown
 * content, which has no placeholders to interpolate. A test that reads the prose is the
 * only thing that covers both halves of the surface.
 */

/** Phrasings that state an allowance. Each capture group is a number that must match. */
const CLAIM_PATTERNS = [
  /(\d+)(?:\s+tools?)?\s+a day/gi,
  /(\d+)\s*\/\s*day/gi,
  /from (\d+) tools? to (\d+)/gi,
];

/**
 * Numbers a stated allowance is allowed to be. If a competitor's published limit ever
 * needs stating in this phrasing on a comparison page, add it here with a source — the
 * point is that it becomes a visible decision rather than a number nobody can check.
 */
const ALLOWED = new Set([ANONYMOUS_DAILY_JOBS, FREE_ACCOUNT_DAILY_JOBS]);

const ROOTS = ['src/content', 'src/i18n'];
const EXTENSIONS = ['.md', '.ts'];

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

describe('stated daily allowances', () => {
  it('match the constants the server enforces, everywhere they are written out', async () => {
    const repoRoot = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
    const files = (await Promise.all(ROOTS.map((root) => walk(join(repoRoot, root))))).flat();
    expect(files.length, 'found no content or i18n files to check').toBeGreaterThan(0);

    const wrong: string[] = [];
    for (const file of files) {
      const text = await readFile(file, 'utf8');
      for (const pattern of CLAIM_PATTERNS) {
        for (const match of text.matchAll(pattern)) {
          for (const captured of match.slice(1).filter(Boolean)) {
            if (ALLOWED.has(Number(captured))) continue;
            const line = text.slice(0, match.index).split('\n').length;
            wrong.push(
              `${relative(repoRoot, file).replace(/\\/g, '/')}:${line} says "${match[0].trim()}"`,
            );
          }
        }
      }
    }

    expect(
      wrong,
      `These state an allowance that is not ${ANONYMOUS_DAILY_JOBS} (anonymous) or ` +
        `${FREE_ACCOUNT_DAILY_JOBS} (free account), the values in ` +
        `src/lib/server/usage.ts:\n  ${wrong.join('\n  ')}\n`,
    ).toEqual([]);
  });

  it('keeps an account worth more than no account', () => {
    // The reason both numbers exist. If a future change inverts them, every "a free
    // account raises your limit" string on the site becomes false at once.
    expect(FREE_ACCOUNT_DAILY_JOBS).toBeGreaterThan(ANONYMOUS_DAILY_JOBS);
  });
});
