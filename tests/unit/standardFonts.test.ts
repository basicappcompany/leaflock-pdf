import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';

/**
 * Guards `integrations/standard-fonts.mjs`, which keeps only the four Helvetica weights'
 * metrics in the bundle and stubs the other ten standard fonts.
 *
 * These tests run against the *unbundled* library, so they do not prove the stubbing
 * happened (that is `performance.spec.ts`'s per-chunk ceiling plus the build-output check
 * in `tests/e2e/seo.spec.ts`-adjacent tooling). What they pin is the thing the stubbing
 * depends on: that the product never embeds a standard font outside `KEPT`. If a tool
 * starts embedding another one, this fails and points at the `KEPT` list to update,
 * rather than shipping a font whose metrics were dropped.
 */
describe('standard fonts', () => {
  it('embeds every Helvetica weight the product uses', async () => {
    const doc = await PDFDocument.create();
    for (const weight of [
      StandardFonts.Helvetica,
      StandardFonts.HelveticaBold,
      StandardFonts.HelveticaOblique,
      StandardFonts.HelveticaBoldOblique,
    ]) {
      const font = await doc.embedFont(weight);
      expect(font.widthOfTextAtSize('LeafLock', 12)).toBeGreaterThan(0);
    }
  });

  it('names only the kept Helvetica weights as standard fonts used anywhere in src', async () => {
    // Deliberately a source check rather than a behavioural one: the stubbing is a build
    // step, so the thing that can silently invalidate it is new source code, not runtime.
    const { readdir, readFile } = await import('node:fs/promises');
    const { join } = await import('node:path');

    async function sourceFiles(dir: string): Promise<string[]> {
      const entries = await readdir(dir, { withFileTypes: true });
      const found: string[] = [];
      for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) found.push(...(await sourceFiles(full)));
        else if (/\.(ts|tsx|astro)$/.test(entry.name)) found.push(full);
      }
      return found;
    }

    const used = new Set<string>();
    for (const file of await sourceFiles('src')) {
      const text = await readFile(file, 'utf8');
      for (const [, name] of text.matchAll(/StandardFonts\.([A-Za-z]+)/g)) used.add(name!);
    }

    expect([...used].sort()).toEqual(['Helvetica', 'HelveticaBold', 'HelveticaBoldOblique', 'HelveticaOblique']);
  });
});
