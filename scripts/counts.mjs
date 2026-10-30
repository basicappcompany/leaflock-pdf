#!/usr/bin/env node
/**
 * Prints every count the docs used to hold by hand — tools, tiers, worker operations,
 * tests, guides, landings — in one command, so no file has to store a number that goes
 * stale the moment something ships.
 *
 *   node scripts/counts.mjs
 *
 * Written after finding three drifted numbers in `docs/roadmap.md` in one pass, two of
 * them hand-typed the same day. Counting is cheap; keeping twenty copies in sync is not.
 *
 * Browser tests come from `playwright test --list` rather than from counting `test(`
 * declarations: several specs generate their cases in a loop (`seo.spec.ts` walks a list
 * of paths), so declarations undercount the real suite by about half. `--list` needs no
 * build and takes a few seconds.
 */
import { exec } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(exec);
const read = (path) => readFile(path, 'utf8');

async function walk(dir, match) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path, match)));
    else if (match.test(entry.name)) out.push(path);
  }
  return out;
}

/** Entries in a `[ … ] as const` array literal, excluding the type annotation that
 * follows it — which also contains `{ id:` and silently added one to every count. */
function arrayEntries(source, declaration) {
  const start = source.indexOf(declaration);
  const end = source.indexOf('] as const', start);
  return (source.slice(start, end).match(/^ {2}\{ id:/gm) ?? []).length;
}

const registry = await read('src/tools/registry.ts');
const tools = arrayEntries(registry, 'export const tools');
const landings = arrayEntries(registry, 'export const landings');
const toolsBlock = registry.slice(registry.indexOf('export const tools'), registry.indexOf('] as const'));
/**
 * Counted per tier rather than "paid or not": item 4.9 moved the six professional tools
 * from Pro to Practice on 30 October 2026, and a single `tier: 'pro'` match then reported
 * a catalogue of 43 free tools and nothing paid.
 */
const countTier = (tier) => (toolsBlock.match(new RegExp(`tier: '${tier}'`, 'g')) ?? []).length;
const pro = countTier('pro');
const practice = countTier('practice');
const paid = pro + practice;

const opsSource = await read('src/lib/pdf/ops/index.ts');
const ops = (opsSource.slice(opsSource.indexOf('export const ops = {'), opsSource.indexOf('} satisfies')).match(/^ {2}\w+,$/gm) ?? []).length;

let unit = 0;
for (const file of await walk('tests/unit', /\.test\.ts$/)) {
  unit += ((await read(file)).match(/^\s*(?:it|test)(?:\.\w+)?\(/gm) ?? []).length;
}

let browser = 'unavailable (run `npx playwright test --list`)';
let browserCount = null;
let browserFiles = null;
try {
  const { stdout } = await run('npx playwright test --list', { maxBuffer: 1024 * 1024 * 16 });
  const matched = stdout.match(/Total: (\d+) tests? in (\d+) files?/);
  if (matched) {
    browserCount = Number(matched[1]);
    browserFiles = Number(matched[2]);
    browser = `${matched[1]} in ${matched[2]} files`;
  }
} catch {
  /* Playwright not installed, or a spec failed to load: the other counts still stand. */
}

const guides = (await walk('src/content/guides/en', /\.md$/)).length;
const compares = (await walk('src/content/compare/en', /\.md$/)).length;

const usageSource = await read('src/lib/server/usage.ts');
const constant = (name) => Number(usageSource.match(new RegExp(`${name} = (\\d+)`))?.[1]);
const anonymousDaily = constant('ANONYMOUS_DAILY_JOBS');
const freeAccountDaily = constant('FREE_ACCOUNT_DAILY_JOBS');

/**
 * `docs/status.html` derives everything it can from its own item data, but a few figures
 * live in the codebase instead — tool and test totals, and the allowances the server
 * actually grants. Those used to be typed into that page, which is how its free-tier
 * figure came to advertise a third of the real cap (`docs/process.md` §8).
 *
 * So the script owns one `COUNTS` block in the page and rewrites it whole. Everything
 * there — the tiles, the Phase 3 item names, the free-tier line — reads from that block,
 * which makes adding a metric a field here plus a reference there, and makes a stale
 * figure on that page impossible rather than merely unlikely.
 *
 * A figure Playwright could not supply keeps its previous value instead of being written
 * as `null`, and the output says the block was left alone.
 */
async function syncStatusHtml() {
  const path = 'docs/status.html';
  const html = await read(path);
  const pattern = /(const COUNTS = )\{[^}]*\}(;)/;
  if (!pattern.test(html)) return 'skipped — no COUNTS block in the page';
  if (browserCount === null) return 'left alone — no browser-test count available';

  const figures = {
    tools,
    pro,
    practice,
    ops,
    landings,
    guides,
    compares,
    unit,
    browser: browserCount,
    browserFiles,
    anonymousDaily,
    freeAccountDaily,
  };
  const block = `{\n${Object.entries(figures)
    .map(([key, value]) => `    ${key}: ${value},`)
    .join('\n')}\n  }`;

  const next = html.replace(pattern, `$1${block}$2`);
  if (next === html) return `already current (${tools} tools, ${unit}/${browserCount} tests)`;
  await writeFile(path, next, 'utf8');
  return `rewritten (${Object.keys(figures).length} figures)`;
}

const statusNote = await syncStatusHtml();

console.log(
  [
    `tools            ${tools} (${tools - paid} free, ${pro} Pro, ${practice} Practice)`,
    `worker ops       ${ops}`,
    `landings         ${landings}`,
    `unit tests       ${unit}`,
    `browser tests    ${browser}`,
    `guides           ${guides}`,
    `comparison pages ${compares}`,
    `free-tier cap    ${anonymousDaily}/day anonymous, ${freeAccountDaily}/day free account`,
    '',
    `status.html COUNTS ${statusNote}`,
    'Pages: `pnpm build` prints "N page(s) built" — the only count that needs a build.',
  ].join('\n'),
);
