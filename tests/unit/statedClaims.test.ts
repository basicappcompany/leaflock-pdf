import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SESSION_COOKIE_NAME } from '../../src/lib/server/session';

/**
 * The privacy claims the site states in prose, checked against what the product does.
 *
 * The third of these tests, after `statedLimits` (allowances) and `statedPrices`. Those two
 * catch a number that stopped matching a constant. This one catches something worse and
 * harder to see: a *claim* that was true when it was written and was quietly falsified by a
 * feature shipping somewhere else.
 *
 * It was written because that had already happened three times, found while building the
 * claims page (roadmap 3.5):
 *
 * - `security.md` said "**No cookies.** The site doesn't set any" — but signing in sets a
 *   session cookie, and has since accounts shipped.
 * - `security.md` said "**No account.** There's nothing to sign up for" — there are three
 *   ways to sign up.
 * - `security.md` said files are not stored "on your device or ours" — the recent-work
 *   shelf keeps a finished file in IndexedDB, which is exactly on your device.
 *
 * None of those was a lie when written, and no type checker or existing test could see them
 * go stale. The pricing page at least fails loudly when a number moves; a trust page just
 * keeps asserting something that is no longer so, on the pages a buyer reads most carefully.
 */

/**
 * Phrasings that must not appear in anything shipped, with the reason each one is banned.
 *
 * Two kinds. The first is already false. The second is true today and would be falsified by
 * server-backed retention (roadmap 2.12), which is planned and opt-in — the wording that
 * survives it is "nothing leaves your device *unless you ask it to*", and the point of
 * banning the absolute form is that `claims.md` is written to be quoted verbatim, so a
 * sentence we would have to retire is a sentence that will be quoted back at us.
 */
const BANNED: readonly { pattern: RegExp; why: string }[] = [
  {
    pattern: /nothing can leave your (device|browser|machine)/i,
    why: 'absolute form: server-backed retention (2.12) is planned and opt-in, so say "nothing leaves your device unless you ask it to"',
  },
  {
    pattern: /files? can never leave/i,
    why: 'same absolute form as above',
  },
  {
    pattern: /there are no accounts/i,
    why: 'accounts exist (magic link, password, Google) — say that no account is *needed*',
  },
  {
    // Scoped to claims about *us*: cookies.md also asks whether the hosting provider sets
    // any of its own, which is a different subject and an open question for 6.3.
    pattern: /(leaflockpdf\.com|the site|we) (does not|doesn.t) set any cookies/i,
    why: `signing in sets ${SESSION_COOKIE_NAME} — qualify the claim with what happens signed in`,
  },
  {
    pattern: /on your device or ours/i,
    why: 'the recent-work shelf keeps files on the device by design — separate the two halves of the claim',
  },
];

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

const repoRoot = () => new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

async function shippedText(): Promise<{ file: string; text: string }[]> {
  const root = repoRoot();
  const files = (await Promise.all(ROOTS.map((dir) => walk(join(root, dir))))).flat();
  return Promise.all(
    files.map(async (file) => ({
      file: relative(root, file).split(sep).join('/'),
      text: await readFile(file, 'utf8'),
    })),
  );
}

describe('stated privacy claims', () => {
  it('states no claim the product contradicts', async () => {
    const pages = await shippedText();
    expect(pages.length, 'found no content or i18n files to check').toBeGreaterThan(0);

    const wrong: string[] = [];
    for (const { file, text } of pages) {
      // Test fixtures for this file would otherwise trip every pattern in it.
      if (file.endsWith('statedClaims.test.ts')) continue;
      for (const { pattern, why } of BANNED) {
        const match = pattern.exec(text);
        if (!match) continue;
        const line = text.slice(0, match.index).split('\n').length;
        wrong.push(`${file}:${line} says "${match[0]}" — ${why}`);
      }
    }

    expect(wrong, `These claims do not match the product:\n  ${wrong.join('\n  ')}\n`).toEqual([]);
  });

  it('keeps the claims page on the wording that survives server-backed retention', async () => {
    const root = repoRoot();
    const claims = await readFile(join(root, 'src/content/pages/en/claims.md'), 'utf8');

    // The sentence the page is built around, and the reason 2.12 will not invalidate it.
    expect(claims).toContain('unless you ask it to');

    // And the page has to say that the change is coming, rather than being amended quietly
    // on the day. This is the promise the page makes about itself.
    expect(claims.toLowerCase()).toContain('what is planned');
  });

  it('names the session cookie on the pages that describe cookies', async () => {
    // Coupled to the constant so that renaming the cookie fails here rather than leaving
    // two trust pages naming one that no longer exists.
    const root = repoRoot();
    for (const page of ['claims.md', 'cookies.md', 'security.md']) {
      const text = await readFile(join(root, 'src/content/pages/en', page), 'utf8');
      if (!/cookie/i.test(text)) continue;
      expect(text, `${page} describes cookies but does not name ${SESSION_COOKIE_NAME}`).toContain(
        SESSION_COOKIE_NAME,
      );
    }
  });
});
