import type { APIRoute } from 'astro';
import { getRelativeLocaleUrl } from 'astro:i18n';
import { getMessages } from '../i18n';
import { toolById } from '../tools/registry';

/**
 * The installed-app manifest, generated rather than kept as a static file so its name,
 * description and shortcut labels come from the same strings as the rest of the site.
 *
 * `theme_color` and `background_color` are the only two colours in the project that
 * cannot be CSS variables — the browser paints the title bar and the splash screen
 * before any stylesheet exists — so they are the literal light-theme values from
 * src/styles/global.css and must be changed alongside them.
 */
const THEME_COLOR = '#2a7548';
const BACKGROUND_COLOR = '#f6f7f4';

/** The tools worth a launcher shortcut: the most reached for, and all free. */
const SHORTCUT_TOOLS = ['merge', 'split', 'compress'] as const;

export const GET: APIRoute = ({ currentLocale }) => {
  const locale = currentLocale ?? 'en';
  const messages = getMessages(locale);
  const common = messages.common;

  const manifest = {
    name: common.site.name,
    short_name: common.site.shortName,
    description: common.site.metaDescription,
    lang: locale,
    dir: 'ltr',
    start_url: getRelativeLocaleUrl(locale, ''),
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    theme_color: THEME_COLOR,
    background_color: BACKGROUND_COLOR,
    categories: ['productivity', 'utilities'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Separate file: a launcher crops maskable icons, so this one has the safe-zone
      // padding and an opaque ground (see scripts/pwa-icons.ts).
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: SHORTCUT_TOOLS.map((id) => ({
      name: messages.tools[id].title,
      url: getRelativeLocaleUrl(locale, toolById(id).slug),
    })),
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
