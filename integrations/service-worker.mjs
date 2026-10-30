// @ts-check
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/**
 * Pages that are nothing without a session, so precaching their shell would only put a
 * permanently-loading screen in front of an offline visitor.
 */
const SESSION_ONLY = ['/account', '/dashboard', '/login'];

/** Extensions that belong in the precached shell: small, and needed to render anything. */
const SHELL_EXTENSIONS = new Set(['.html', '.css', '.webmanifest', '.svg', '.ico']);

/**
 * The one hashed chunk worth precaching: src/lib/pdf/pdf.worker.ts, which every tool
 * needs before it can do any work at all and which is requested only when the first job
 * runs. Everything else under /_astro/ is cached as it is used.
 *
 * Deliberately not pdf.js's own renderer worker (`pdf.worker.min.*`, ~1.2MB): that one is
 * only needed by tools that draw page previews, and those also need the vendored fonts
 * and wasm, which are never precached either.
 */
const PRECACHE_CODE_PATTERN = /^\/_astro\/pdf\.worker-[^/]+\.js$/;

/** @param {string} dir @returns {AsyncGenerator<string>} */
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/**
 * Turns a built file path into the URL it is served at. Astro writes `about/index.html`
 * for `/about`, so the trailing `index.html` goes — the worker matches on the URL the
 * browser actually requests.
 *
 * @param {string} file @param {string} dist
 */
function toUrl(file, dist) {
  const rel = path.relative(dist, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'/index.html'.length)}`;
  return `/${rel}`;
}

/**
 * Fills in the placeholders in public/sw.js once the build has produced the files it
 * needs to list. Written as a build step rather than kept in the worker by hand so the
 * precache list cannot drift from what was actually built.
 *
 * @returns {import('astro').AstroIntegration}
 */
export function serviceWorker() {
  return {
    name: 'leaflock:service-worker',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const swPath = path.join(dist, 'sw.js');

        const source = await readFile(swPath, 'utf8').catch(() => '');
        if (!source) {
          logger.warn('public/sw.js is missing: the site will work, but not offline');
          return;
        }

        /** @type {string[]} */
        const shell = [];
        /** @type {string[]} */
        const hashedAssets = [];
        /** @type {string[]} */
        const criticalCode = [];
        for await (const file of walk(dist)) {
          const url = toUrl(file, dist);
          if (url === '/sw.js') continue;
          if (url.startsWith('/_astro/')) {
            hashedAssets.push(url);
            if (PRECACHE_CODE_PATTERN.test(url)) criticalCode.push(url);
            continue;
          }
          // Share images are one per page and never needed to render one.
          if (url.startsWith('/og/') || url.startsWith('/vendor/')) continue;
          if (!SHELL_EXTENSIONS.has(path.extname(file))) continue;
          if (SESSION_ONLY.some((prefix) => url === prefix || url.startsWith(`${prefix}/`))) continue;
          shell.push(url);
        }
        shell.sort();

        // The build id covers the shell *and* the hashed asset names, so any change to
        // either retires the previous caches on the next activation.
        const buildId = createHash('sha256').update(JSON.stringify([shell, hashedAssets.sort()])).digest('hex').slice(0, 12);
        // Vendor files are not content-hashed, so their cache is keyed by the package
        // versions that produced them — the stamp vendor-assets.mjs already writes.
        const vendorVersions = await readFile(path.join(root, 'public', 'vendor', '.versions'), 'utf8').catch(() => 'none');
        const vendorId = createHash('sha256').update(vendorVersions).digest('hex').slice(0, 12);

        if (criticalCode.length === 0) {
          // A rename would silently cost every visitor the offline promise, so say so.
          logger.warn('No job worker chunk matched PRECACHE_CODE_PATTERN: the first job offline will fail');
        }

        const filled = source
          .replace("'__PRECACHE__'", JSON.stringify(shell))
          .replace("'__PRECACHE_CODE__'", JSON.stringify(criticalCode))
          .replace('__BUILD_ID__', buildId)
          .replace('__VENDOR_ID__', vendorId);
        await writeFile(swPath, filled);

        logger.info(
          `Service worker ready: ${shell.length} shell URLs + ${criticalCode.length} worker chunk(s) precached, build ${buildId}`,
        );
      },
    },
  };
}
