import { expect, test } from './fixtures';

/**
 * The verifiability page (roadmap 3.4), tested in a browser because every claim it makes is
 * made by a browser API: Resource Timing, `securitypolicyviolation`, and `navigator.onLine`.
 * A unit test would pass against a page that cannot work, which `CLAUDE.md` warns about.
 *
 * The success path is what matters here. This page's failure mode is not a crash — it is
 * quietly displaying a reassuring result it did not actually observe, on the one page whose
 * entire purpose is not being taken on trust.
 */

test.describe('/verify', () => {
  test('lists the page\'s own requests and finds nothing foreign', async ({ page }) => {
    await page.goto('/verify');

    // The count comes from the browser's own record, so it cannot be zero: loading the
    // page necessarily fetched the script that renders this panel.
    const count = page.locator('.verify__count');
    await expect(count).toContainText(/\d+ requests so far/);
    const text = (await count.textContent()) ?? '';
    const requests = Number(/(\d+) requests/.exec(text)?.[1] ?? '0');
    expect(requests, 'the page fetched something to render at all').toBeGreaterThan(0);

    await expect(page.getByText('No request has gone to any other site')).toBeVisible();

    // And the full list is there to be read, not just summarised.
    await page.getByText('Show the full list').click();
    const items = page.locator('.verify__list li');
    expect(await items.count()).toBeGreaterThan(0);
  });

  test('the browser blocks a cross-origin request, and the page reports what it said', async ({ page }) => {
    await page.goto('/verify');
    await page.getByRole('button', { name: 'Try to contact another site' }).click();

    await expect(page.getByText('Blocked by your browser, not by us.')).toBeVisible();

    // The three facts are the browser's, not ours: the directive that refused, the address
    // it refused to reach, and what the page got back instead.
    const result = page.locator('.verify__result');
    await expect(result).toContainText('connect-src');
    await expect(result).toContainText('https://example.com');
    await expect(result).toContainText('TypeError');

    // The honest-failure branch must not be showing at the same time.
    await expect(page.getByText('The request was not blocked')).toBeHidden();
  });

  test('the blocked attempt adds nothing to the request list', async ({ page }) => {
    // Probed before the page was written: a request blocked by CSP leaves no Resource
    // Timing entry. The panels would contradict each other if that ever changed, so this
    // pins the platform behaviour the page's wording depends on.
    await page.goto('/verify');
    await page.getByRole('button', { name: 'Try to contact another site' }).click();
    await expect(page.getByText('Blocked by your browser, not by us.')).toBeVisible();

    await expect(page.getByText('No request has gone to any other site')).toBeVisible();
    const foreign = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter((entry) => !entry.name.startsWith(location.origin)).length,
    );
    expect(foreign, 'a blocked request must not appear as a real one').toBe(0);
  });

  test('reports the network state, and keeps working when it goes away', async ({ page, context }) => {
    await page.goto('/verify');
    await expect(page.getByText('your browser reports that you are online', { exact: false })).toBeVisible();

    await context.setOffline(true);
    // The claim the page makes about itself: the line changes on its own, with no reload.
    await expect(page.getByText('still working', { exact: false })).toBeVisible();

    await context.setOffline(false);
    await expect(page.getByText('you are online', { exact: false })).toBeVisible();
  });

  test('is reachable from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'See it for yourself' }).first().click();
    await expect(page).toHaveURL(/\/verify\/?$/);
  });
});
