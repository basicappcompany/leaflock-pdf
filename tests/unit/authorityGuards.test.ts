import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards for the rules that keep Dodo and the server the only authority on who has paid and what may run.
 * Each reads the source and fails with the file and line, the way statedLimits.test.ts does for prose.
 */

const root = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SKIP = new Set(['node_modules', 'dist', '.astro', 'public', 'test-results', '.git']);

function walk(dir: string, extensions: readonly string[]): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('dist-')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path, extensions));
    else if (extensions.some((extension) => name.endsWith(extension))) out.push(path);
  }
  return out;
}

const posix = (path: string): string => relative(root, path).split(sep).join('/');
/**
 * The file's code with its comments blanked out, line numbers intact: a comment explaining why a name is
 * forbidden must not trip the guard that forbids it.
 */
function stripComments(text: string): string {
  const blank = (comment: string): string => comment.replace(/[^\n]/g, ' ');
  // A block comment, or a // comment that does not follow a colon, quote or backslash (so a URL or a string stays).
  const comments = /\/\*[\s\S]*?\*\/|(^|[^:'"`\\])\/\/[^\n]*/g;
  return text.replace(comments, (match, lead: string | undefined) => (lead ? lead + blank(match.slice(lead.length)) : blank(match)));
}

const read = (path: string): string => stripComments(readFileSync(path, 'utf8'));

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

const sourceFiles = ['src', 'functions', 'workers'].flatMap((dir) => walk(join(root, dir), ['.ts', '.tsx', '.astro', '.mjs']));

describe('who may write a plan', () => {
  /**
   * The plan columns change only through setUserPlan (src/lib/server/db.ts), and setUserPlan is called only
   * from the webhook and from the Dodo re-check (src/lib/server/dodoSync.ts, which /api/billing/refresh, the
   * reconcile sweep and the visit check all go through). Anything else writing them would be granting a plan from
   * something other than a verified webhook or a Dodo re-read.
   */
  const ALLOWED = new Set(['src/lib/server/db.ts', 'functions/api/billing/webhook.ts', 'src/lib/server/dodoSync.ts']);
  const PLAN_COLUMNS = '(plan|plan_status|current_period_end|subscription_id|dodo_customer_id|dodo_payment_id|billing_event_at)';

  it('calls setUserPlan only from the webhook and the Dodo re-check', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles) {
      const name = posix(file);
      if (ALLOWED.has(name)) continue;
      const text = read(file);
      for (const match of text.matchAll(/\bsetUserPlan\s*\(/g)) offenders.push(`${name}:${lineOf(text, match.index!)}`);
    }
    expect(offenders, `plan written outside the allowed files: ${offenders.join(', ')}`).toEqual([]);
  });

  it('runs no SQL that updates a plan column outside src/lib/server/db.ts', () => {
    const offenders: string[] = [];
    const update = new RegExp(`UPDATE\\s+users\\s+SET[^;]*?\\b${PLAN_COLUMNS}\\s*=`, 'gis');
    for (const file of sourceFiles) {
      const name = posix(file);
      if (name === 'src/lib/server/db.ts') continue;
      const text = read(file);
      for (const match of text.matchAll(update)) offenders.push(`${name}:${lineOf(text, match.index!)}`);
    }
    expect(offenders, `plan columns updated outside db.ts: ${offenders.join(', ')}`).toEqual([]);
  });
});

describe('what reaches the browser', () => {
  const clientFiles = sourceFiles.filter((file) => {
    const name = posix(file);
    return /\.(ts|tsx)$/.test(name) && (name.startsWith('src/components/') || (name.startsWith('src/lib/') && !name.startsWith('src/lib/server/')));
  });

  it('has no client module importing a server-only module', () => {
    const offenders: string[] = [];
    for (const file of clientFiles) {
      const text = read(file);
      // Value imports only: `import type` is erased at build, so nothing from the module reaches the browser.
      for (const match of text.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+['"]([^'"]*)['"]/g)) {
        if (/(^|\/)server(\/|$)/.test(match[1]!) || /functions\//.test(match[1]!)) offenders.push(`${posix(file)}:${lineOf(text, match.index!)} imports ${match[1]}`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('has no client module reading the signing key or a server secret', () => {
    const offenders: string[] = [];
    for (const file of clientFiles) {
      const text = read(file);
      for (const match of text.matchAll(/ENTITLEMENT_PRIVATE_KEY|RECONCILE_TOKEN|DODO_API_KEY|DODO_WEBHOOK_SECRET/g)) {
        offenders.push(`${posix(file)}:${lineOf(text, match.index!)} mentions ${match[0]}`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});

describe('the client never decides from the plan whether to ask the server', () => {
  const clientFiles = sourceFiles.filter((file) => {
    const name = posix(file);
    return /\.(ts|tsx)$/.test(name) && (name.startsWith('src/components/') || (name.startsWith('src/lib/') && !name.startsWith('src/lib/server/')));
  });
  const PLAN_READS = /\b(getCachedPlan|isPaidPlan)\b|leaflock_signed_in|document\.cookie/;

  it('keeps usage.ts, the only caller of the claim endpoint, free of any plan or cookie read', () => {
    const callers = clientFiles.filter((file) => read(file).includes('/api/usage/claim')).map(posix);
    expect(callers).toEqual(['src/lib/usage.ts']);
    expect(read(join(root, 'src/lib/usage.ts'))).not.toMatch(PLAN_READS);
  });

  it('keeps every module that claims a run free of plan or cookie reads', () => {
    const offenders: string[] = [];
    for (const file of clientFiles) {
      const text = read(file);
      if (!/\b(claimJob|withClaim)\b/.test(text)) continue;
      for (const match of text.matchAll(new RegExp(PLAN_READS, 'g'))) offenders.push(`${posix(file)}:${lineOf(text, match.index!)} reads ${match[0]}`);
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});
