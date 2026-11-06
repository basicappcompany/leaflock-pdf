// Light on purpose: no message catalogue. Client islands may import from here; importing
// `./index` would pull every locale's messages into the browser bundle.
import { localeRegistry, type LocaleInfo } from './locales.mjs';

export type { LocaleInfo };
export { localeRegistry };

export const defaultLocale = 'en';

/** Registry entry for a locale code, or undefined for a code we do not serve. */
export function localeInfo(code: string): LocaleInfo | undefined {
  return localeRegistry.find((locale) => locale.code === code);
}

/** Text direction for a locale code; left-to-right for anything unknown. */
export function directionOf(code: string): 'ltr' | 'rtl' {
  return localeInfo(code)?.dir ?? 'ltr';
}

/** A locale is indexable only once it has a translation (machine or reviewed). */
export function isTranslated(code: string): boolean {
  const status = localeInfo(code)?.status;
  return status === 'machine' || status === 'reviewed';
}
