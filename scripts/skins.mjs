/**
 * The shared logic behind the two status-page skins, in one place so it can be tested.
 *
 * `docs/status.html` is canonical. `docs/status2.html` is the design from before the
 * 1 November reskin, kept to compare against. Both are deliberately single files that open
 * with no tooling, so their data cannot be factored into a shared module — instead
 * `pnpm counts` mirrors the canonical page's whole `<script>` block into the other, and
 * `pnpm tracker` fails if they have drifted.
 *
 * This module exists because both halves of that arrangement lived in different scripts,
 * each with its own copy of the same regex, and neither had a test. The mirror is what
 * keeps every figure on the second page true; a silent failure there is a second tracker
 * quietly disagreeing with the first, which is worse than having only one.
 */

/**
 * Every `<script>…</script>` in a document.
 *
 * Non-greedy on purpose. The first version of this was greedy, which happened to work
 * because the page has exactly one block — but it would have matched from the first
 * `<script>` to the *last* `</script>` the moment a second one was added, and mirrored
 * everything in between over the skin's own markup.
 */
export function scriptBlocks(html) {
  return [...html.matchAll(/<script>[\s\S]*?<\/script>/g)].map((match) => match[0]);
}

/**
 * The one script block a status page is expected to have.
 *
 * Returns `{ block }` or `{ error }` — never null quietly. The earlier version returned
 * nothing when a file had no block, and both the mirror and the drift check treated that
 * as "nothing to do", so a skin whose script tags were broken was invisible to both.
 */
export function soleScriptBlock(html, label) {
  const blocks = scriptBlocks(html);
  if (blocks.length === 1) return { block: blocks[0] };
  if (blocks.length === 0) return { error: `${label} has no <script> block` };
  return { error: `${label} has ${blocks.length} <script> blocks; expected exactly one` };
}

/**
 * The skin's markup with the canonical script block swapped in.
 *
 * `changed` is false when they already match, so a caller can report "already identical"
 * rather than rewriting a file for nothing.
 */
export function mirrorInto(canonicalHtml, skinHtml, labels = {}) {
  const source = soleScriptBlock(canonicalHtml, labels.source ?? 'the canonical page');
  if (source.error) return { error: source.error };

  const target = soleScriptBlock(skinHtml, labels.skin ?? 'the skin');
  if (target.error) return { error: target.error };

  if (source.block === target.block) return { html: skinHtml, changed: false };

  // A function replacer, so a `$&` or `$1` inside the copied script is inserted literally
  // rather than being expanded by String.replace.
  return { html: skinHtml.replace(target.block, () => source.block), changed: true };
}

/** Whether a skin's script matches the canonical one. */
export function hasDrifted(canonicalHtml, skinHtml) {
  const result = mirrorInto(canonicalHtml, skinHtml);
  if (result.error) return { error: result.error };
  return { drifted: result.changed };
}

/** Element ids the page's own script assigns text or markup to. */
export function assignedIds(html) {
  return new Set(
    [...html.matchAll(/getElementById\(["'](\w+)["']\)\s*\.\s*(?:textContent|innerHTML)\s*=/g)].map(
      (match) => match[1],
    ),
  );
}

/**
 * Elements the script fills, but whose markup still ships a sentence.
 *
 * The invariant: if the script assigns an element, its markup must ship a blank, a dash, or
 * a literal declared with `data-default` — never an undeclared claim that will be believed
 * when the assignment is missing. The header carried `id="repoState"` reading
 * "0 commits, no remote" with nothing assigning it, so through the first push, a green CI
 * run and five commits the most prominent line on the page still said there was no repo.
 */
export function unfilledPlaceholders(assigned, markup) {
  const found = [];
  for (const [, id, attributes, literal] of markup.matchAll(/<[^>]*id="(\w+)"([^>]*)>([^<]*)</g)) {
    const text = literal.trim();
    if (!assigned.has(id)) continue;
    if (text.length <= 2) continue; // a dash or a blank is a deliberate placeholder
    if (attributes.includes('data-default')) continue; // declared correct unassigned
    found.push({ id, text });
  }
  return found;
}
