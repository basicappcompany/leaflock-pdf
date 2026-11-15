/// <reference types="node" />
import { expect, test, type Page } from './fixtures';
import { makePdf } from '../fixtures/pdfs';
import { download, pdfUpload, watchPage } from './helpers';

/**
 * The device-local shelf (roadmap 2.11).
 *
 * The expiry arithmetic is unit-tested in `tests/unit/retentionDurations.test.ts`; what
 * can only be checked in a real browser is the half that was chosen for platform reasons —
 * that IndexedDB keeps the bytes across a reload, that the sweep on read actually deletes
 * an expired row, and that none of it causes a request to leave the device.
 */

/** Produces one result on the merge tool, leaving the page on the result panel. */
async function produceResult(page: Page) {
  const first = await makePdf([[200, 300]]);
  const second = await makePdf([[400, 500]]);
  await page.goto('/merge-pdf');
  await page.locator('input[type="file"]').setInputFiles([
    pdfUpload('first.pdf', first),
    pdfUpload('second.pdf', second),
  ]);
  await page.getByRole('button', { name: 'Merge PDFs' }).click();
  await expect(page.getByRole('link', { name: 'Download', exact: true })).toBeVisible();
}

/** Rows currently in the shelf store, read straight out of IndexedDB. */
function readStore(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ name: string; expiresAt: number; bytes: number }[]>((resolve) => {
        const open = indexedDB.open('leaflock-shelf', 1);
        open.onsuccess = () => {
          const db = open.result;
          const request = db.transaction('files', 'readonly').objectStore('files').getAll();
          request.onsuccess = () => {
            resolve(
              (request.result as { name: string; expiresAt: number; blob: Blob }[]).map((row) => ({
                name: row.name,
                expiresAt: row.expiresAt,
                bytes: row.blob.size,
              })),
            );
            db.close();
          };
          request.onerror = () => resolve([]);
        };
        open.onerror = () => resolve([]);
      }),
  );
}

test('keeps nothing unless asked, then holds it across a reload', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await produceResult(page);

  // Off is the default, and the result panel says what keeping would mean.
  await expect(page.getByRole('radio', { name: 'Don’t keep' })).toBeChecked();
  // The tool page's own copy also says "never uploaded", so target the picker's note.
  await expect(page.getByText('Stays in this browser, never uploaded', { exact: false })).toBeVisible();
  expect(await readStore(page)).toEqual([]);

  await page.getByRole('radio', { name: '5 minutes' }).check();
  await expect(page.getByText('Kept for 5 minutes.')).toBeVisible();

  const stored = await readStore(page);
  expect(stored).toHaveLength(1);
  expect(stored[0]!.name).toBe('merged.pdf');
  expect(stored[0]!.bytes).toBeGreaterThan(0);

  // The point of the feature: it is still there on a fresh load of the page.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Still on this device' })).toBeVisible();
  // Not an exact figure: the label rounds down, so by the time the page reloads a
  // five-minute keep honestly reads as four. Asserting "5" would fail on a slow machine
  // and pass on a fast one, which is the definition of a flaky test.
  await expect(page.getByText(/about \d+ minutes? left/)).toBeVisible();

  const kept = await download(page, () => page.getByRole('button', { name: 'Download merged.pdf' }).click());
  expect(kept.file.suggestedFilename()).toBe('merged.pdf');
  expect(kept.bytes.subarray(0, 5).toString()).toBe('%PDF-');

  watch.assertClean();
});

test('sweeps an expired file on the next read rather than showing it', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await produceResult(page);
  await page.getByRole('radio', { name: '1 hour' }).check();
  await expect(page.getByText('Kept for 1 hour.')).toBeVisible();
  // Proves the row existed before it was backdated, so the empty store at the end can
  // only be the sweep's work and not a file that was never written.
  expect(await readStore(page)).toHaveLength(1);

  // Backdate the expiry instead of waiting an hour. There is no timer in a closed tab, so
  // "expired" has to mean "deleted the next time anything looks" — this is that claim.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('leaflock-shelf', 1);
        open.onerror = () => reject(new Error('could not open the shelf'));
        open.onsuccess = () => {
          const db = open.result;
          const transaction = db.transaction('files', 'readwrite');
          const store = transaction.objectStore('files');
          const all = store.getAll();
          all.onsuccess = () => {
            for (const row of all.result as { expiresAt: number }[]) {
              store.put({ ...row, expiresAt: Date.now() - 1 });
            }
          };
          // Resolve on the transaction, not on the puts: a reload that races an
          // uncommitted write would make this test pass or fail on timing alone.
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onabort = () => reject(new Error('backdating was aborted'));
        };
      }),
  );

  await page.reload();
  // Polled, not read once: the sweep runs when the shelf component first reads, so a
  // single read can land before it finishes and fail on load speed alone. This was the
  // actual cause of this test passing alone and failing in a parallel batch.
  await expect.poll(() => readStore(page), { message: 'the sweep should have deleted it' }).toEqual([]);
  // Checked after the store is known empty, so this cannot pass merely because the
  // component had not mounted yet.
  await expect(page.getByRole('heading', { name: 'Still on this device' })).toHaveCount(0);

  watch.assertClean();
});

test('removing a kept file takes the shelf away with it', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await produceResult(page);
  await page.getByRole('radio', { name: '24 hours' }).check();
  await expect(page.getByText('Kept for 24 hours.')).toBeVisible();

  await page.reload();
  // "1 day" only at the exact boundary: a moment after keeping, 24 hours has floored to
  // 23 hours, and the label deliberately rounds down so it never promises time that has
  // already gone. Either reading is correct, so accept both rather than race the clock.
  await expect(page.getByText(/about (1 day|23 hours) left/)).toBeVisible();

  await page.getByRole('button', { name: 'Remove merged.pdf' }).click();
  await expect(page.getByRole('heading', { name: 'Still on this device' })).toHaveCount(0);
  expect(await readStore(page)).toEqual([]);

  watch.assertClean();
});

test('offers custom lengths to Pro only', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await produceResult(page);

  // Signed out, so the control is visible but unavailable, and says why rather than
  // disappearing — a missing option reads as a missing feature.
  const custom = page.getByRole('radio', { name: 'Custom', exact: false });
  await expect(custom).toBeDisabled();
  await expect(page.getByText('Custom lengths are part of Pro.')).toBeVisible();

  watch.assertClean();
});

test('a new result is a fresh decision, not the previous answer', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await produceResult(page);
  await page.getByRole('radio', { name: '5 minutes' }).check();
  await expect(page.getByText('Kept for 5 minutes.')).toBeVisible();

  // Run the tool again: keeping must not carry over, or a later file is kept because of a
  // decision made about an earlier one.
  await page.getByRole('button', { name: 'Start over' }).click();
  await produceResult(page);
  await expect(page.getByRole('radio', { name: 'Don’t keep' })).toBeChecked();
  await expect(page.getByText('Kept for 5 minutes.')).toHaveCount(0);

  // The first file is still kept — the reset is about the choice, not about deleting.
  expect(await readStore(page)).toHaveLength(1);

  watch.assertClean();
});
