#!/usr/bin/env node
/**
 * Validates `docs/status.html`'s item data and prints every figure computed from it.
 *
 *   node scripts/tracker-check.mjs
 *
 * Run this after adding or removing an item — see `docs/process.md` §9. Two jobs:
 *
 * 1. **Catch the ways an edit can leave the tracker inconsistent.** Ids are the tracker's
 *    addressing scheme ("start 4.3"), so a duplicate or a mismatched phase prefix is worse
 *    than a wrong estimate: it makes a request ambiguous. An open item with no `days` and
 *    no `lead` silently contributes zero to every projection, which reads as "free".
 *
 * 2. **Print the computed schedule**, so prose in `docs/roadmap.md` that quotes a total is
 *    copied from output rather than worked out by hand. The page recomputes these on every
 *    open; this is the same arithmetic outside the browser.
 *
 * It deliberately re-implements the page's schedule model rather than importing it: if the
 * two ever disagree, that is a bug worth seeing, and the page has to stay a single file
 * that opens with no tooling.
 */
import { readFile } from 'node:fs/promises';
import { assignedIds, hasDrifted, unfilledPlaceholders } from './skins.mjs';

const PATH = 'docs/status.html';
const html = await readFile(PATH, 'utf8');

const matched = html.match(/const PHASES = (\[[\s\S]*?\n {2}\];)/);
if (!matched) {
  console.error(`${PATH}: could not find the PHASES array.`);
  process.exit(1);
}

// Item names interpolate the COUNTS block that `pnpm counts` writes, so it has to be in
// scope before the array evaluates. Evaluated together rather than stubbed: a reference
// to a figure that block does not define should fail here, not render as "undefined" on
// the page.
const countsBlock = html.match(/const COUNTS = \{[^}]*\};/);
if (!countsBlock) {
  console.error(`${PATH}: could not find the COUNTS block.`);
  process.exit(1);
}
const PHASES = eval(`${countsBlock[0]}\n(${matched[1].replace(/;$/, '')})`);

const planMatch = html.match(/const PLAN = \{([^}]*)\}/);
const perWeek = Number(planMatch?.[1].match(/workingDaysPerWeek:\s*([\d.]+)/)?.[1] ?? 3);

// The page reads today off the clock rather than storing it, so there is normally no date
// to parse out of PLAN. A pinned `today:` is still honoured, which is the only way to
// reproduce a past baseline's arithmetic; absent one, compute the same local-midnight
// today the page does — UTC would read as yesterday for the first 5.5 hours of an IST day.
const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const today =
  planMatch?.[1].match(/today:\s*"([^"]+)"/)?.[1] ??
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const problems = [];
const seen = new Map();
const all = PHASES.flatMap((phase) => phase.items.map((item) => ({ ...item, phase })));

for (const item of all) {
  const where = `${item.id} (${item.name})`;
  if (seen.has(item.id)) problems.push(`duplicate id ${item.id} — also on "${seen.get(item.id)}"`);
  seen.set(item.id, item.name);

  if (!/^\d+\.\d+$/.test(item.id ?? '')) problems.push(`${where}: id must be "<phase>.<n>"`);
  else if (Number(item.id.split('.')[0]) !== item.phase.num) {
    problems.push(`${where}: id is in phase ${item.id.split('.')[0]} but sits in phase ${item.phase.num}`);
  }

  if (item.state === 'done') {
    if (!item.when) problems.push(`${where}: done, but has no "when" ship date`);
    if (item.days || item.lead) problems.push(`${where}: done, but still carries an estimate`);
    continue;
  }

  if (!item.days && !item.lead) {
    problems.push(`${where}: open with neither "days" nor "lead" — it would count as free`);
  }
  if (item.days && item.lead) problems.push(`${where}: has both "days" and "lead" — pick one`);

  const dispositions = ['blocker', 'after', 'afterLaunch'].filter((key) => item[key]);
  if (dispositions.length === 0) {
    problems.push(`${where}: open with no disposition — needs blocker, after, or afterLaunch`);
  }
  if (item.blocker && (item.after || item.afterLaunch)) {
    problems.push(`${where}: marked a blocker and also deferred`);
  }
  if (item.lead && !item.owner) problems.push(`${where}: waits on someone, but names no owner`);
}

for (const phase of PHASES) {
  const done = phase.items.filter((i) => i.state === 'done').length;
  const expected =
    done === phase.items.length
      ? 'done'
      : done > 0
        ? 'progress'
        : phase.items.every((i) => i.state === 'external')
          ? 'external'
          : 'pending';
  if (phase.state !== expected) {
    problems.push(
      `phase ${phase.num} (${phase.name}): state is "${phase.state}" but ${done}/${phase.items.length} are done, which reads as "${expected}"`,
    );
  }
}

// The page's own model, re-implemented: engineering blockers run one at a time, anything
// waiting on another person runs in parallel from today.
const DAY = 86400000;
const start = new Date(today);
const addDays = (date, n) => new Date(date.getTime() + Math.round(n) * DAY);
const fmt = (date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const calendar = (workingDays) => workingDays * (7 / perWeek);

let cursor = 0;
const dates = new Map();
for (const item of all.filter((i) => i.blocker)) {
  if (item.days) dates.set(item.id, addDays(start, (cursor += calendar(item.days))));
  else dates.set(item.id, addDays(start, item.lead ?? 0));
}
const launch = new Date(Math.max(...[...dates.values()].map((d) => d.getTime())));
const remainingDays = all.filter((i) => i.days && !i.afterLaunch).reduce((s, i) => s + i.days, 0);
const longestExternal = Math.max(...all.filter((i) => i.lead && !i.afterLaunch).map((i) => i.lead));
const fullPlan = addDays(start, Math.max(calendar(remainingDays), longestExternal));

const open = all.filter((i) => i.state !== 'done');
const blockers = all.filter((i) => i.blocker);

console.log(
  [
    `items             ${all.length} (${all.length - open.length} done, ${open.length} open)`,
    `open build days   ${open.filter((i) => i.days).reduce((s, i) => s + i.days, 0)}`,
    `blockers          ${blockers.length} — ${blockers.map((i) => i.id).join(', ')}`,
    `blocking days     ${blockers.filter((i) => i.days).reduce((s, i) => s + i.days, 0)}`,
    `launch-ready      ${fmt(launch)}`,
    `whole roadmap     ${fmt(fullPlan)} (${remainingDays} working days at ${perWeek}/week)`,
    `  at 5 days/week  ${fmt(addDays(start, remainingDays * (7 / 5)))}`,
    '',
    'Phase totals, worked in order:',
    ...(() => {
      let running = 0;
      return PHASES.map((phase) => {
        const days = phase.items.filter((i) => i.days && !i.afterLaunch).reduce((s, i) => s + i.days, 0);
        running += days;
        const done = phase.items.filter((i) => i.state === 'done').length;
        return `  phase ${phase.num}  ${String(done).padStart(2)}/${phase.items.length} done · ${String(days).padStart(5)}d${days ? ` · ends ${fmt(addDays(start, calendar(running)))}` : ''}`;
      });
    })(),
  ].join('\n'),
);

/**
 * Elements the page's own script fills, but whose markup still ships real text.
 *
 * The header carried `id="repoState"` reading "0 commits " . no remote as a literal, with
 * nothing anywhere assigning it — so through the first push, a green CI run and five
 * commits, the most prominent line on the page still said there was no repository. No
 * existing check could see it: `pnpm counts` owns the COUNTS block, this script owned the
 * item data, and neither looks at the markup in between.
 *
 * The invariant: if the script assigns an element, its markup must ship an empty string, a
 * dash, or a literal declared with `data-default` — never an undeclared sentence that will
 * be believed if the assignment is missing or broken. `data-default` is for a literal that
 * is genuinely correct unassigned, like the theme toggle reading "System".
 */
/**
 * Both skins, not just the canonical one.
 *
 * `pnpm counts` mirrors the canonical page's script block into `docs/status2.html`, so
 * their data cannot drift. Their markup is edited by hand and can, and a placeholder left
 * unfilled is the bug that had the header reading "0 commits, no remote" through five
 * commits. The logic for both checks lives in scripts/skins.mjs, where it is tested.
 */
const assigned = assignedIds(html);
const SKINS = [PATH, 'docs/status2.html'];
for (const skin of SKINS) {
  let markup;
  try {
    markup = await readFile(skin, 'utf8');
  } catch {
    continue; // skin deleted; nothing to check
  }
  const where = skin === PATH ? '' : ` (${skin.replace('docs/', '')})`;

  for (const { id, text } of unfilledPlaceholders(assigned, markup)) {
    problems.push(
      `#${id}${where} ships the literal "${text}" but the script overwrites it — use a dash placeholder`,
    );
  }

  if (skin === PATH) continue;
  const state = hasDrifted(html, markup);
  // An error here means one of the two files has no single <script> block at all, which
  // the old version treated as nothing to do: it checked `mine && canonical` and fell
  // through when either was missing, so a broken skin passed both this and the mirror.
  if (state.error) {
    problems.push(`${skin}: ${state.error}`);
  } else if (state.drifted) {
    problems.push(`${skin} has drifted from ${PATH} — run 'pnpm counts' to mirror it`);
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'} in ${PATH}:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error('\nAny prose quoting the figures above needs the same pass (process.md §9).');
  process.exit(1);
}
console.log(`\n${PATH}: item data consistent.`);
