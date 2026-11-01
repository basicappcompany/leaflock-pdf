import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// The real build module, imported rather than reimplemented: a copy of this logic in a
// test would prove nothing about the scripts that actually run.
import { assignedIds, hasDrifted, mirrorInto, scriptBlocks, soleScriptBlock, unfilledPlaceholders } from '../../scripts/skins.mjs';

/**
 * The tooling that keeps every other figure honest, finally checked itself.
 *
 * `pnpm counts` writes 13 figures into `docs/status.html` and mirrors its whole script
 * block into `docs/status2.html`; `pnpm tracker` validates the item data, the markup
 * placeholders and whether the two skins have drifted. Both scripts were edited heavily on
 * 1 November 2026 and neither had a single test — which is circular in a way worth naming:
 * if the mirror silently stopped matching, the only thing that would notice was the drift
 * check, and that lives in the other script edited the same day.
 *
 * Every case below is one that actually went wrong, or that the previous implementation
 * would have let through in silence.
 */

const repoRoot = () => new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const page = (script: string, body = '') => `<html><head></head><body>${body}<script>${script}</script></body></html>`;

describe('scriptBlocks', () => {
  it('finds the one block a status page has', () => {
    expect(scriptBlocks(page('const a = 1;'))).toEqual(['<script>const a = 1;</script>']);
  });

  it('does not swallow everything between the first and last block', () => {
    // The first version of this regex was greedy. With one block that is identical; with
    // two it matched from the first <script> to the last </script>, so a mirror would have
    // copied the skin's own markup in between straight over itself.
    const two = '<script>one</script><p>kept</p><script>two</script>';
    expect(scriptBlocks(two)).toEqual(['<script>one</script>', '<script>two</script>']);
  });
});

describe('soleScriptBlock', () => {
  it('returns the block when there is exactly one', () => {
    expect(soleScriptBlock(page('x'), 'page').block).toBe('<script>x</script>');
  });

  it('reports a missing block rather than returning nothing', () => {
    // The old code returned null here and both callers read that as "nothing to do", so a
    // skin whose script tags were broken was invisible to the mirror AND to the drift check.
    expect(soleScriptBlock('<html></html>', 'skin').error).toMatch(/no <script> block/);
  });

  it('reports more than one block', () => {
    expect(soleScriptBlock('<script>a</script><script>b</script>', 'skin').error).toMatch(/2 <script> blocks/);
  });
});

describe('mirrorInto', () => {
  it('copies the canonical script over the skin, leaving the skin markup alone', () => {
    const canonical = page('const COUNTS = { commits: 8 };');
    const skin = page('const COUNTS = { commits: 6 };', '<h1>old design</h1>');
    const result = mirrorInto(canonical, skin);

    expect(result.changed).toBe(true);
    expect(result.html).toContain('commits: 8');
    expect(result.html).not.toContain('commits: 6');
    // The whole point of two skins: the markup differs and must survive the mirror.
    expect(result.html).toContain('<h1>old design</h1>');
  });

  it('reports no change when they already match', () => {
    const same = page('const COUNTS = { commits: 8 };');
    expect(mirrorInto(same, same).changed).toBe(false);
  });

  it('inserts a script containing $& literally', () => {
    // String.replace expands $& and $1 in a replacement string. The copied script is real
    // JavaScript and may contain either, so the implementation uses a function replacer.
    const canonical = page('const re = "$& and $1";');
    const result = mirrorInto(canonical, page('const re = "old";'));
    expect(result.html).toContain('"$& and $1"');
  });

  it('refuses a skin with no script block instead of skipping it', () => {
    expect(mirrorInto(page('x'), '<html><body>broken</body></html>').error).toMatch(/no <script> block/);
  });
});

describe('hasDrifted', () => {
  it('is false when the skin matches', () => {
    const same = page('const a = 1;');
    expect(hasDrifted(same, same)).toEqual({ drifted: false });
  });

  it('is true when it does not', () => {
    expect(hasDrifted(page('const a = 1;'), page('const a = 2;'))).toEqual({ drifted: true });
  });

  it('surfaces a broken skin as an error, not as "no drift"', () => {
    expect(hasDrifted(page('const a = 1;'), '<html></html>').error).toMatch(/no <script> block/);
  });
});

describe('assignedIds', () => {
  it('finds ids the script fills, by either property', () => {
    const script = 'document.getElementById("a").textContent = x; document.getElementById("b").innerHTML = y;';
    expect([...assignedIds(script)].sort()).toEqual(['a', 'b']);
  });

  it('ignores ids that are only read', () => {
    expect([...assignedIds('const el = document.getElementById("c"); el.focus();')]).toEqual([]);
  });
});

describe('unfilledPlaceholders', () => {
  const assigned = new Set(['repoState']);

  it('catches the literal that shipped for five commits', () => {
    const markup = '<b id="repoState">0 commits · no remote</b>';
    expect(unfilledPlaceholders(assigned, markup)).toEqual([{ id: 'repoState', text: '0 commits · no remote' }]);
  });

  it('allows a dash placeholder', () => {
    expect(unfilledPlaceholders(assigned, '<b id="repoState">—</b>')).toEqual([]);
  });

  it('allows a literal declared with data-default', () => {
    // The theme toggle ships "System", which is correct when the script never runs.
    expect(unfilledPlaceholders(new Set(['themeLabel']), '<span id="themeLabel" data-default>System</span>')).toEqual([]);
  });

  it('ignores elements the script never assigns', () => {
    expect(unfilledPlaceholders(assigned, '<b id="somethingElse">a real sentence</b>')).toEqual([]);
  });
});

describe('the real status pages', () => {
  it('are in step, and both are well formed', async () => {
    // The end-to-end case, against the files themselves rather than fixtures: this is the
    // invariant `pnpm counts` maintains and `pnpm tracker` enforces.
    const root = repoRoot();
    const canonical = await readFile(join(root, 'docs/status.html'), 'utf8');
    const skin = await readFile(join(root, 'docs/status2.html'), 'utf8');

    expect(soleScriptBlock(canonical, 'status.html').error).toBeUndefined();
    expect(soleScriptBlock(skin, 'status2.html').error).toBeUndefined();
    expect(hasDrifted(canonical, skin)).toEqual({ drifted: false });
  });
});
