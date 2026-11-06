import type { APIRoute } from 'astro';
import { getMessages, localeInfo, locales } from '../i18n';
import { format } from '../i18n/format';

/**
 * /lang-offers.json — what the first-visit language banner says, in each language.
 *
 * It used to be embedded in every page's HTML. With ten languages that was 2 KB on every
 * page and pushed tool pages over their HTML budget, and it grows with every language added.
 * Now the banner script fetches this one cached file, same-origin, and only when a visitor's
 * browser language matches an offer and they have not dismissed it. No third party is involved.
 */
export const GET: APIRoute = () => {
  const offers = Object.fromEntries(
    Object.keys(locales).map((code) => {
      const t = getMessages(code).common.language;
      return [code, { message: format(t.suggest, { language: localeInfo(code)?.native ?? code }), action: t.switchTo, dismiss: t.dismiss }];
    }),
  );
  return new Response(JSON.stringify(offers), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
