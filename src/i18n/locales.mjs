// @ts-check
/**
 * The locale registry: the one place that says which languages exist and what state each is in.
 * A plain .mjs so `astro.config.mjs` can import it as well as the app code.
 *
 * Chosen 6 November 2026 from the country mix of PDF-tool sites (Semrush, iLovePDF and
 * Smallpdf, September 2026: Bangladesh, India, US, Brazil, Indonesia, Russia) plus the
 * largest online populations for the rest. Only the first seven are backed by that data;
 * the others are inferred (docs/roadmap.md, Phase 5). Replace the guesses with our own
 * Cloudflare country analytics after launch.
 *
 * Status is what decides whether a locale is *indexed*:
 *   - 'machine'  translated by machine and published, with a visible label
 *   - 'reviewed' a person has read the high-stakes strings (trust claims, pricing, errors)
 *   - 'planned'  no translation yet. The URL exists (Astro's fallback rewrite) but serves
 *                English, so it is `noindex` and left out of hreflang and the sitemap.
 *
 * @typedef {{
 *   code: string,
 *   path: string,
 *   name: string,
 *   native: string,
 *   dir: 'ltr' | 'rtl',
 *   evidence: 'data' | 'inferred',
 *   status: 'planned' | 'machine' | 'reviewed',
 * }} LocaleInfo
 */

/** @typedef {string | { path: string, codes: [string, ...string[]] }} Entry */

/** @type {readonly LocaleInfo[]} */
export const localeRegistry = [
  { code: 'en', path: 'en', name: 'English', native: 'English', dir: 'ltr', evidence: 'data', status: 'reviewed' },
  { code: 'hi', path: 'hi', name: 'Hindi', native: 'हिन्दी', dir: 'ltr', evidence: 'data', status: 'planned' },
  { code: 'bn', path: 'bn', name: 'Bengali', native: 'বাংলা', dir: 'ltr', evidence: 'data', status: 'planned' },
  { code: 'pt-BR', path: 'pt-br', name: 'Portuguese (Brazil)', native: 'Português (Brasil)', dir: 'ltr', evidence: 'data', status: 'planned' },
  { code: 'id', path: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', dir: 'ltr', evidence: 'data', status: 'planned' },
  { code: 'ru', path: 'ru', name: 'Russian', native: 'Русский', dir: 'ltr', evidence: 'data', status: 'planned' },
  { code: 'de', path: 'de', name: 'German', native: 'Deutsch', dir: 'ltr', evidence: 'data', status: 'planned' },
  { code: 'es', path: 'es', name: 'Spanish', native: 'Español', dir: 'ltr', evidence: 'inferred', status: 'planned' },
  { code: 'fr', path: 'fr', name: 'French', native: 'Français', dir: 'ltr', evidence: 'inferred', status: 'planned' },
  { code: 'tr', path: 'tr', name: 'Turkish', native: 'Türkçe', dir: 'ltr', evidence: 'inferred', status: 'planned' },
  { code: 'vi', path: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', dir: 'ltr', evidence: 'inferred', status: 'planned' },
  { code: 'it', path: 'it', name: 'Italian', native: 'Italiano', dir: 'ltr', evidence: 'inferred', status: 'planned' },
  { code: 'ja', path: 'ja', name: 'Japanese', native: '日本語', dir: 'ltr', evidence: 'inferred', status: 'planned' },
  { code: 'pl', path: 'pl', name: 'Polish', native: 'Polski', dir: 'ltr', evidence: 'inferred', status: 'planned' },
  { code: 'ko', path: 'ko', name: 'Korean', native: '한국어', dir: 'ltr', evidence: 'inferred', status: 'planned' },
  { code: 'ar', path: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl', evidence: 'inferred', status: 'planned' },
  { code: 'th', path: 'th', name: 'Thai', native: 'ไทย', dir: 'ltr', evidence: 'inferred', status: 'planned' },
  { code: 'nl', path: 'nl', name: 'Dutch', native: 'Nederlands', dir: 'ltr', evidence: 'inferred', status: 'planned' },
  { code: 'fil', path: 'fil', name: 'Filipino', native: 'Filipino', dir: 'ltr', evidence: 'inferred', status: 'planned' },
  { code: 'zh-CN', path: 'zh-cn', name: 'Chinese (Simplified)', native: '简体中文', dir: 'ltr', evidence: 'inferred', status: 'planned' },
];

/** The shape Astro's `i18n.locales` expects: a plain string, or { path, codes } when the URL differs from the code. */
// Typed `any`: Astro derives `defaultLocale`'s type from literal locale strings, which a list
// built at runtime cannot provide. tests/unit/locales.test.ts checks the real shape instead.
export const astroLocales = /** @type {any} */ (
  localeRegistry.map((locale) => (locale.path === locale.code ? locale.code : { path: locale.path, codes: [locale.code] }))
);

/** Every non-default locale falls back to English until it has its own translation. */
export const astroFallback = /** @type {any} */ (
  Object.fromEntries(localeRegistry.filter((locale) => locale.code !== 'en').map((locale) => [locale.path, 'en']))
);
