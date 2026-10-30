/// <reference types="node" />
import { readFile } from 'node:fs/promises';
import { expect, type Download, type Page } from '@playwright/test';

export function pdfUpload(name: string, bytes: Uint8Array) {
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(bytes) };
}

/**
 * Records every request that leaves our origin and every console error (CSP violations
 * show up there). Call `assertClean()` at the end of a test.
 */
export function watchPage(page: Page, origin: string) {
  const offsite: string[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith(origin) && !url.startsWith('blob:') && !url.startsWith('data:')) offsite.push(url);
  });
  // Edge re-requests a broken <img> through connect-src, and our CSP blocks it. The URL is
  // an in-memory blob of this page, so nothing could leave the device; ignore exactly that.
  const ownBlobBlocked = `Connecting to 'blob:${origin.replace(/\/$/, '')}/`;
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (text.startsWith(ownBlobBlocked) && text.includes("connect-src 'self'")) return;
    // These tests run against `astro preview`, which serves the static build only: our
    // Cloudflare Functions don't exist there, so any call to one 404s and the browser
    // logs it. The client is built to carry on when that happens (src/lib/usage.ts fails
    // open), and a test that cares about an endpoint mocks it itself.
    if (message.location().url.startsWith(`${origin.replace(/\/$/, '')}/api/`)) return;
    consoleErrors.push(text);
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  return {
    offsite,
    consoleErrors,
    assertClean() {
      expect(offsite, 'requests to other sites').toEqual([]);
      expect(consoleErrors, 'console errors').toEqual([]);
    },
  };
}

/** Clicks a download link/button and returns the downloaded bytes. */
export async function download(page: Page, click: () => Promise<void>): Promise<{ file: Download; bytes: Buffer }> {
  const pending = page.waitForEvent('download');
  await click();
  const file = await pending;
  return { file, bytes: await readFile(await file.path()) };
}
