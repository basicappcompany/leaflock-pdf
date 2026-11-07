import { devices, expect, test, type Page } from '@playwright/test';
import { en } from '../../src/i18n/en';
import { watchPage } from './helpers';

/**
 * Starred tools: the star on a tool's page, the star on every sidebar row, the Starred group
 * below Recent tools, and the account sync.
 *
 * `astro preview` serves none of the Cloudflare Functions, so /api/starred is stubbed with a
 * small in-memory account. That is the right boundary: what matters here is what the browser
 * sends and what it does with the answer, and the endpoint itself is covered in
 * tests/unit/server/starred.test.ts.
 */

const KEY = 'leaflock-starred';
const HINT_COOKIE = 'leaflock_signed_in';
const sb = en.common.sidebar;

async function stored(page: Page) {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? 'null') as { tools: string[]; account?: string; pending?: { add: string[]; remove: string[] } } | null, KEY);
}

async function seedStars(page: Page, value: unknown) {
  await page.addInitScript(([key, v]) => window.localStorage.setItem(key!, v!), [KEY, JSON.stringify(value)]);
}

/** A stand-in account: serves its list on GET, replaces it on PUT, and records every PUT body. */
async function fakeAccount(page: Page, baseURL: string, initial: string[], account = 'acct1') {
  const state = { tools: initial, puts: [] as string[][], gets: 0 };
  await page.context().addCookies([{ name: HINT_COOKIE, value: '1', url: baseURL }]);
  await page.route('**/api/starred', async (route) => {
    const request = route.request();
    if (request.method() === 'PUT') {
      const body = request.postDataJSON() as { tools: string[] };
      state.puts.push(body.tools);
      state.tools = body.tools;
      return route.fulfill({ json: { tools: state.tools, account } });
    }
    state.gets++;
    return route.fulfill({ json: { tools: state.tools, account } });
  });
  return state;
}

test.describe('on a desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the star on a tool page toggles, is pressed after a reload, and stores only the tool id', async ({ page, baseURL }) => {
    const watch = watchPage(page, baseURL!);
    await page.goto('/split-pdf');
    const star = page.locator('.star-toggle');
    await expect(star).toHaveAttribute('aria-label', en.common.star.label);
    await expect(star).toHaveAttribute('aria-pressed', 'false');

    await star.click();
    await expect(star).toHaveAttribute('aria-pressed', 'true');
    expect((await stored(page))?.tools).toEqual(['split']);

    await page.reload();
    await expect(page.locator('.star-toggle')).toHaveAttribute('aria-pressed', 'true');

    await page.locator('.star-toggle').click();
    await expect(page.locator('.star-toggle')).toHaveAttribute('aria-pressed', 'false');
    expect((await stored(page))?.tools).toEqual([]);
    watch.assertClean();
  });

  test('a landing page stars the tool it belongs to', async ({ page }) => {
    await page.goto('/reverse-pdf-pages');
    await page.locator('.star-toggle').click();
    expect((await stored(page))?.tools).toHaveLength(1);
  });

  test('the Starred group sits below Recent tools and above the categories, and both have an icon', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('leaflock-recent', JSON.stringify([{ tool: 'merge', at: Date.now() }])));
    await seedStars(page, { tools: ['rotate', 'crop'] });
    await page.goto('/split-pdf');

    const recent = page.locator('#sidebarRecent');
    const starred = page.locator('#sidebarStarred');
    await expect(starred).toBeVisible();
    await expect(starred.locator('summary .tools-sidebar__heading-label')).toHaveText(sb.starred);
    await expect(starred.locator('summary .tools-sidebar__heading-count')).toHaveText('2');
    await expect(starred.locator('li')).toHaveCount(2);
    // Newest first, as stored.
    await expect(starred.locator('li').first()).toContainText(en.tools.rotate.title);

    for (const group of [recent, starred]) {
      const icon = group.locator('summary svg.tools-sidebar__heading-icon');
      await expect(icon).toBeVisible();
      expect((await icon.boundingBox())!.width).toBeGreaterThan(8);
    }
    const categoryIcon = page.locator('.tools-sidebar__group summary svg.tools-sidebar__heading-icon').first();
    expect((await categoryIcon.boundingBox())!.width).toBeCloseTo((await recent.locator('summary svg.tools-sidebar__heading-icon').boundingBox())!.width, 0);

    const y = async (locator: typeof recent) => (await locator.boundingBox())!.y;
    expect(await y(recent)).toBeLessThan(await y(starred));
    expect(await y(starred)).toBeLessThan(await y(page.locator('.tools-sidebar__group').first()));
  });

  test('no Starred group while nothing is starred, and it steps aside while searching', async ({ page }) => {
    await page.goto('/split-pdf');
    await expect(page.locator('#sidebarStarred')).toHaveCount(0);

    await seedStars(page, { tools: ['rotate'] });
    await page.goto('/split-pdf');
    await expect(page.locator('#sidebarStarred')).toBeVisible();
    await page.locator('#sidebarSearch').fill('merge');
    await expect(page.locator('#sidebarStarred')).toBeHidden();
    await page.locator('#sidebarSearch').fill('');
    await expect(page.locator('#sidebarStarred')).toBeVisible();
  });

  test('every sidebar row has a star: pressing it stars the tool without leaving the page', async ({ page }) => {
    await page.goto('/split-pdf');
    const row = page.locator('.tools-sidebar__group .tools-sidebar__star[data-tool="merge"]');
    await expect(row).toHaveAttribute('aria-pressed', 'false');
    await expect(row).toHaveAttribute('aria-label', sb.starNamed.replace('{name}', en.tools.merge.title));

    await row.click();
    await expect(page).toHaveURL(/split-pdf/);
    await expect(row).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#sidebarStarred li')).toContainText(en.tools.merge.title);
    // The tool page's own star is the same list: starring Merge here does not press Split's.
    await expect(page.locator('.star-toggle')).toHaveAttribute('aria-pressed', 'false');
  });

  test("the star on the tool's page and the one in the sidebar are the same list", async ({ page }) => {
    await page.goto('/split-pdf');
    await page.locator('.star-toggle').click();
    await expect(page.locator('#sidebarStarred li')).toContainText(en.tools.split.title);
    await expect(page.locator('.tools-sidebar__group .tools-sidebar__star[data-tool="split"]')).toHaveAttribute('aria-pressed', 'true');

    // Removing it from the copy inside the Starred group removes it everywhere.
    await page.locator('#sidebarStarred .tools-sidebar__star').click();
    await expect(page.locator('#sidebarStarred')).toHaveCount(0);
    await expect(page.locator('.star-toggle')).toHaveAttribute('aria-pressed', 'false');
  });

  test('the Starred group collapses and stays collapsed on the next page', async ({ page }) => {
    await seedStars(page, { tools: ['rotate'] });
    await page.goto('/split-pdf');
    const group = page.locator('#sidebarStarred');
    await expect(group).toHaveJSProperty('open', true);
    await group.locator('summary').click();
    await expect(group).toHaveJSProperty('open', false);
    await page.goto('/merge-pdf');
    await expect(page.locator('#sidebarStarred')).toHaveJSProperty('open', false);
  });

  test('another tab starring a tool updates this one', async ({ page, context }) => {
    await page.goto('/split-pdf');
    await expect(page.locator('.star-toggle')).toBeVisible();
    // A light page in a second tab writes the list, which is what starring there does; the
    // browser then tells this tab through a storage event.
    const other = await context.newPage();
    await other.goto('/about');
    await other.evaluate((key) => window.localStorage.setItem(key, JSON.stringify({ tools: ['merge'] })), KEY);
    await expect(page.locator('#sidebarStarred li')).toContainText(en.tools.merge.title);
  });

  test('signed out, nothing is sent to the server', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/starred')) requests.push(request.url());
    });
    await page.goto('/split-pdf');
    await page.locator('.star-toggle').click();
    await page.waitForTimeout(1200);
    expect(requests).toEqual([]);
  });

  test('signed in: stars made before signing in and the account list are merged, and sent back once', async ({ page, baseURL }) => {
    const account = await fakeAccount(page, baseURL!, ['rotate']);
    await seedStars(page, { tools: ['merge'] });
    await page.goto('/split-pdf');

    await expect(page.locator('#sidebarStarred li')).toHaveCount(2);
    await expect.poll(() => account.puts.length).toBe(1);
    expect(account.puts[0]).toEqual(['merge', 'rotate']);
    await expect.poll(async () => (await stored(page))?.account).toBe('acct1');
    expect((await stored(page))?.pending).toEqual({ add: [], remove: [] });
  });

  test('signed in: a star is saved to the account, and an unstar is not undone by it', async ({ page, baseURL }) => {
    const account = await fakeAccount(page, baseURL!, ['rotate', 'merge']);
    await page.goto('/split-pdf');
    await expect(page.locator('#sidebarStarred li')).toHaveCount(2);
    expect(account.puts).toEqual([]); // nothing to send: the account already matches

    await page.locator('.star-toggle').click(); // star Split
    await expect.poll(() => account.puts.length).toBe(1);
    expect(account.puts[0]).toEqual(['split', 'rotate', 'merge']);

    await page.locator('#sidebarStarred .tools-sidebar__star[data-tool="merge"]').click(); // unstar Merge
    await expect.poll(() => account.puts.length).toBe(2);
    expect(account.puts[1]).toEqual(['split', 'rotate']);

    // A fresh load, which syncs again, still shows Merge gone.
    await page.reload();
    await expect(page.locator('#sidebarStarred li')).toHaveCount(2);
    await expect(page.locator('#sidebarStarred')).not.toContainText(en.tools.merge.title);
  });

  test("signed in as someone else: the previous account's stars are replaced, not merged in", async ({ page, baseURL }) => {
    const account = await fakeAccount(page, baseURL!, ['rotate'], 'acct-b');
    await seedStars(page, { tools: ['merge', 'split'], account: 'acct-a', pending: { add: ['split'], remove: [] } });
    await page.goto('/crop-pdf');
    await expect(page.locator('#sidebarStarred li')).toHaveCount(1);
    await expect(page.locator('#sidebarStarred')).toContainText(en.tools.rotate.title);
    expect(account.puts).toEqual([]);
    expect((await stored(page))?.account).toBe('acct-b');
  });

  test('a stale sign-in cookie (the server answers null) leaves the local list alone', async ({ page, baseURL }) => {
    await page.context().addCookies([{ name: HINT_COOKIE, value: '1', url: baseURL! }]);
    await page.route('**/api/starred', (route) => route.fulfill({ json: null }));
    await seedStars(page, { tools: ['merge'] });
    await page.goto('/split-pdf');
    await expect(page.locator('#sidebarStarred li')).toContainText(en.tools.merge.title);
  });

  test('if the server is down the stars still work, and the change is kept to retry', async ({ page, baseURL }) => {
    await page.context().addCookies([{ name: HINT_COOKIE, value: '1', url: baseURL! }]);
    await page.route('**/api/starred', (route) => route.fulfill({ status: 503, json: { error: 'unavailable' } }));
    await page.goto('/split-pdf');
    await page.locator('.star-toggle').click();
    await expect(page.locator('#sidebarStarred li')).toContainText(en.tools.split.title);
    await page.waitForTimeout(1200);
    const data = await stored(page);
    expect(data?.tools).toEqual(['split']);
    expect(data?.pending?.add).toEqual(['split']);
  });

  test('damaged storage is ignored, not fatal', async ({ page }) => {
    await page.addInitScript(([key]) => window.localStorage.setItem(key!, '{not json'), [KEY]);
    await page.goto('/split-pdf');
    await expect(page.locator('.star-toggle')).toHaveAttribute('aria-pressed', 'false');
    await page.locator('.star-toggle').click();
    await expect(page.locator('.star-toggle')).toHaveAttribute('aria-pressed', 'true');
  });

  test('ids that are not tools are ignored', async ({ page }) => {
    await seedStars(page, { tools: ['not-a-tool', 'merge', 42] });
    await page.goto('/split-pdf');
    await expect(page.locator('#sidebarStarred li')).toHaveCount(1);
  });

  test('the dashboard lists starred tools, and has no card while there are none', async ({ page, baseURL }) => {
    await page.context().addCookies([{ name: HINT_COOKIE, value: '1', url: baseURL! }]);
    await page.route('**/api/auth/me', (route) => route.fulfill({ json: { email: 'someone@example.com', plan: 'free' } }));
    await page.route('**/api/usage/today', (route) => route.fulfill({ json: { plan: 'free', used: 0, limit: 30 } }));
    await page.route('**/api/starred', (route) => route.fulfill({ json: { tools: [], account: 'acct1' } }));
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: en.common.dashboard.welcome })).toBeVisible();
    await expect(page.getByRole('heading', { name: en.common.dashboard.starredHeading })).toHaveCount(0);

    await seedStars(page, { tools: ['merge'] });
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: en.common.dashboard.starredHeading })).toBeVisible();
    await expect(page.getByRole('link', { name: en.tools.merge.title }).first()).toBeVisible();
  });
});

test.describe('on a phone', () => {
  const { defaultBrowserType: _ignore, ...phone } = devices['iPhone 13'];
  test.use({ ...phone });

  test('the star on a tool page and the stars in the drawer are comfortable to tap, and work by touch', async ({ page }) => {
    await page.goto('/split-pdf');
    const pageStar = (await page.locator('.star-toggle').boundingBox())!;
    expect(pageStar.height).toBeGreaterThanOrEqual(36);
    await page.locator('.star-toggle').tap();
    await expect(page.locator('.star-toggle')).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#sidebarToggle').tap();
    await expect(page.locator('#toolsSidebar')).toBeVisible();
    await expect(page.locator('#sidebarStarred')).toBeVisible();
    const star = page.locator('.tools-sidebar__group .tools-sidebar__star[data-tool="merge"]');
    await star.scrollIntoViewIfNeeded();
    const box = (await star.boundingBox())!;
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
    await star.tap();
    await expect(star).toHaveAttribute('aria-pressed', 'true');
    // The drawer stayed open: a star is not a tap outside it.
    await expect(page.locator('#toolsSidebar')).toBeVisible();
  });
});
