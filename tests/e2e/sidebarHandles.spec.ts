import { expect, test, type Page } from '@playwright/test';
import { en } from '../../src/i18n/en';
import { watchPage } from './helpers';

/**
 * The three handles on the sidebar's inner edge: move to the other side, hide/show, reset.
 *
 * They are children of the sidebar, so they ride its edge: flush against it while it is open,
 * at the window edge on the same side while it is hidden. Pressing any of them while the
 * sidebar is hidden opens it and does what that handle says, in one press. A mock-up of this
 * once drew "docked left" on the right-hand side of the window, so every assertion here is
 * about measured positions, not attribute values.
 */
test.use({ viewport: { width: 1280, height: 800 } });

const sb = en.common.sidebar;

type Box = { x: number; y: number; width: number; height: number };
const side = (b: Box, win: number) => (b.x + b.width / 2 < win / 2 ? 'left' : 'right');

async function geometry(page: Page) {
  const win = 1280;
  const sidebar = (await page.locator('#toolsSidebar').boundingBox())!;
  const handles = (await page.locator('.tools-sidebar__handles').boundingBox())!;
  return { sidebar, handles, win };
}

async function openWith(page: Page, dock: 'left' | 'right', visible: 'visible' | 'hidden' = 'visible') {
  await page.addInitScript(
    ([d, v]) => {
      localStorage.setItem('toolsSidebarDock', d!);
      localStorage.setItem('toolsSidebarVisible', v!);
    },
    [dock, visible],
  );
  await page.goto('/split-pdf');
  await expect(page.locator('#sidebarToggle')).toBeVisible();
}

for (const dock of ['left', 'right'] as const) {
  test(`docked ${dock}: the sidebar and its handles are on that side, handles flush against the inner edge`, async ({ page, baseURL }) => {
    const watch = watchPage(page, baseURL!);
    await openWith(page, dock);
    // Measured until it settles: the sidebar's width eases for a moment after load.
    await expect
      .poll(async () => {
        const { sidebar, handles, win } = await geometry(page);
        const innerEdge = dock === 'left' ? sidebar.x + sidebar.width : sidebar.x;
        const handleEdge = dock === 'left' ? handles.x : handles.x + handles.width;
        return [side(sidebar, win), side(handles, win), Math.abs(innerEdge - handleEdge) <= 1, sidebar.width > 200];
      })
      .toEqual([dock, dock, true, true]);
    // The chevron's meaning is in CSS; its button says what a press does.
    await expect(page.locator('#sidebarToggle')).toHaveAttribute('aria-label', sb.hide);
    await expect(page.locator('#sidebarMove')).toHaveAttribute('aria-label', dock === 'left' ? sb.moveRight : sb.moveLeft);
    watch.assertClean();
  });

  test(`docked ${dock}: hiding leaves the handles on the same window edge`, async ({ page }) => {
    await openWith(page, dock);
    await page.locator('#sidebarToggle').click();
    await expect.poll(async () => (await geometry(page)).sidebar.width).toBeLessThan(2);
    const { handles, win } = await geometry(page);
    expect(side(handles, win)).toBe(dock);
    const gapToWindowEdge = dock === 'left' ? handles.x : win - (handles.x + handles.width);
    expect(gapToWindowEdge).toBeLessThanOrEqual(2);
    await expect(page.locator('#sidebarToggle')).toHaveAttribute('aria-label', sb.show);
    // Only the handles are left: the sidebar's own contents cannot be reached.
    await expect(page.locator('#sidebarSearch')).toBeHidden();
  });
}

test('the handles sit near the top, under the search box, not in the middle of the screen', async ({ page }) => {
  for (const visible of ['visible', 'hidden'] as const) {
    await openWith(page, 'left', visible);
    const { sidebar, handles } = await geometry(page);
    const search = (await page.locator('#sidebarSearch').boundingBox());
    // In the top fifth of the sidebar, and clear of the search box when it is showing.
    expect(handles.y - sidebar.y, `${visible}: distance from the sidebar's top`).toBeLessThan(sidebar.height / 5);
    expect(handles.y).toBeGreaterThan(sidebar.y);
    if (visible === 'visible' && search) expect(handles.y).toBeGreaterThanOrEqual(search.y + search.height);
  }
});

test('pressing Move while hidden opens the sidebar on the other side in one press', async ({ page }) => {
  await openWith(page, 'left', 'hidden');
  await page.locator('#sidebarMove').click();
  await expect.poll(async () => (await geometry(page)).sidebar.width).toBeGreaterThan(200);
  const { sidebar, handles, win } = await geometry(page);
  expect(side(sidebar, win)).toBe('right');
  expect(side(handles, win)).toBe('right');
  expect(await page.evaluate(() => localStorage.getItem('toolsSidebarDock'))).toBe('right');
  expect(await page.evaluate(() => localStorage.getItem('toolsSidebarVisible'))).toBe('visible');
});

test('pressing Reset while hidden opens the sidebar at the default position in one press', async ({ page }) => {
  await openWith(page, 'right', 'hidden');
  await page.locator('#sidebarReset').click();
  await expect.poll(async () => (await geometry(page)).sidebar.width).toBeGreaterThan(200);
  const { sidebar, win } = await geometry(page);
  expect(side(sidebar, win)).toBe('left');
  expect(await page.evaluate(() => localStorage.getItem('toolsSidebarDock'))).toBe('left');
});

test('Move on an open sidebar moves it across and keeps it open; the label then names the other side', async ({ page }) => {
  await openWith(page, 'left');
  await expect(page.locator('#sidebarMove')).toHaveAttribute('aria-label', sb.moveRight);
  await page.locator('#sidebarMove').click();
  await expect.poll(async () => side((await geometry(page)).sidebar, 1280)).toBe('right');
  await expect(page.locator('#sidebarMove')).toHaveAttribute('aria-label', sb.moveLeft);
  expect((await geometry(page)).sidebar.width).toBeGreaterThan(200);
});

test('Reset is dimmed at the default position and live anywhere else', async ({ page }) => {
  await openWith(page, 'left');
  await expect(page.locator('#sidebarReset')).toBeDisabled();
  await page.locator('#sidebarMove').click();
  await expect(page.locator('#sidebarReset')).toBeEnabled();
  await page.locator('#sidebarReset').click();
  await expect(page.locator('#sidebarReset')).toBeDisabled();
});

test('the page keeps clear of the handles, open or hidden', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  for (const visible of ['visible', 'hidden'] as const) {
    await page.addInitScript(([v]) => localStorage.setItem('toolsSidebarVisible', v!), [visible]);
    await page.goto('/split-pdf');
    await expect(page.locator('#sidebarToggle')).toBeVisible();
    const handles = (await page.locator('.tools-sidebar__handles').boundingBox())!;
    const heading = (await page.getByRole('heading', { level: 1 }).boundingBox())!;
    expect(heading.x, `h1 starts right of the handles (${visible})`).toBeGreaterThanOrEqual(handles.x + handles.width - 1);
  }
});
