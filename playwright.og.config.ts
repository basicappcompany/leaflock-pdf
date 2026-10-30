import { defineConfig } from '@playwright/test';

/**
 * Renders the generated images: share images in public/og/ (`pnpm og`) and the
 * installed-app icons in public/icons/ (`pnpm icons`). Both are committed, so this only
 * needs running when the logo or a tool title changes.
 */
export default defineConfig({
  testDir: 'scripts',
  testMatch: /(og-images|pwa-icons)\.ts$/,
  reporter: 'list',
  projects: [{ name: 'og', use: { channel: process.env.CI ? undefined : 'msedge', viewport: { width: 1200, height: 630 } } }],
});
