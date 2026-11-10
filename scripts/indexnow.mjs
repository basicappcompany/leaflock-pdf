/**
 * Tells the search engines that support IndexNow which URLs exist, so they crawl them without
 * waiting to find them: Bing, Yandex, Seznam and Naver, and through Bing, DuckDuckGo and Ecosia.
 * Google does not use IndexNow; for Google, use Search Console (sitemap and "request indexing").
 *
 *   pnpm indexnow             sends every URL in the live sitemap
 *   pnpm indexnow --dry-run   shows what would be sent, sends nothing
 *
 * How it works: the protocol wants proof that this site is ours, so the key below is also served
 * as a file at /<key>.txt (public/<key>.txt). An engine fetches that file to check the key before
 * it trusts the request. The key is public by design, like a verification token; it can only be
 * used to say "these URLs on this host changed", never to read or change anything.
 *
 * What is sent is a list of public page addresses, taken from the public sitemap. Nothing about
 * any visitor or any file.
 */
import { pathToFileURL } from 'node:url';

export const HOST = 'leaflockpdf.com';
export const KEY = '97861d465f538d1490791113182b383e';
export const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
export const SITEMAP = `https://${HOST}/sitemap.xml`;
export const ENDPOINT = 'https://api.indexnow.org/indexnow';
/** Says who is asking, so an edge rule or a log can tell this script from an anonymous client. */
const HEADERS = { 'User-Agent': 'LeafLock-IndexNow/1.0 (+https://leaflockpdf.com)', Accept: 'application/xml,text/plain,*/*' };
/** IndexNow accepts up to 10,000 URLs per request. */
export const MAX_PER_REQUEST = 10_000;

/** The page addresses in a sitemap, in order, keeping only those on our own host. */
export function urlsFromSitemap(xml) {
  const urls = [];
  for (const match of xml.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>/g)) {
    const url = match[1].trim();
    try {
      if (new URL(url).host === HOST) urls.push(url);
    } catch {
      /* Not a URL: skipped rather than sent. */
    }
  }
  return [...new Set(urls)];
}

export function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export function requestBody(urlList) {
  return { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const keyFile = await fetch(KEY_LOCATION, { headers: HEADERS });
  const served = (await keyFile.text()).trim();
  if (!keyFile.ok || served !== KEY) {
    console.error(`The key file is not live yet at ${KEY_LOCATION} (status ${keyFile.status}). Deploy it first; engines check it before they trust a request.`);
    process.exit(1);
  }

  const sitemap = await fetch(SITEMAP, { headers: HEADERS });
  if (!sitemap.ok) {
    console.error(`Could not read ${SITEMAP} (status ${sitemap.status}).`);
    // say why: a 403 from a cloud runner is usually an edge rule, and its headers and first lines name it
    console.error(`server: ${sitemap.headers.get('server')}, cf-ray: ${sitemap.headers.get('cf-ray')}, cf-mitigated: ${sitemap.headers.get('cf-mitigated')}, content-type: ${sitemap.headers.get('content-type')}`);
    console.error((await sitemap.text()).slice(0, 300).replace(/\s+/g, ' '));
    process.exit(1);
  }
  const urls = urlsFromSitemap(await sitemap.text());
  console.log(`${urls.length} URLs in the sitemap.`);
  if (dryRun) {
    console.log(urls.slice(0, 5).join('\n'));
    console.log('...\nDry run: nothing sent.');
    return;
  }

  for (const part of chunk(urls, MAX_PER_REQUEST)) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(requestBody(part)),
    });
    // 200 accepted, 202 accepted and the key is still being checked; anything else is a problem.
    console.log(`Sent ${part.length} URLs: HTTP ${response.status} ${response.statusText}`);
    if (response.status !== 200 && response.status !== 202) {
      console.error((await response.text()).slice(0, 300));
      process.exit(1);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
