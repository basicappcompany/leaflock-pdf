import type { ToolId } from '../tools/registry';
import { defaultLocale, localeRegistry } from './config';
import { en } from './en';

export { format, plural, type PluralForms } from './format';
export type { CommonMessages } from './en/common';
export type { ToolMessagesBase } from './en';

export type Messages = typeof en;
export type ToolMessages<K extends ToolId> = Messages['tools'][K];

export { defaultLocale, directionOf, isTranslated, localeInfo, localeRegistry } from './config';

type DeepPartial<T> = T extends readonly unknown[] ? T : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

/**
 * A locale's catalogue may be partial: any string it lacks is taken from English. That is
 * what lets a locale ship in stages, and what keeps a half-translated page from crashing.
 * Files live at `src/i18n/<code>/index.ts` and export `default` as a DeepPartial<Messages>.
 */
const catalogues = import.meta.glob<{ default: DeepPartial<Messages> }>('./*/index.ts', { eager: true });

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Overlays `overrides` on `base`. Arrays are replaced whole: a half-translated list is worse than an English one. */
export function mergeMessages<T>(base: T, overrides: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(overrides)) return (overrides ?? base) as T;
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(overrides)) out[key] = mergeMessages(out[key], overrides[key]);
  return out as T;
}

/**
 * Built inside a function that is marked pure, on purpose. About seventy client components import
 * `format` and `plural` from this file at run time; a loop at module level has side effects, so the
 * bundler cannot drop it and every browser chunk would carry every locale's catalogue (it did: JS +
 * CSS went from under 380 KB to 724 KB with two locales). Marked pure and unused in the browser, the
 * whole table and the catalogue files are removed from client bundles. The performance spec in
 * tests/e2e enforces the budget.
 */
function buildLocales(): Record<string, Messages> {
  const out: Record<string, Messages> = { en };
  for (const [file, module] of Object.entries(catalogues)) {
    const folder = file.split('/')[1]!;
    const info = localeRegistry.find((locale) => locale.path === folder);
    if (info && info.code !== 'en') out[info.code] = mergeMessages(en, module.default);
  }
  return out;
}

const translated = /*#__PURE__*/ buildLocales();

/** Locales that have a catalogue. These are the ones emitted in hreflang and the sitemap. */
export const locales: Record<string, Messages> = translated;

export type Locale = string;

export function getMessages(locale: string | undefined): Messages {
  return translated[locale ?? defaultLocale] ?? en;
}

// Caveat for a developer, not for CI: `import.meta.glob` is expanded when this file is
// transformed, and vitest caches that transform by the file's *content*. Adding a new
// locale folder without editing this file can leave a local vitest run seeing the old file
// list (tests then say the new locale "has no catalogue"). Any edit to this file refreshes it.
