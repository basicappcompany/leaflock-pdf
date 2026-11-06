// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { serviceWorker } from './integrations/service-worker.mjs';
import { standardFonts } from './integrations/standard-fonts.mjs';
import { vendorAssets } from './integrations/vendor-assets.mjs';
import { astroFallback, astroLocales } from './src/i18n/locales.mjs';

export default defineConfig({
  site: 'https://leaflockpdf.com',
  // Lets parallel test runs build into separate folders (see playwright.config.ts).
  outDir: process.env.LEAFLOCK_OUT_DIR ?? './dist',
  integrations: [react(), standardFonts(), vendorAssets(), serviceWorker()],
  // Shiki's inline styles would break the CSP below, and we don't show code anyway.
  markdown: { syntaxHighlight: false },
  security: {
    // The privacy promise, enforced by the browser: pages may only talk to our own origin.
    // Any change that loosens connect-src must be reviewed by the owner.
    csp: {
      directives: [
        "default-src 'self'",
        "connect-src 'self'",
        "img-src 'self' blob: data:",
        "media-src 'self' blob:",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // pdf.js and tesseract.js run WebAssembly. 'wasm-unsafe-eval' allows compiling
      // WebAssembly only; JavaScript eval() stays blocked.
      scriptDirective: { resources: ["'self'", "'wasm-unsafe-eval'"] },
    },
  },
  i18n: {
    defaultLocale: 'en',
    // The list lives in src/i18n/locales.mjs. A locale is *published* (indexed, in hreflang
    // and the sitemap) once it has a folder in src/i18n/ and a status other than 'planned';
    // until then its URLs serve English and are noindex.
    locales: astroLocales,
    fallback: astroFallback,
    routing: { prefixDefaultLocale: false, fallbackType: 'rewrite' },
  },
});
