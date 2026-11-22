# Skins archive: the sixteen-skin picker, removed 23 November 2026

On 23 November 2026 the owner finalised the UI/UX theme: **Leaf** (the default, defined once on `:root` in
`src/styles/global.css`) is the only look, and the fifteen alternates and their header picker were removed. This
one file holds everything taken out, so that putting it back is a paste, not a re-derivation.

> **Fastest revert:** `git revert <the removal commit>` restores all of it, including the trust-page wording and
> the locale catalogues. This file is for when that commit has been buried, squashed or conflicts.

## What the system was

- **Fifteen alternate skins**, each a block in `src/styles/skins.css` that overrides the same token set as `:root`
  under `html[data-skin="<id>"]` (plus the sixteenth, "Playful Rounded", the pre-17-November default).
- **`src/lib/skins.ts`**, the registry: id, name, blurb and swatch colour per skin.
- **`src/components/SkinPicker.astro`**, the header dropdown. Picking one writes a `leaflock_skin` cookie (a
  session cookie, or a one-year cookie for a signed-in Pro/Practice member, checked against `/api/auth/me` only
  when a skin is picked) and reloads.
- **A pre-paint line in `Base.astro`** that copies the cookie to `<html data-skin>` before first paint.
- **Picker CSS in `global.css`**, plus the phone-header rules that gave the picker a place in the Menu.
- **Strings:** `common.appearance.*` in English and in every other locale.
- **Trust pages** describing the cookie: `claims`, `cookies`, `privacy`, `security`, `help` and three `compare` pages.

Not part of this and **not removed**: `scripts/skins.mjs`, `tests/unit/skins.test.ts` and `docs/status2.html`. Those
are the two *status-page* skins (`docs/process.md`) and share only the word.

## How to put it back

1. Recreate the three files below (`src/styles/skins.css`, `src/lib/skins.ts`, `src/components/SkinPicker.astro`).
2. Apply the **Base.astro**, **global.css**, **NavToggle.astro** and **tests** hunks. Each shows what was there; the
   removal commit's diff shows exactly where.
3. Re-add the English `appearance` block to `src/i18n/en/common.ts`, then restore the other locales with
   `node scripts/translate.mjs --patch skins-locales.json` (the JSON in the last section, saved to a file).
4. Put the trust-page sentences back (section "Trust-page wording").
5. `pnpm check`, `pnpm test`, then `pnpm test:e2e tests/e2e/mobile.spec.ts tests/e2e/zoomLayout.spec.ts tests/e2e/accessibility.spec.ts`.
   Note `tests/e2e/performance.spec.ts`: the HTML budget carries a comment about skins.css being inlined in every page.
6. In `CLAUDE.md` and `docs/design.md` §10, undo the "removed" notes.


## `src/styles/skins.css`

````css
/*
 * Skin picker — see src/lib/skins.ts for the picker UI's registry (names, blurbs,
 * swatches) and src/components/SkinPicker.astro for the header dropdown that lets a
 * visitor choose one. Applying a skin is just overriding the same tokens global.css
 * already defines on :root, scoped under `html[data-skin="<id>"]` — every component
 * that already reads --color-*, --radius* and --shadow* re-skins automatically,
 * nothing here touches markup.
 *
 * "default" has no attribute at all (data-skin unset) and lives on :root itself in
 * global.css, so a first-time visitor with nothing stored gets it with zero extra CSS
 * and zero flash — these are the fifteen alternates. Base.astro's inline pre-paint
 * script (mirroring the existing theme script) sets data-skin from a cookie before
 * first paint when a visitor has chosen one of these instead.
 */

/* Three tokens the alternates never set, so they used to inherit them from :root. The default changed on
   17 November 2026 (a gold Pro colour and a lighter base shadow), and the owner asked that every other skin
   stay exactly as it was, so the old inherited values are pinned here for all of them. A skin that sets one
   itself (Playful Rounded sets all three) still wins, because its selector comes later with the same weight. */
html[data-skin] {
  --color-pro: light-dark(#6b3fa0, #c9a6f5);
  --color-pro-soft: light-dark(#f1e9fb, #2c2238);
  --shadow: light-dark(0 1px 3px rgb(0 0 0 / 0.08), 0 1px 3px rgb(0 0 0 / 0.5));
}

/* The site's default until 17 November 2026, kept as an alternate now that "Leaf" is the default.
   These are the values global.css used then, including the purple Pro colour that the other
   alternates no longer share (they inherit the default's gold). */
html[data-skin='playful-rounded'] {
  --color-bg: light-dark(#fffaf3, #1c1420);
  --color-surface: light-dark(#ffffff, #241a2c);
  --color-surface-2: light-dark(#f6f0e8, #2c2034);
  --color-text: light-dark(#221c2b, #f3e9f7);
  --color-muted: light-dark(#6d6480, #b29fc0);
  --color-border: light-dark(#f0e7e2, #3a2a44);
  --color-accent: light-dark(#b93824, #ff7a63);
  --color-accent-hover: light-dark(#96301e, #ff9682);
  --color-on-accent: light-dark(#ffffff, #200804);
  --color-accent-soft: light-dark(#ffe8e3, #3a1812);
  --color-pro: light-dark(#6b3fa0, #c9a6f5);
  --color-pro-soft: light-dark(#f1e9fb, #2c2238);
  --shadow: light-dark(0 1px 3px rgb(0 0 0 / 0.08), 0 1px 3px rgb(0 0 0 / 0.5));
  --shadow-card: 0 4px 0 light-dark(#f0e7e2, #3a2a44);
  --shadow-card-hover: 0 6px 0 light-dark(#f0e7e2, #3a2a44);
  --color-card-border: light-dark(transparent, #3a2a44);
  --radius: 22px;
  --radius-small: 14px;
}

html[data-skin='refined-minimal'] {
  --color-bg: light-dark(#ffffff, #121416);
  --color-surface: light-dark(#ffffff, #121416);
  --color-surface-2: light-dark(#f4f6f7, #1a1d20);
  --color-text: light-dark(#15181c, #eef1f3);
  --color-muted: light-dark(#6b7280, #92a0ab);
  --color-border: light-dark(#e9ebed, #262b2f);
  --color-accent: light-dark(#1f6f50, #35c98f);
  --color-accent-hover: light-dark(#184f39, #5be0ab);
  --color-on-accent: light-dark(#ffffff, #06140c);
  --color-accent-soft: light-dark(#e7f2ec, #163428);
  --color-card-border: light-dark(transparent, #262b2f);
  --shadow-card: none;
  --shadow-card-hover: none;
  --radius: 8px;
  --radius-small: 8px;
}

html[data-skin='editorial-press'] {
  --color-bg: light-dark(#fffdf9, #15120f);
  --color-surface: light-dark(#fffdf9, #15120f);
  --color-surface-2: light-dark(#f7f3ec, #1e1a16);
  --color-text: light-dark(#1b1b1b, #f3ece3);
  --color-muted: light-dark(#6b6358, #a89a89);
  --color-border: light-dark(#e4ddd2, #352c23);
  --color-accent: light-dark(#8f3a1c, #e2835a);
  --color-accent-hover: light-dark(#702c15, #ef9f7c);
  --color-on-accent: light-dark(#ffffff, #1c0f06);
  --color-accent-soft: light-dark(#f7ece6, #3a2015);
  --color-card-border: light-dark(transparent, #352c23);
  --shadow-card: none;
  --shadow-card-hover: none;
  --radius: 4px;
  --radius-small: 4px;
}

/* The site's original look, kept as an alternate now that "Leaf" is the
   default — same values global.css used before this feature existed. */
html[data-skin='soft-product'] {
  --color-bg: light-dark(#f6f7f4, #121513);
  --color-surface: light-dark(#ffffff, #1b201c);
  --color-surface-2: light-dark(#eef1ec, #242a25);
  --color-text: light-dark(#1b221e, #e5ebe6);
  --color-muted: light-dark(#5a655e, #a0aca4);
  --color-border: light-dark(#d4dbd5, #343c36);
  --color-accent: light-dark(#2a7548, #5fc58a);
  --color-accent-hover: light-dark(#1f5d38, #7bd7a1);
  --color-on-accent: light-dark(#ffffff, #0b1a11);
  --color-accent-soft: light-dark(#e3f1e8, #1c3326);
  --color-card-border: light-dark(transparent, #343c36);
  --shadow-card: 0 2px 4px light-dark(rgb(20 30 60 / 0.05), rgb(0 0 0 / 0.4)),
    0 10px 22px light-dark(rgb(20 30 60 / 0.06), rgb(0 0 0 / 0.45));
  --shadow-card-hover: 0 6px 10px light-dark(rgb(20 30 60 / 0.07), rgb(0 0 0 / 0.45)),
    0 18px 34px light-dark(rgb(20 30 60 / 0.1), rgb(0 0 0 / 0.5));
  --radius: 16px;
  --radius-small: 10px;
}

html[data-skin='swiss-precision'] {
  --color-bg: light-dark(#ffffff, #0c0c0c);
  --color-surface: light-dark(#ffffff, #0c0c0c);
  --color-surface-2: light-dark(#f2f2f2, #161616);
  --color-text: light-dark(#111111, #f2f2f2);
  --color-muted: light-dark(#5f5f5f, #9a9a9a);
  --color-border: light-dark(#111111, #f2f2f2);
  --color-accent: light-dark(#d8232a, #ff5a61);
  --color-accent-hover: light-dark(#a81b20, #ff8086);
  --color-on-accent: light-dark(#ffffff, #1a0506);
  --color-accent-soft: light-dark(#fdecec, #331012);
  --color-card-border: var(--color-border);
  --shadow-card: none;
  --shadow-card-hover: none;
  --radius: 0px;
  --radius-small: 0px;
}

html[data-skin='dark-studio'] {
  --color-bg: light-dark(#f7faf8, #0d1013);
  --color-surface: light-dark(#ffffff, #14181d);
  --color-surface-2: light-dark(#eef3ef, #1b2026);
  --color-text: light-dark(#13231b, #e9eef4);
  --color-muted: light-dark(#54685e, #93a0ae);
  --color-border: light-dark(#dbe6df, #222930);
  --color-accent: light-dark(#1f8a52, #4ade80);
  --color-accent-hover: light-dark(#156a3e, #7ce89f);
  --color-on-accent: light-dark(#ffffff, #06140c);
  --color-accent-soft: light-dark(#e1f3e8, #16301f);
  --color-card-border: light-dark(transparent, #222930);
  --shadow-card: light-dark(0 1px 2px rgb(20 30 20 / 0.06), 0 1px 2px rgb(0 0 0 / 0.5));
  --shadow-card-hover: light-dark(0 1px 2px rgb(20 30 20 / 0.06), 0 1px 2px rgb(0 0 0 / 0.5));
  --radius: 10px;
  --radius-small: 8px;
}

html[data-skin='warm-craft'] {
  --color-bg: light-dark(#f6f1e7, #1a1611);
  --color-surface: light-dark(#fcf9f3, #211c16);
  --color-surface-2: light-dark(#efe8db, #2a241c);
  --color-text: light-dark(#2a251e, #ede4d4);
  --color-muted: light-dark(#6e6354, #ab9d85);
  --color-border: light-dark(#ded3c0, #3a3226);
  --color-accent: light-dark(#96612a, #d99a4e);
  --color-accent-hover: light-dark(#764c20, #e8b370);
  --color-on-accent: light-dark(#ffffff, #1d1206);
  --color-accent-soft: light-dark(#efe2cd, #3c2a14);
  --color-card-border: light-dark(transparent, #3a3226);
  --shadow-card: light-dark(0 1px 0 rgb(130 110 80 / 0.09), none);
  --shadow-card-hover: light-dark(0 1px 0 rgb(130 110 80 / 0.09), none);
  --radius: 7px;
  --radius-small: 7px;
}

html[data-skin='enterprise-console'] {
  --color-bg: light-dark(#f7f9fb, #0c1420);
  --color-surface: light-dark(#ffffff, #101a28);
  --color-surface-2: light-dark(#eef2f6, #16202e);
  --color-text: light-dark(#0f1f33, #e6edf5);
  --color-muted: light-dark(#5d7085, #7f93a8);
  --color-border: light-dark(#dbe3ec, #1f2d3e);
  --color-accent: light-dark(#15528f, #5ba6ef);
  --color-accent-hover: light-dark(#103f6e, #83bef4);
  --color-on-accent: light-dark(#ffffff, #06111d);
  --color-accent-soft: light-dark(#e4edf7, #152a3f);
  --color-card-border: var(--color-border);
  --shadow-card: none;
  --shadow-card-hover: none;
  --radius: 5px;
  --radius-small: 4px;
}

/* A true gradient/glass ground can't go through light-dark() (it only accepts plain
   colours), so this is a flat approximation of the original gradient-and-blur mockup —
   the identity still reads (violet accent, airy neutrals), just without the blur. */
html[data-skin='glass-depth'] {
  --color-bg: light-dark(#f1ecfb, #140f22);
  --color-surface: light-dark(#ffffff, #1c1630);
  --color-surface-2: light-dark(#ece6f7, #231c3c);
  --color-text: light-dark(#19203a, #eceeff);
  --color-muted: light-dark(#5b6689, #a6acc9);
  --color-border: light-dark(#e3defa, #2b2448);
  --color-accent: light-dark(#5a56d6, #9b97ff);
  --color-accent-hover: light-dark(#4642ab, #b8b4ff);
  --color-on-accent: light-dark(#ffffff, #0d0b1f);
  --color-accent-soft: light-dark(#e9e7fb, #231c44);
  --color-card-border: light-dark(transparent, #2b2448);
  --shadow-card: light-dark(0 7px 20px rgb(70 80 140 / 0.12), 0 7px 20px rgb(0 0 0 / 0.4));
  --shadow-card-hover: light-dark(0 7px 20px rgb(70 80 140 / 0.12), 0 7px 20px rgb(0 0 0 / 0.4));
  --radius: 17px;
  --radius-small: 12px;
}

html[data-skin='bold-brutal'] {
  --color-bg: light-dark(#f3f2ec, #121212);
  --color-surface: light-dark(#ffffff, #1a1a1a);
  --color-surface-2: light-dark(#e5e4dc, #221f1a);
  --color-text: light-dark(#0a0a0a, #f3f2ec);
  --color-muted: light-dark(#4c4c4c, #b7b4a8);
  --color-border: light-dark(#0a0a0a, #f3f2ec);
  --color-accent: light-dark(#0a0a0a, #f3f2ec);
  --color-accent-hover: light-dark(#262626, #d9d6c9);
  --color-on-accent: light-dark(#f3f2ec, #0a0a0a);
  --color-accent-soft: light-dark(#e5e4dc, #2a2a26);
  --color-card-border: var(--color-border);
  --shadow-card: light-dark(5px 5px 0 #0a0a0a, 5px 5px 0 #000000);
  --shadow-card-hover: light-dark(7px 7px 0 #0a0a0a, 7px 7px 0 #000000);
  --radius: 0px;
  --radius-small: 0px;
}

html[data-skin='clinical-trust'] {
  --color-bg: light-dark(#f7fbfd, #0a141c);
  --color-surface: light-dark(#ffffff, #0f1b26);
  --color-surface-2: light-dark(#eaf4f8, #142532);
  --color-text: light-dark(#0e2735, #e4eef5);
  --color-muted: light-dark(#567688, #7e97a8);
  --color-border: light-dark(#d9e8ef, #1c2e3c);
  --color-accent: light-dark(#0a7ea4, #4db8e8);
  --color-accent-hover: light-dark(#086485, #78cbee);
  --color-on-accent: light-dark(#ffffff, #06131b);
  --color-accent-soft: light-dark(#e1f2f8, #163142);
  --color-card-border: light-dark(transparent, #1c2e3c);
  --shadow-card: light-dark(0 1px 2px rgb(10 40 55 / 0.07), 0 1px 2px rgb(0 0 0 / 0.45));
  --shadow-card-hover: light-dark(0 1px 2px rgb(10 40 55 / 0.07), 0 1px 2px rgb(0 0 0 / 0.45));
  --radius: 9px;
  --radius-small: 8px;
}

html[data-skin='luxe-serif'] {
  --color-bg: light-dark(#faf7f0, #0b0b0c);
  --color-surface: light-dark(#ffffff, #121214);
  --color-surface-2: light-dark(#f1ebdd, #1a1a1d);
  --color-text: light-dark(#1d1a12, #f0eae0);
  --color-muted: light-dark(#746c57, #9b948a);
  --color-border: light-dark(#e3d9c2, #26262a);
  --color-accent: light-dark(#a07f1e, #c9a227);
  --color-accent-hover: light-dark(#7d6217, #ddba4f);
  --color-on-accent: light-dark(#ffffff, #15120a);
  --color-accent-soft: light-dark(#f3e9cd, #262014);
  --color-card-border: light-dark(transparent, #26262a);
  --shadow-card: none;
  --shadow-card-hover: none;
  --radius: 2px;
  --radius-small: 2px;
}

html[data-skin='dashboard-style'] {
  --color-bg: light-dark(#f7f8f6, #0b0b0c);
  --color-surface: light-dark(#ffffff, #141415);
  --color-surface-2: light-dark(#eef0ed, #1b1b1d);
  --color-text: light-dark(#15171a, #f2f2f0);
  --color-muted: light-dark(#5a5f63, #96969b);
  --color-border: light-dark(#dfe2df, #242426);
  --color-accent: light-dark(#1f7a4d, #4fbd81);
  --color-accent-hover: light-dark(#185f3c, #78cd9c);
  --color-on-accent: light-dark(#ffffff, #06130b);
  --color-accent-soft: light-dark(#e3f2e9, #163424);
  --color-card-border: light-dark(transparent, #242426);
  --shadow-card: none;
  --shadow-card-hover: none;
  --radius: 12px;
  --radius-small: 8px;
}

html[data-skin='paper-ink'] {
  --color-bg: light-dark(#f3ede1, #171310);
  --color-surface: light-dark(#fbf8f1, #1f1a15);
  --color-surface-2: light-dark(#ece4d3, #28221b);
  --color-text: light-dark(#241f16, #efe6d4);
  --color-muted: light-dark(#786f5c, #a79a80);
  --color-border: light-dark(#ddd1b4, #3a3228);
  --color-accent: light-dark(#a8431e, #e2783f);
  --color-accent-hover: light-dark(#833318, #ec9765);
  --color-on-accent: light-dark(#fbf8f1, #1c1209);
  --color-accent-soft: light-dark(#f3ddce, #3a2415);
  --color-card-border: light-dark(#ddd1b4, #3a3228);
  --shadow-card: light-dark(0 1px 2px rgb(60 45 10 / 0.06), none);
  --shadow-card-hover: light-dark(0 1px 2px rgb(60 45 10 / 0.06), none);
  --radius: 3px;
  --radius-small: 3px;
}

html[data-skin='bold-editorial'] {
  --color-bg: light-dark(#ffffff, #0a0b09);
  --color-surface: light-dark(#ffffff, #0a0b09);
  --color-surface-2: light-dark(#f4f4f2, #131410);
  --color-text: light-dark(#0c0d0b, #f6f6f2);
  --color-muted: light-dark(#6b6b66, #93938c);
  --color-border: light-dark(#0c0d0b, #f6f6f2);
  --color-accent: light-dark(#1f7a3d, #3fd16e);
  --color-accent-hover: light-dark(#185f30, #6ddc8e);
  --color-on-accent: light-dark(#ffffff, #061409);
  --color-accent-soft: light-dark(#e6f3ea, #10291a);
  --color-card-border: var(--color-border);
  --shadow-card: none;
  --shadow-card-hover: none;
  --radius: 4px;
  --radius-small: 4px;
}

/*
 * SkinPicker's swatch dots. These can't be an inline style={} on the dot (the CSP's
 * style-src blocks it — see SkinPicker.astro), so each skin's light-mode accent from
 * src/lib/skins.ts gets a plain attribute-selector rule here instead, keyed off the
 * same data-skin-id the picker button already carries.
 */
.skin-picker__opt[data-skin-id='default'] .skin-picker__dot { background: #15803d; }
.skin-picker__opt[data-skin-id='playful-rounded'] .skin-picker__dot { background: #e5533d; }
.skin-picker__opt[data-skin-id='soft-product'] .skin-picker__dot { background: #2a7548; }
.skin-picker__opt[data-skin-id='refined-minimal'] .skin-picker__dot { background: #1f6f50; }
.skin-picker__opt[data-skin-id='editorial-press'] .skin-picker__dot { background: #8f3a1c; }
.skin-picker__opt[data-skin-id='swiss-precision'] .skin-picker__dot { background: #d8232a; }
.skin-picker__opt[data-skin-id='dark-studio'] .skin-picker__dot { background: #4ade80; }
.skin-picker__opt[data-skin-id='warm-craft'] .skin-picker__dot { background: #96612a; }
.skin-picker__opt[data-skin-id='enterprise-console'] .skin-picker__dot { background: #15528f; }
.skin-picker__opt[data-skin-id='glass-depth'] .skin-picker__dot { background: #5a56d6; }
.skin-picker__opt[data-skin-id='bold-brutal'] .skin-picker__dot { background: #0a0a0a; }
.skin-picker__opt[data-skin-id='clinical-trust'] .skin-picker__dot { background: #0a7ea4; }
.skin-picker__opt[data-skin-id='luxe-serif'] .skin-picker__dot { background: #c9a227; }
.skin-picker__opt[data-skin-id='dashboard-style'] .skin-picker__dot { background: #4fbd81; }
.skin-picker__opt[data-skin-id='paper-ink'] .skin-picker__dot { background: #a8431e; }
.skin-picker__opt[data-skin-id='bold-editorial'] .skin-picker__dot { background: #1f7a3d; }
````

## `src/lib/skins.ts`

````ts
/**
 * The skin picker's registry (src/components/SkinPicker.astro). Each `id` matches an
 * `html[data-skin="<id>"]` block in src/styles/skins.css — `'default'` is special: it
 * has no CSS block of its own (it *is* :root in global.css) and selecting it clears the
 * leaflock_skin cookie rather than setting one, so a visitor who picks it falls back to
 * the site's own default forever, including after a future default change.
 *
 * `swatch` is the skin's light-mode accent colour, shown as a small preview dot per
 * option in the picker. It cannot be applied as an inline `style` (the CSP's style-src
 * blocks that — found the hard way, see SkinPicker.astro), so each value here has a
 * matching `[data-skin-id="<id>"] .skin-picker__dot { background: ... }` rule in
 * skins.css — change one, change the other.
 */
export interface Skin {
  id: string;
  name: string;
  blurb: string;
  swatch: string;
}

export const skins: readonly Skin[] = [
  { id: 'default', name: 'Leaf', swatch: '#15803d', blurb: 'Warm off-white, hairline borders, one deep-leaf green and soft shadows. Calm and premium — the site default.' },
  { id: 'playful-rounded', name: 'Playful Rounded', swatch: '#e5533d', blurb: 'Big soft radii, a chunky solid shadow, warm coral. The previous site default.' },
  { id: 'soft-product', name: 'Soft Product', swatch: '#2a7548', blurb: "LeafLock's original look: pillowy cards, round tinted icons, gentle lift on hover." },
  { id: 'refined-minimal', name: 'Refined Minimal', swatch: '#1f6f50', blurb: 'Hairline dividers instead of cards, lots of air, nothing competing for attention.' },
  { id: 'editorial-press', name: 'Editorial Press', swatch: '#8f3a1c', blurb: 'Serif display, numbered index, no cards at all. Quiet and bookish.' },
  { id: 'swiss-precision', name: 'Swiss Precision', swatch: '#d8232a', blurb: 'Heavy rules, numerals, red accent, zero curves. Confident and technical.' },
  { id: 'dark-studio', name: 'Dark Studio', swatch: '#4ade80', blurb: 'Near-black with a luminous accent and a glow on hover. Feels like a pro tool.' },
  { id: 'warm-craft', name: 'Warm Craft', swatch: '#96612a', blurb: 'Paper ground, serif headings, dashed rules. Human and non-corporate.' },
  { id: 'enterprise-console', name: 'Enterprise Console', swatch: '#15528f', blurb: 'Dense rows, blue accent, built for people who scan rather than browse.' },
  { id: 'glass-depth', name: 'Glass Depth', swatch: '#5a56d6', blurb: 'Soft violet ground, airy neutrals. The most decorative option here.' },
  { id: 'bold-brutal', name: 'Bold Brutal', swatch: '#0a0a0a', blurb: 'Thick ink borders, offset shadow blocks. Memorable, polarising.' },
  { id: 'clinical-trust', name: 'Clinical Trust', swatch: '#0a7ea4', blurb: 'Blue and white, calm and precise. Aimed at clinics and firms.' },
  { id: 'luxe-serif', name: 'Luxe Serif', swatch: '#c9a227', blurb: 'Black and gold, wide letter-spacing, very quiet. Premium.' },
  { id: 'dashboard-style', name: 'Dashboard-style', swatch: '#4fbd81', blurb: 'Flat app chrome, monochrome icons, no tinted badges. Sidebar-first and current.' },
  { id: 'paper-ink', name: 'Paper & Ink', swatch: '#a8431e', blurb: 'Warm paper tones, serif headline, folded-corner cards. The most distinctive identity.' },
  { id: 'bold-editorial', name: 'Bold Editorial', swatch: '#1f7a3d', blurb: 'Near-white/near-black, one solid accent, thick rules. Confident fintech register.' },
] as const;
````

## `src/components/SkinPicker.astro`

````astro
---
import type { CommonMessages } from '../i18n';
import { skins } from '../lib/skins';

interface Props {
  t: CommonMessages['appearance'];
}

const { t } = Astro.props;
---

<details class="skin-picker">
  <summary title={t.heading} aria-label={t.heading}>
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="8.3" cy="10" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="10" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="15" r="1.3" fill="currentColor" stroke="none" />
      <path d="M12 21.5A9.5 9.5 0 0 1 12 2.5c.9 0 1.6.7 1.6 1.6 0 .4-.15.75-.4 1.03-.26.3-.4.66-.4 1.05 0 .9.73 1.62 1.63 1.62h2.16c1.42 0 2.57 1.15 2.57 2.57 0 5.6-4.55 10.13-10.16 10.13Z" />
    </svg>
  </summary>
  <div class="skin-picker__panel" id="skinPickerPanel">
    {
      skins.map((skin) => (
        <button type="button" class="skin-picker__opt" data-skin-id={skin.id}>
          {/* No inline style — the CSP's style-src blocks it (CLAUDE.md's own rule,
              found the hard way: this one line broke console-error assertions on every
              e2e spec, on every page, because the header renders everywhere). Each
              skin's swatch colour is a plain attribute-selector rule in skins.css
              instead, keyed off the same data-skin-id this button already carries. */}
          <span class="skin-picker__dot" />
          <span class="skin-picker__name">{skin.name}</span>
          {skin.id === 'default' && <span class="skin-picker__badge">{t.defaultBadge}</span>}
        </button>
      ))
    }
    <p class="skin-picker__note" id="skinPickerNote">{t.freeNote}</p>
  </div>
</details>

<script>
  // Mirrors ToolsMenu's open/close pattern (native <details>, close on outside click or
  // Escape) and the leaflock_* cookie convention (src/lib/server/session.ts) — picking a
  // skin reloads rather than live-swapping, same as before this was a dropdown instead
  // of a full page.
  //
  // Remembering the choice browser-to-browser is a Pro/Practice perk: a free or
  // signed-out visitor still gets their pick applied, but as a session cookie (no
  // Max-Age — the browser drops it when it closes), not the year-long one. Checking
  // plan costs a request, so it's only made on an actual pick, never just from opening
  // the panel, and skipped entirely when `leaflock_signed_in` (the non-HttpOnly hint
  // src/components/ui/useSession.ts also reads) says there's no session to check —
  // mirrors that hook's own "don't hit the backend for the default signed-out visitor"
  // rule rather than importing React just for this.
  const KEY = 'leaflock_skin';
  const YEAR = 60 * 60 * 24 * 365;
  const PAID_PLANS = ['pro', 'lifetime', 'practice', 'business'];

  async function isPaidPlan(): Promise<boolean> {
    const hinted = document.cookie.split('; ').some((entry) => entry.startsWith('leaflock_signed_in='));
    if (!hinted) return false;
    try {
      const response = await fetch('/api/auth/me');
      const data = response.ok ? ((await response.json()) as { plan?: string } | null) : null;
      return !!data?.plan && PAID_PLANS.includes(data.plan);
    } catch {
      return false;
    }
  }

  const menu = document.querySelector<HTMLDetailsElement>('.skin-picker');
  if (menu) {
    const match = document.cookie.match(/(?:^|; )leaflock_skin=([^;]+)/);
    const current = match?.[1] ? decodeURIComponent(match[1]) : 'default';
    for (const opt of menu.querySelectorAll<HTMLButtonElement>('[data-skin-id]')) {
      opt.setAttribute('aria-current', String(opt.dataset.skinId === current));
    }
    menu.querySelector('.skin-picker__panel')?.addEventListener('click', async (event) => {
      const opt = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-skin-id]');
      if (!opt) return;
      const id = opt.dataset.skinId!;
      if (id === 'default') {
        document.cookie = `${KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
      } else {
        const remember = await isPaidPlan();
        const persistence = remember ? `Max-Age=${YEAR}` : ''; // omitted Max-Age = session cookie
        document.cookie = `${KEY}=${encodeURIComponent(id)}; Path=/; ${persistence}; SameSite=Lax`.replace('; ; ', '; ');
      }
      location.reload();
    });
    document.addEventListener('click', (event) => {
      if (menu.open && !menu.contains(event.target as Node)) menu.open = false;
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
    });
  }
</script>
````

## `src/layouts/Base.astro`

Imports (top of the frontmatter):

````astro
import '../styles/skins.css';
import SkinPicker from '../components/SkinPicker.astro';
````

Inside the pre-paint script, after the `sidebarDock` lines and before `} catch {}`:

````js
        // Same reasoning, for the chosen skin (src/components/SkinPicker.astro): a
        // cookie, not localStorage, so it's readable the same way whether or not the
        // visitor is signed in, and matches the site's existing leaflock_* cookie
        // convention (src/lib/server/session.ts). No cookie means the default skin —
        // already the :root tokens in global.css — so there's nothing to apply in that
        // case.
        const skinMatch = document.cookie.match(/(?:^|; )leaflock_skin=([^;]+)/);
        if (skinMatch) document.documentElement.dataset.skin = decodeURIComponent(skinMatch[1]);
````

In the header, between `<LanguageSwitcher …/>` and `<ThemeToggle …/>`:

````astro
      <SkinPicker t={t.appearance} />
````

## `src/components/NavToggle.astro`

The outside-tap handler counted the picker as part of the open menu:

````ts
    // A tap anywhere outside the menu closes it. The panel, the Menu button and the skin picker (which is part of the
    // menu while it is open) count as inside; a link inside the panel navigates away on its own.
    const skin = document.querySelector('.skin-picker');
    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('site-nav--open')) return;
      const target = event.target as Node;
      if (nav.contains(target) || toggle.contains(target) || skin?.contains(target)) return;
      setOpen(false);
    });
````

## `src/styles/global.css`

**1. Header comment** (top of the file), the "Skin:" paragraph:

````css
 * Skin: these same tokens are the default skin, "Leaf" (17 November 2026, replacing
 * "Playful Rounded"): warm off-white ground, hairline borders, one deep-leaf green, soft
 * layered shadows instead of a solid offset one. Fifteen alternates live in
 * src/styles/skins.css, each overriding this exact token set under html[data-skin="<id>"];
 * picking one sets a leaflock_skin cookie, applied before first paint by the inline script
 * in Base.astro, same technique as the theme toggle.
````

**2. Phone block, `@media (max-width: 48rem)`**, the comment and rules that ordered the picker with the theme button:

````css
  /* Without this, ThemeToggle and SkinPicker (the header's last flex children) land on
     whatever line .site-nav's own wrapping happens to leave unfinished — sometimes
     shared, sometimes their own lonely row, depending on how many nav links fit above.
     Forcing .site-nav onto a full-width line of its own makes the header a predictable
     two-row shape instead: brand plus these two together, then every nav link below. */
  .site-nav {
    order: 2;
    flex-basis: 100%;
  }

  .skin-picker,
  .theme-toggle {
    order: 1;
  }

  .skin-picker {
    margin-left: auto;
  }
````

**3. Scripting-enabled phone block**: the comment on the "one row" rule, then the picker joining the Menu:

````css
  /* One row, constant height: brand on the left; language, theme and the Menu button on the right. Everything else (the
     links, and the skin picker) is inside the Menu. An opaque bar and no blur: a backdrop blur over scrolling content is
     repainted every frame on a phone, which is a large part of why scrolling felt heavy. */

/* ... */

  /* The skin picker joins the menu: shown only while it is open, as the last row under the links. */
  .skin-picker {
    display: none;
  }

  .site-nav--open ~ .skin-picker {
    display: block;
    flex-basis: 100%;
    order: 5;
    margin: 0;
  }

  /* Opens in place under its button, not as a panel hung from the button's right edge, which would run off the left of
     the screen from where it sits in the menu. */
  .site-nav--open ~ .skin-picker .skin-picker__panel {
    position: static;
    width: auto;
    max-height: 50vh;
    margin-top: 0.5rem;
  }
````

**4. The picker's own styles** (between the theme toggle and the tools sidebar):

````css
/* ---------- skin picker, lives next to .theme-toggle in the header ---------- */
.skin-picker {
  position: relative;
}

.skin-picker summary {
  display: grid;
  place-items: center;
  width: 2.1rem;
  height: 2.1rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-2);
  color: var(--color-muted);
  cursor: pointer;
  list-style: none;
}

.skin-picker summary::-webkit-details-marker {
  display: none;
}

.skin-picker summary:hover {
  color: var(--color-text);
}

.skin-picker[open] summary {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow);
}

.skin-picker__panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  /* Same reasoning as .tools-menu__panel above: must outrank the tools sidebar's
     z-index (30) or a right-docked sidebar paints over this panel, which is exactly
     why picking a skin looked like it only worked on the sidebar-free home page. */
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 15rem;
  max-height: 70vh;
  overflow-y: auto;
  padding: 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  background: var(--color-surface);
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.18);
}

.skin-picker__opt {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  border: 0;
  border-radius: calc(var(--radius-small) * 0.7);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

.skin-picker__opt:hover {
  background: var(--color-surface-2);
}

.skin-picker__opt[aria-current='true'] {
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-weight: 700;
}

.skin-picker__dot {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 999px;
  flex: none;
}

.skin-picker__name {
  flex: 1;
}

.skin-picker__badge {
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: var(--color-surface-2);
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.skin-picker__opt[aria-current='true'] .skin-picker__badge {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.skin-picker__note {
  margin: 0.4rem 0 0.2rem;
  padding: 0.5rem 0.6rem 0.1rem;
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: 0.74rem;
  line-height: 1.4;
}
````

## Tests

`tests/e2e/mobile.spec.ts` asserted the picker's place in the phone header and that its panel stays on screen:

````ts
test('the header is one row: brand, language, theme and the Menu button, with the skin picker inside the menu', async ({ page }) => {
  // 320 is the narrowest reflow width; 360 is the tightest real phone; 390 is a current iPhone.
  for (const width of [320, 360, 390, 412]) {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('/');
    // The brand's width depends on the platform's fallback font, and CI's is wider than a laptop's. Force a wide one so
    // this fails on any machine if the row only fits by a few pixels, not just on the one that happens to be wide.
    // Through the element's style property (the CSSOM): the page's CSP blocks an injected <style>, on purpose.
    await page.evaluate(() => document.querySelector<HTMLElement>('.brand')!.style.setProperty('font-family', "Verdana, 'DejaVu Sans', sans-serif", 'important'));
    const rowTop = async (selector: string) => {
      const box = await page.locator(selector).first().boundingBox();
      expect(box, `${selector} at ${width}px`).not.toBeNull();
      return box!.y + box!.height / 2;
    };
    const brand = await rowTop('.site-header .brand');
    for (const selector of ['.lang-switcher summary', '.theme-toggle', '.nav-toggle']) {
      expect(Math.abs((await rowTop(selector)) - brand), `${selector} shares the brand's row at ${width}px`).toBeLessThan(20);
    }
    // One slim row, not two or three.
    const header = await page.locator('.site-header').boundingBox();
    expect(header!.height, `the header is a single row at ${width}px`).toBeLessThan(70);
    // The skin picker is not in the bar; it appears inside the open menu.
    await expect(page.locator('.skin-picker')).toBeHidden();
    await page.locator('.nav-toggle').click();
    await expect(page.locator('.skin-picker summary')).toBeVisible();
    await page.locator('.nav-toggle').click();
  }
});


// ...

test('the skin picker, opened inside the Menu, stays on the screen', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav-toggle').click();
  await page.locator('.skin-picker summary').click();
  const panel = (await page.locator('.skin-picker__panel').boundingBox())!;
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.x + panel.width).toBeLessThanOrEqual(360);
});
````

`tests/e2e/zoomLayout.spec.ts` line 28 excluded `.skin-picker__panel` from its overlap check:

````ts
    el.closest('.tools-sidebar, .visually-hidden, .skip-link, script, style, noscript, .lang-switcher__list, .skin-picker__panel, .tools-menu__panel');
````

## Strings

English, `src/i18n/en/common.ts` (between `language` and `article`):

````ts
  /** The skin picker dropdown in the header (src/components/SkinPicker.astro). */
  appearance: {
    heading: 'Appearance',
    defaultBadge: 'Default',
    /** Remembering a choice between visits is a Pro/Practice perk (see the component's
     * own comment for why); everyone else gets it applied for the current browser
     * session only. */
    freeNote: 'Remembered on this browser with Pro or Practice. Otherwise, for this session only.',
  },
````

Every other locale, as a `--patch` file. Restore the English block first, save this as `skins-locales.json`, then run
`node scripts/translate.mjs --patch skins-locales.json`:

````json
{
  "ar": {
    "common.appearance.heading": "المظهر",
    "common.appearance.defaultBadge": "افتراضي",
    "common.appearance.freeNote": "يُحفظ في هذا المتصفح مع Pro أو Practice. وإلا فلهذه الجلسة فقط."
  },
  "bn": {
    "common.appearance.heading": "চেহারা",
    "common.appearance.defaultBadge": "ডিফল্ট",
    "common.appearance.freeNote": "Pro বা Practice থাকলে এই ব্রাউজারে মনে রাখা হয়। নইলে শুধু এই সেশনের জন্য।"
  },
  "de": {
    "common.appearance.heading": "Darstellung",
    "common.appearance.defaultBadge": "Standard",
    "common.appearance.freeNote": "Wird mit Pro oder Practice in diesem Browser gespeichert. Andernfalls nur für diese Sitzung."
  },
  "es": {
    "common.appearance.heading": "Apariencia",
    "common.appearance.defaultBadge": "Predeterminado",
    "common.appearance.freeNote": "Se recuerda en este navegador con Pro o Practice. De lo contrario, solo durante esta sesión."
  },
  "fil": {
    "common.appearance.heading": "Hitsura",
    "common.appearance.defaultBadge": "Default",
    "common.appearance.freeNote": "Naaalala sa browser na ito kapag may Pro o Practice. Kung hindi, para sa session na ito lang."
  },
  "fr": {
    "common.appearance.heading": "Apparence",
    "common.appearance.defaultBadge": "Par défaut",
    "common.appearance.freeNote": "Mémorisé sur ce navigateur avec Pro ou Practice. Sinon, pour cette session uniquement."
  },
  "hi": {
    "common.appearance.heading": "दिखावट",
    "common.appearance.defaultBadge": "डिफ़ॉल्ट",
    "common.appearance.freeNote": "Pro या Practice के साथ इस ब्राउज़र में याद रखा जाता है। नहीं तो सिर्फ़ इस सत्र के लिए।"
  },
  "id": {
    "common.appearance.heading": "Tampilan",
    "common.appearance.defaultBadge": "Default",
    "common.appearance.freeNote": "Diingat di browser ini dengan Pro atau Practice. Jika tidak, hanya untuk sesi ini."
  },
  "it": {
    "common.appearance.heading": "Aspetto",
    "common.appearance.defaultBadge": "Predefinito",
    "common.appearance.freeNote": "Ricordato su questo browser con Pro o Practice. Altrimenti, solo per questa sessione."
  },
  "ja": {
    "common.appearance.heading": "外観",
    "common.appearance.defaultBadge": "デフォルト",
    "common.appearance.freeNote": "ProまたはPracticeでは、このブラウザーに記憶されます。それ以外は、このセッションのみです。"
  },
  "ko": {
    "common.appearance.heading": "화면 스타일",
    "common.appearance.defaultBadge": "기본값",
    "common.appearance.freeNote": "Pro 또는 Practice에서는 이 브라우저에 기억돼요. 그렇지 않으면 이번 세션에만 적용돼요."
  },
  "nl": {
    "common.appearance.heading": "Weergave",
    "common.appearance.defaultBadge": "Standaard",
    "common.appearance.freeNote": "Onthouden in deze browser met Pro of Practice. Anders alleen voor deze sessie."
  },
  "pl": {
    "common.appearance.heading": "Wygląd",
    "common.appearance.defaultBadge": "Domyślny",
    "common.appearance.freeNote": "Zapamiętywane w tej przeglądarce z Pro lub Practice. W przeciwnym razie tylko na czas tej sesji."
  },
  "pt-br": {
    "common.appearance.heading": "Aparência",
    "common.appearance.defaultBadge": "Padrão",
    "common.appearance.freeNote": "Lembrado neste navegador com o Pro ou o Practice. Caso contrário, vale apenas para esta sessão."
  },
  "ru": {
    "common.appearance.heading": "Оформление",
    "common.appearance.defaultBadge": "По умолчанию",
    "common.appearance.freeNote": "В тарифах Pro и Practice запоминается в этом браузере. В остальных случаях действует только в текущем сеансе."
  },
  "th": {
    "common.appearance.heading": "รูปลักษณ์",
    "common.appearance.defaultBadge": "ค่าเริ่มต้น",
    "common.appearance.freeNote": "จดจำไว้ในเบราว์เซอร์นี้เมื่อใช้ Pro หรือ Practice มิฉะนั้นใช้เฉพาะเซสชันนี้"
  },
  "tr": {
    "common.appearance.heading": "Görünüm",
    "common.appearance.defaultBadge": "Varsayılan",
    "common.appearance.freeNote": "Pro veya Practice ile bu tarayıcıda hatırlanır. Aksi halde yalnızca bu oturum için geçerlidir."
  },
  "vi": {
    "common.appearance.heading": "Giao diện",
    "common.appearance.defaultBadge": "Mặc định",
    "common.appearance.freeNote": "Được ghi nhớ trên trình duyệt này với Pro hoặc Practice. Nếu không, chỉ trong phiên này."
  },
  "zh-cn": {
    "common.appearance.heading": "外观",
    "common.appearance.defaultBadge": "默认",
    "common.appearance.freeNote": "使用 Pro 或 Practice 时会在此浏览器中记住。否则仅在本次会话中有效。"
  }
}
````

## Trust-page wording

The cookie was described in these places, all in `src/content`. After removal the pages say that signed-out visitors
get no cookies and that signing in sets two. To restore the skin cookie, put these lines back.

**`pages/en/cookies.md`**: frontmatter `description`, the intro sentence and the third bullet:

````md
description: The three strictly-necessary cookies LeafLock PDF sets, what else it stores in your browser (theme choice, the OCR model), and how to remove any of it.

leaflockpdf.com sets **no advertising cookies and no analytics or tracking cookies**, ever. There are three cookies in total, described below — none of them track you across sites, build a profile, or get sent to anyone but us.

- **`leaflock_skin`** — set only if you pick a visual skin other than the default from the appearance menu, and only remembered between visits (for a year) if you're signed in on a Pro or Practice plan; for everyone else it lasts only until you close the browser. Carries nothing but which of the sixteen skins you chose. We treat this as strictly necessary too: you have to take an explicit action to set it, it exists only to give you back the thing you just asked for, and nothing about it is used to track or profile you — but we're not the final word on that reading, so [TO CONFIRM: whether the skin-choice cookie needs consent under the ePrivacy Directive, particularly for the year-long case].
````

**`pages/en/claims.md`** line 60:

````md
- **One more, only if you pick a visual skin**: `leaflock_skin`, which remembers your choice. Signed out, or on a free plan, it lasts only until you close the browser; signed in on Pro or Practice, it's kept for a year. See [Cookies](/cookies) for the full detail on all three and why none of them need a banner.
````

**`pages/en/privacy.md`** line 98:

````md
- **Cookies:** two if you sign in (`__Host-leaflock_session`, and `leaflock_signed_in`, which holds only the name of your plan), and a third (`leaflock_skin`) only if you pick a visual skin. None of them track you or carry a profile.
````

**`pages/en/security.md`** lines 87 and 104:

````md
- **Two cookies, if you sign in**: `__Host-leaflock_session`, which identifies your session and carries nothing else, and `leaflock_signed_in`, a one-word label of which plan you are on, so the page can show you the right view without asking our server. A third, `leaflock_skin`, is set only if you pick a visual skin — see the [Cookie policy](/cookies) for how long each one lasts.

- **No tracking cookies.** If you sign in, two cookies identify your session and nothing else. The only cookie set while signed out is a short-lived one if you pick a visual skin, and it's gone once you close the browser. See the [Cookie policy](/cookies).
````

**`pages/en/help.md`** line 23:

````md
No tracking, ever — no analytics, no advertising, no third-party scripts. The site does set a small number of strictly-necessary cookies (keeping you signed in, remembering a visual skin you chose), never anything that tracks you across sites or builds a profile. See the [Cookie policy](/cookies) and the [Privacy policy](/privacy).
````

**`compare/en/leaflock-vs-pdf24.md`** line 63, **`leaflock-vs-pdffiller.md`** line 55, **`leaflock-vs-sejda.md`** line 62:

````md
**LeafLock.** No analytics, no advertising, no social or chat widgets, and no third-party scripts of any kind. The only cookie set while signed out is a short-lived one if you pick a visual skin — which is why you see no cookie banner. See [Cookies](/cookies).

**LeafLock.** You can use every core tool with no account at all. If you make one, we hold an email address, which plan you are on and when you last signed in — no name, no company, no address. There are no analytics, no advertising and no third-party scripts, and the only cookie set while signed out is a short-lived one if you pick a visual skin. The complete list of what we receive is on [our claims](/claims).

**LeafLock.** No analytics, no advertising and no third-party scripts. The only cookie set while signed out is a short-lived one if you pick a visual skin. If a tool crashes we receive a short technical report with file names and page text removed in your browser first, and your IP address is not stored — you can see the fields in the [privacy policy](/privacy), and the whole list of what we receive on [our claims](/claims).
````

