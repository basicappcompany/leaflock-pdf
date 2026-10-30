/**
 * Service worker: makes LeafLock PDF installable and usable with no network.
 *
 * This is the one part of the product our competitors cannot copy cheaply. iLovePDF and
 * Smallpdf sell desktop applications to offer offline work, because their processing
 * happens on a server. Ours already happens on the device, so the whole feature is this
 * file — nothing about a tool needs to change to work offline.
 *
 * Three caches, because the three kinds of asset have genuinely different lifetimes:
 *
 *   shell   HTML, CSS, icons, the manifest. Precached on install, so every page is
 *           navigable offline straight away. Small: a few hundred kilobytes.
 *   code    Everything under /_astro/. Content-hashed by the build, so cache-first is
 *           always correct and nothing can go stale. Cached as it is used rather than
 *           up front, because a visitor who only merges PDFs should not pay for the OCR
 *           chunk — with one exception, PRECACHE_CODE: the job worker, which is fetched
 *           only when a tool first runs. Without it a visitor could open a tool offline
 *           and have the very first job fail, which is the opposite of the promise.
 *   vendor  Everything under /vendor/ — pdf.js fonts and wasm, the tesseract core and
 *           its 10MB language model. 26MB in total, which is exactly why it is never
 *           precached: OCR works offline after it has been used once online.
 *
 * The placeholders below are filled in at build time by integrations/service-worker.mjs.
 * Left unfilled (a dev server serving public/ directly) the worker deliberately does
 * nothing, so development never fights a cache.
 */

const PRECACHE = '__PRECACHE__';
const PRECACHE_CODE = '__PRECACHE_CODE__';
const BUILD_ID = '__BUILD_ID__';
/** Changes only when the pdf.js or tesseract.js package versions do. */
const VENDOR_ID = '__VENDOR_ID__';

const PREFIX = 'leaflock-';
const SHELL = `${PREFIX}shell-${BUILD_ID}`;
const CODE = `${PREFIX}code-${BUILD_ID}`;
const VENDOR = `${PREFIX}vendor-${VENDOR_ID}`;
const OFFLINE_URL = '/offline';

const configured = !BUILD_ID.startsWith('__');
const shellUrls = Array.isArray(PRECACHE) ? PRECACHE : [];
const codeUrls = Array.isArray(PRECACHE_CODE) ? PRECACHE_CODE : [];

self.addEventListener('install', (event) => {
  if (!configured) return;
  // One failed URL must not fail the whole install, or a single renamed asset would
  // leave every visitor without a worker at all.
  event.waitUntil(
    (async () => {
      const add = async (/** @type {string} */ cacheName, /** @type {string[]} */ urls) => {
        const cache = await caches.open(cacheName);
        await Promise.all(urls.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})));
      };
      // Into their own caches, so the fetch handler finds each where it looks for it.
      await Promise.all([add(SHELL, shellUrls), add(CODE, codeUrls)]);
    })(),
  );
});

self.addEventListener('activate', (event) => {
  if (!configured) return;
  const keep = new Set([SHELL, CODE, VENDOR]);
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      // Our own stale caches only: a previous build's shell and code, and the vendor
      // cache only when the package versions behind it actually changed.
      await Promise.all(names.filter((name) => name.startsWith(PREFIX) && !keep.has(name)).map((name) => caches.delete(name)));
      // `self` is a ServiceWorkerGlobalScope, which this project's DOM-typed tsconfig
      // cannot express. Claim control on first activation so the very first visit is
      // already covered rather than only the next one.
      await (/** @type {{ clients: { claim: () => Promise<void> } }} */ (/** @type {unknown} */ (self))).clients.claim();
    })(),
  );
});

/** Only a real, same-origin, non-partial response is worth storing. */
function storable(response) {
  return response && response.ok && response.type === 'basic' && response.status !== 206;
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (storable(response)) cache.put(request, response.clone()).catch(() => {});
  return response;
}

/**
 * Pages come from the network when there is one, so content is never stale, and from the
 * cache when there is not. The offline page is the last resort for a URL never visited.
 */
async function navigate(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await fetch(request);
    if (storable(response)) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch {
    return (await cache.match(request)) ?? (await cache.match(OFFLINE_URL)) ?? Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  if (!configured) return;
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache an API call. Sessions, metering and payment must always be live, and a
  // cached /api/auth/me would show the wrong person as signed in.
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigate(request));
    return;
  }
  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(cacheFirst(request, CODE));
    return;
  }
  if (url.pathname.startsWith('/vendor/')) {
    event.respondWith(cacheFirst(request, VENDOR));
    return;
  }
  event.respondWith(cacheFirst(request, SHELL));
});
