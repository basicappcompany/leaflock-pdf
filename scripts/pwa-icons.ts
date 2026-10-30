/// <reference types="node" />
import { mkdir, readFile } from 'node:fs/promises';
import { test } from '@playwright/test';

/**
 * Renders the installed-app icons in public/icons/ from the one source of truth,
 * public/favicon.svg. Run with `pnpm icons` after changing the logo.
 *
 * A maskable icon is a separate file rather than the same one reused: Android crops
 * maskable icons to whatever shape the launcher uses, so the mark has to sit inside a
 * safe circle with the background painted out to the edges. Handing it a transparent
 * icon designed for a browser tab gets the leaf clipped.
 */

const BACKGROUND = '#2a7548';

function page(logo: string, size: number, inset: number, background: string | null): string {
  return `<!doctype html><html><head><style>
    html, body { margin: 0; }
    body { width: ${size}px; height: ${size}px; display: grid; place-items: center;
      background: ${background ?? 'transparent'}; }
    img { width: ${size - inset * 2}px; height: ${size - inset * 2}px; }
  </style></head><body><img src="data:image/svg+xml;base64,${logo}" alt=""></body></html>`;
}

test('render installed-app icons', async ({ page: browserPage }) => {
  const logo = (await readFile('public/favicon.svg')).toString('base64');
  await mkdir('public/icons', { recursive: true });

  const icons = [
    // Any-purpose icons keep their own transparency and fill the square.
    { file: 'icon-192.png', size: 192, inset: 0, background: null },
    { file: 'icon-512.png', size: 512, inset: 0, background: null },
    // Maskable: the mark at 60% on an opaque ground, so a circular crop keeps all of it.
    { file: 'maskable-512.png', size: 512, inset: 102, background: BACKGROUND },
  ];

  for (const icon of icons) {
    await browserPage.setViewportSize({ width: icon.size, height: icon.size });
    await browserPage.setContent(page(logo, icon.size, icon.inset, icon.background));
    await browserPage.screenshot({
      path: `public/icons/${icon.file}`,
      omitBackground: icon.background === null,
    });
  }
});
