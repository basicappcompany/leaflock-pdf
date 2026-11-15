import { expect, test } from './fixtures';

test('a crash sends one scrubbed report to our own server', async ({ page, baseURL }) => {
  const reports: unknown[] = [];
  // `astro preview` has no Functions; answer like the real endpoint does.
  await page.route('**/api/errors', async (route) => {
    reports.push(JSON.parse(route.request().postData() ?? 'null'));
    await route.fulfill({ status: 204 });
  });
  const offsite: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith(baseURL!) && !request.url().startsWith('blob:')) offsite.push(request.url());
  });

  await page.goto('/merge-pdf');
  await expect(page.getByRole('button', { name: 'Merge PDFs' })).toBeVisible();
  await page.evaluate(() => {
    const error = new TypeError('Failed while reading Salary slip March.pdf for "Asha Rao"');
    window.dispatchEvent(new ErrorEvent('error', { error, message: error.message }));
    // The same bug twice is reported once.
    window.dispatchEvent(new ErrorEvent('error', { error, message: error.message }));
  });

  await expect.poll(() => reports.length).toBe(1);
  const report = reports[0] as Record<string, unknown>;
  expect(report).toMatchObject({ v: 1, kind: 'error', tool: 'merge', name: 'TypeError', page: expect.stringMatching(/^\/merge-pdf\/?$/) });
  const serialized = JSON.stringify(report);
  expect(serialized).not.toMatch(/Salary|March|Asha/);
  expect(offsite).toEqual([]);
});
