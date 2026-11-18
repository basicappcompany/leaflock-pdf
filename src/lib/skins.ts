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
