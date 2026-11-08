import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { HOST, KEY, KEY_LOCATION, chunk, requestBody, urlsFromSitemap } from '../../scripts/indexnow.mjs';

describe('IndexNow', () => {
  it('serves the key it sends, from a file in public/, with nothing else in it', async () => {
    const file = await readFile(new URL(`../../public/${KEY}.txt`, import.meta.url), 'utf8');
    expect(file.trim()).toBe(KEY);
    expect(KEY).toMatch(/^[a-f0-9]{32}$/);
    expect(KEY_LOCATION).toBe(`https://${HOST}/${KEY}.txt`);
  });

  it('reads the page addresses from a sitemap, once each, on our host only', () => {
    const xml = `<urlset>
      <url><loc>https://${HOST}/</loc><xhtml:link rel="alternate" hreflang="de" href="https://${HOST}/de/"/></url>
      <url><loc>https://${HOST}/merge-pdf/</loc></url>
      <url><loc>https://${HOST}/merge-pdf/</loc></url>
      <url><loc>https://elsewhere.example/x/</loc></url>
      <url><loc>not a url</loc></url>
    </urlset>`;
    expect(urlsFromSitemap(xml)).toEqual([`https://${HOST}/`, `https://${HOST}/merge-pdf/`]);
  });

  it('splits a long list into requests of at most the allowed size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });

  it('names the host, the key and where the key can be checked', () => {
    expect(requestBody(['https://leaflockpdf.com/'])).toEqual({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: ['https://leaflockpdf.com/'],
    });
  });
});
