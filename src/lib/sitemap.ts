import { getAbsoluteLocaleUrl } from 'astro:i18n';
import { locales } from '../i18n';
import { categories, landings, tools } from '../tools/registry';
import { entriesFor, slugOf } from './content';
import { contentPages } from './siteLinks';

export interface SitemapEntry {
  /** Path without locale prefix. */
  path: string;
  lastmod?: Date | undefined;
}

/** Every indexable page, once per path; locale variants are added as hreflang alternates. */
export async function sitemapEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [{ path: '' }, { path: 'pricing' }, { path: 'guides' }, { path: 'compare' }];
  for (const tool of tools) entries.push({ path: tool.slug });
  for (const landing of landings) entries.push({ path: landing.slug });
  for (const category of categories) entries.push({ path: `tools/${category}` });

  const pages = await entriesFor('pages', 'en');
  for (const page of contentPages) {
    const entry = pages.find((item) => slugOf(item) === page);
    if (entry) entries.push({ path: page, lastmod: entry.data.updated });
  }
  for (const guide of await entriesFor('guides', 'en')) {
    entries.push({ path: `guides/${slugOf(guide)}`, lastmod: guide.data.updated ?? guide.data.published });
  }
  for (const page of await entriesFor('compare', 'en')) {
    entries.push({ path: `compare/${slugOf(page)}`, lastmod: page.data.checkedOn });
  }
  return entries;
}

/**
 * Languages listed in the sitemap. English only for now (17 November 2026): Search Console showed 790 of 790
 * submitted URLs as "Discovered, currently not indexed" and 0 indexed, on a domain a few weeks old. Most of
 * those URLs were machine-translated copies of the same pages, so the sitemap now asks Google to crawl the
 * English pages first. The translated pages still exist, carry their own hreflang tags in the HTML, and stay
 * indexable; they are only left out of this file. To list every translated locale again, set this to null
 * once English pages are indexed (docs/TODO.md, Search Console).
 */
export const SITEMAP_LOCALES: readonly string[] | null = ['en'];

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function sitemapXml(entries: readonly SitemapEntry[]): string {
  // Only locales with a translation: a 'planned' locale serves English and must not be indexed.
  const codes = Object.keys(locales).filter((code) => SITEMAP_LOCALES === null || SITEMAP_LOCALES.includes(code));
  const urls = codes.flatMap((locale) =>
    entries.map((entry) => {
      const alternates = [
        ...codes.map((code) => `<xhtml:link rel="alternate" hreflang="${code}" href="${escape(getAbsoluteLocaleUrl(code, entry.path))}"/>`),
        `<xhtml:link rel="alternate" hreflang="x-default" href="${escape(getAbsoluteLocaleUrl('en', entry.path))}"/>`,
      ];
      const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod.toISOString().slice(0, 10)}</lastmod>` : '';
      return `<url><loc>${escape(getAbsoluteLocaleUrl(locale, entry.path))}</loc>${lastmod}${alternates.join('')}</url>`;
    }),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
  ].join('\n');
}
