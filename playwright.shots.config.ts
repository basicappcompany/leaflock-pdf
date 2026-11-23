/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

/**
 * Captures committed screenshots of our own pages (`pnpm shots`): today only the /verify
 * proof image shown on /security. It serves the production build already in dist/, so run
 * `pnpm build` first; the CSP and the request record only look right there.
 */
const port = Number(process.env.LEAFLOCK_PORT ?? 4322);
// Set to capture a deployed site instead of the local build.
const remote = process.env.LEAFLOCK_SHOT_URL;

export default defineConfig({
  testDir: 'scripts',
  testMatch: /verify-screenshot\.ts$/,
  reporter: 'list',
  use: { baseURL: remote ?? `http://localhost:${port}` },
  projects: [
    {
      name: 'shots',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.CI ? {} : { channel: 'msedge' }),
        viewport: { width: 900, height: 1000 },
        deviceScaleFactor: 1,
        colorScheme: 'light',
      },
    },
  ],
  ...(remote
    ? {}
    : {
        webServer: {
          command: `pnpm exec astro preview --port ${port}`,
          url: `http://localhost:${port}`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }),
});
