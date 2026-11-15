import { devices, expect, test, type Page } from './fixtures';
import { en } from '../../src/i18n/en';
import { watchPage } from './helpers';

/**
 * The two buttons at the bottom of the sidebar, "Request a feature" and "Send feedback", and the
 * dialog they open. `astro preview` serves none of the Cloudflare Functions, so /api/feedback is
 * stubbed; the endpoint itself is covered by tests/unit/server/feedback.test.ts. What matters
 * here is what the browser sends, what it shows, and that nothing else leaves the page.
 */

const f = en.common.feedback;
const MESSAGE = 'Please let me reorder pages with the keyboard, it would save a lot of time.';

type Sent = { kind: string; message: string; email: string; page: string; website: string };

async function capture(page: Page, status = 204) {
  const sent: Sent[] = [];
  await page.route('**/api/feedback', async (route) => {
    sent.push(route.request().postDataJSON() as Sent);
    await route.fulfill({ status });
  });
  return sent;
}

test.describe('on a desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the sidebar ends with the two buttons, and the page links that were there are gone', async ({ page, baseURL }) => {
    const watch = watchPage(page, baseURL!);
    await page.goto('/split-pdf');
    const sidebar = page.locator('#toolsSidebar');
    await expect(sidebar.getByRole('button', { name: f.requestButton })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: f.feedbackButton })).toBeVisible();
    // About, Business, Help and Contact are in the site footer; they are not repeated here.
    for (const name of [en.common.pageLinks.about, en.common.pageLinks.business, en.common.pageLinks.help, en.common.pageLinks.contact]) {
      await expect(sidebar.getByRole('link', { name })).toHaveCount(0);
    }
    // They sit at the bottom: below the tool list, in the last part of the sidebar.
    const box = (await sidebar.boundingBox())!;
    const request = (await page.locator('#sidebarRequest').boundingBox())!;
    const feedback = (await page.locator('#sidebarFeedback').boundingBox())!;
    expect(request.y).toBeGreaterThan(box.y + box.height * 0.7);
    expect(feedback.y).toBeGreaterThan(request.y);
    // The site footer still has the links.
    await expect(page.locator('.site-footer').getByRole('link', { name: en.common.pageLinks.contact }).first()).toBeVisible();
    watch.assertClean();
  });

  test('a feature request opens a focused dialog, and Escape closes it and returns focus to the button', async ({ page }) => {
    await page.goto('/split-pdf');
    await page.locator('#sidebarRequest').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: f.requestTitle })).toBeVisible();
    await expect(dialog.getByLabel(f.requestPrompt)).toBeFocused();
    await expect(dialog.getByLabel(f.emailLabel)).toBeVisible();
    // Said above the Send button, because it is the one thing here that leaves the device.
    await expect(dialog).toContainText(f.privacy);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('#sidebarRequest')).toBeFocused();
  });

  test('general feedback has its own title and question', async ({ page }) => {
    await page.goto('/split-pdf');
    await page.locator('#sidebarFeedback').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: f.feedbackTitle })).toBeVisible();
    await expect(dialog.getByLabel(f.feedbackPrompt)).toBeFocused();
  });

  test('a message that is too short is not sent', async ({ page }) => {
    const sent = await capture(page);
    await page.goto('/split-pdf');
    await page.locator('#sidebarRequest').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(f.requestPrompt).fill('short');
    await dialog.getByRole('button', { name: f.send }).click();
    await expect(dialog.getByRole('status')).toHaveText(f.tooShort.replace('{min}', '10'));
    await expect(dialog.getByLabel(f.requestPrompt)).toHaveAttribute('aria-invalid', 'true');
    await expect(dialog.getByLabel(f.requestPrompt)).toBeFocused();
    expect(sent).toEqual([]);
  });

  test('a request is sent with only what was typed and the page path, then thanks, then Close', async ({ page, baseURL }) => {
    const watch = watchPage(page, baseURL!);
    const sent = await capture(page);
    await page.goto('/split-pdf');
    await page.locator('#sidebarRequest').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(f.requestPrompt).fill(`  ${MESSAGE}  `);
    await dialog.getByLabel(f.emailLabel).fill('person@example.com');
    await dialog.getByRole('button', { name: f.send }).click();

    await expect(dialog.getByRole('status')).toHaveText(f.thanks);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toEqual({ kind: 'feature', message: MESSAGE, email: 'person@example.com', page: '/split-pdf', website: '' });
    // Exactly these fields: nothing about a file, a cookie, or the browser.
    expect(Object.keys(sent[0]!).sort()).toEqual(['email', 'kind', 'message', 'page', 'website']);

    // The form is now a Close button, so a second press cannot send it twice.
    await expect(dialog.getByRole('button', { name: f.cancel })).toBeHidden();
    await dialog.getByRole('button', { name: f.close }).click();
    await expect(dialog).toBeHidden();
    expect(sent).toHaveLength(1);

    // Opening it again gives a fresh form.
    await page.locator('#sidebarFeedback').click();
    await expect(page.getByRole('dialog').getByLabel(f.feedbackPrompt)).toHaveValue('');
    watch.assertClean();
  });

  test('the email is optional', async ({ page }) => {
    const sent = await capture(page);
    await page.goto('/merge-pdf');
    await page.locator('#sidebarFeedback').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(f.feedbackPrompt).fill(MESSAGE);
    await dialog.getByRole('button', { name: f.send }).click();
    await expect(dialog.getByRole('status')).toHaveText(f.thanks);
    expect(sent[0]).toMatchObject({ kind: 'feedback', email: '', page: '/merge-pdf' });
  });

  test('if sending fails, the contact address is shown and the form can be sent again', async ({ page }) => {
    let fail = true;
    const sent: Sent[] = [];
    await page.route('**/api/feedback', async (route) => {
      sent.push(route.request().postDataJSON() as Sent);
      await route.fulfill({ status: fail ? 503 : 204 });
    });
    await page.goto('/split-pdf');
    await page.locator('#sidebarRequest').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(f.requestPrompt).fill(MESSAGE);
    await dialog.getByRole('button', { name: f.send }).click();
    await expect(dialog.getByRole('status')).toHaveText(f.error.replace('{email}', 'hello@leaflockpdf.com'));
    // Nothing was lost: the text is still there and the button works again.
    await expect(dialog.getByLabel(f.requestPrompt)).toHaveValue(MESSAGE);
    await expect(dialog.getByRole('button', { name: f.send })).toBeEnabled();

    fail = false;
    await dialog.getByRole('button', { name: f.send }).click();
    await expect(dialog.getByRole('status')).toHaveText(f.thanks);
    expect(sent).toHaveLength(2);
  });

  test('a network failure is handled the same way', async ({ page }) => {
    await page.route('**/api/feedback', (route) => route.abort());
    await page.goto('/split-pdf');
    await page.locator('#sidebarRequest').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(f.requestPrompt).fill(MESSAGE);
    await dialog.getByRole('button', { name: f.send }).click();
    await expect(dialog.getByRole('status')).toContainText('hello@leaflockpdf.com');
  });

  test('the hidden trap field cannot be reached by a person', async ({ page }) => {
    await page.goto('/split-pdf');
    await page.locator('#sidebarRequest').click();
    const trap = page.locator('.feedback__hp');
    await expect(trap).toHaveAttribute('tabindex', '-1');
    await expect(trap).toHaveAttribute('aria-hidden', 'true');
    expect((await trap.boundingBox())!.x).toBeLessThan(0);
    // Tabbing through the form never lands on it.
    const dialog = page.getByRole('dialog');
    const visited: string[] = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      visited.push(await page.evaluate(() => (document.activeElement as HTMLElement | null)?.className ?? ''));
    }
    expect(visited.join('|')).not.toContain('feedback__hp');
    await expect(dialog).toBeVisible();
  });

  test('works from a page without the tool app too, such as a category hub', async ({ page }) => {
    const sent = await capture(page);
    await page.goto('/tools/organize');
    await page.locator('#sidebarRequest').click();
    await page.getByRole('dialog').getByLabel(f.requestPrompt).fill(MESSAGE);
    await page.getByRole('dialog').getByRole('button', { name: f.send }).click();
    await expect(page.getByRole('dialog').getByRole('status')).toHaveText(f.thanks);
    expect(sent[0]?.page).toBe('/tools/organize');
  });
});

test.describe('on a phone', () => {
  const { defaultBrowserType: _ignore, ...phone } = devices['iPhone 13'];
  test.use({ ...phone });

  test('open the drawer, tap a button, and the dialog fits the screen with comfortable buttons', async ({ page }) => {
    const sent = await capture(page);
    await page.goto('/split-pdf');
    await page.locator('#sidebarToggle').tap();
    await expect(page.locator('#toolsSidebar')).toBeVisible();
    const button = page.locator('#sidebarRequest');
    await button.scrollIntoViewIfNeeded();
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(40);
    await button.tap();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const viewport = page.viewportSize()!;
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    for (const name of [f.cancel, f.send]) {
      expect((await dialog.getByRole('button', { name }).boundingBox())!.height, name).toBeGreaterThanOrEqual(40);
    }

    await dialog.getByLabel(f.requestPrompt).fill(MESSAGE);
    await dialog.getByRole('button', { name: f.send }).tap();
    await expect(dialog.getByRole('status')).toHaveText(f.thanks);
    expect(sent).toHaveLength(1);
  });
});
