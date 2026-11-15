import { test as base } from '@playwright/test';

export * from '@playwright/test';

/**
 * Every spec imports `test` and `expect` from here rather than from Playwright.
 *
 * A tool run waits for `POST /api/usage/claim` and does not start without a 2xx (src/lib/usage.ts, fail closed).
 * `astro preview` serves the static build only, so that endpoint 404s here and no tool would ever run. This
 * answers it for every test that does not care. A test that does care (usage.spec.ts, entitlement.spec.ts) registers
 * its own route inside the test, which takes precedence over this one.
 *
 * The real endpoint, its counting and its 402s are covered by tests/unit/server/claim.test.ts.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/api/usage/claim', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ allowed: true, remaining: 20, reason: 'anonymous' }) }),
    );
    await use(page);
  },
});
