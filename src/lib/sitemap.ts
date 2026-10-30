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

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function sitemapXml(entries: readonly SitemapEntry[]): string {
  const codes = Object.keys(locales);
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
