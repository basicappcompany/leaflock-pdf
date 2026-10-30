/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

// Override both to run several test sessions side by side, e.g.
// LEAFLOCK_PORT=4401 LEAFLOCK_OUT_DIR=dist-a pnpm test:e2e tests/e2e/split.spec.ts
const port = Number(process.env.LEAFLOCK_PORT ?? 4321);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // OCR, camera and multi-file tests are heavy; 30 s is too tight when they all run at once.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // More workers than this starve each other on a laptop and turn into timeouts.
  workers: process.env.CI ? 2 : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      // Locally we drive the Edge that ships with Windows, so no browser download is needed.
      // CI installs Playwright's own Chromium instead.
      use: { ...devices['Desktop Chrome'], ...(process.env.CI ? {} : { channel: 'msedge' }) },
    },
  ],
  webServer: {
    // Test the production build: the CSP is only emitted there.
    command: `pnpm exec astro build && pnpm exec astro preview --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
