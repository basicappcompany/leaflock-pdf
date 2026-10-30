import { defaultLocale } from '../../../i18n';

/** Link to another tool page in the same language (matches the i18n routing in astro.config.mjs). */
export function toolUrl(locale: string, slug: string): string {
  return locale === defaultLocale ? `/${slug}` : `/${locale}/${slug}`;
}
