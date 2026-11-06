import { defaultLocale, localeInfo } from '../../../i18n/config';

/** Link to another tool page in the same language (matches the i18n routing in astro.config.mjs). */
export function toolUrl(locale: string, slug: string): string {
  return locale === defaultLocale ? `/${slug}` : `/${localeInfo(locale)?.path ?? locale}/${slug}`;
}
