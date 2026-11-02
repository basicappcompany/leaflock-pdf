import type { CommonMessages } from '../i18n';

export type PageKey = keyof CommonMessages['pageLinks'];

/** Site pages by footer group. Paths are without locale prefix. */
export const footerGroups: readonly { heading: keyof CommonMessages['footer']; pages: readonly { key: PageKey; path: string }[] }[] = [
  {
    heading: 'product',
    pages: [
      { key: 'pricing', path: 'pricing' },
      { key: 'business', path: 'business' },
      { key: 'guides', path: 'guides' },
      { key: 'help', path: 'help' },
    ],
  },
  {
    heading: 'company',
    pages: [
      { key: 'about', path: 'about' },
      { key: 'security', path: 'security' },
      { key: 'claims', path: 'claims' },
      { key: 'verify', path: 'verify' },
      { key: 'compare', path: 'compare' },
      { key: 'contact', path: 'contact' },
    ],
  },
  {
    heading: 'legal',
    pages: [
      { key: 'privacy', path: 'privacy' },
      { key: 'terms', path: 'terms' },
      { key: 'cookies', path: 'cookies' },
      { key: 'licenses', path: 'licenses' },
    ],
  },
];

/** Pages rendered from src/content/pages, in no particular order. */
export const contentPages = ['about', 'security', 'claims', 'contact', 'business', 'help', 'privacy', 'terms', 'cookies', 'licenses'] as const;
