/// <reference types="node" />
import { mkdir } from 'node:fs/promises';
import { test } from '@playwright/test';

/**
 * Captures the proof image on /security: the /verify page after the browser has refused a
 * request to another site. It is a picture of our own page, so it goes stale when /verify
 * changes; rerun `pnpm shots` then.
 *
 * Take it from the live site, so the address in the picture is leaflockpdf.com, not
 * localhost: `LEAFLOCK_SHOT_URL=https://leaflockpdf.com pnpm shots`. Without that variable it
 * serves the build in dist/.
 *
 * Why not the browser's own Network tab: developer tools are not part of the page, so
 * Playwright cannot photograph them. The honest substitute is the page that reads the same
 * browser record (Resource Timing) and shows the browser's own CSP verdict. Nothing in the
 * picture is edited; the page chrome and the offline panel are hidden before the capture.
 */
test('capture the verify proof image', async ({ page }) => {
  await mkdir('public/img', { recursive: true });
  await page.goto('/verify');
  await page.getByText('Show the full list').click();
  await page.getByRole('button', { name: 'Try to contact another site' }).click();
  await page.getByText('Blocked by your browser, not by us.').waitFor();

  await page.evaluate(() => {
    document.querySelectorAll('.verify__panel')[2]?.setAttribute('hidden', '');
    for (const element of document.querySelectorAll<HTMLElement>('body *')) {
      if (getComputedStyle(element).position === 'fixed' || getComputedStyle(element).position === 'sticky') element.hidden = true;
    }
  });
  await page.locator('.verify').screenshot({ path: 'public/img/verify-proof.png' });
});
