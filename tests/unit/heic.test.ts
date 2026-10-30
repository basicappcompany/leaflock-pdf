import { describe, expect, it } from 'vitest';
import { isHeic } from '../../src/lib/convert/heic';

/** An ISO base-media header: 4 size bytes, "ftyp", then the brand. */
function ftyp(brand: string): Uint8Array {
  const bytes = new Uint8Array(16);
  bytes.set(new TextEncoder().encode('ftyp'), 4);
  bytes.set(new TextEncoder().encode(brand), 8);
  return bytes;
}

describe('isHeic', () => {
  it('recognises the brands a phone camera actually writes', () => {
    for (const brand of ['heic', 'heix', 'mif1', 'msf1', 'heif']) {
      expect(isHeic(ftyp(brand)), brand).toBe(true);
    }
  });

  it('rejects other ISO base-media files that share the ftyp header', () => {
    // An MP4 is the same container family, so the brand is what separates them — the
    // reason this checks the brand rather than just "ftyp".
    expect(isHeic(ftyp('isom'))).toBe(false);
    expect(isHeic(ftyp('mp42'))).toBe(false);
    expect(isHeic(ftyp('avif'))).toBe(false);
  });

  it('rejects ordinary image formats', () => {
    expect(isHeic(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(false);
    expect(isHeic(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(false);
  });

  it('rejects a file too short to carry a brand, without throwing', () => {
    expect(isHeic(new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70]))).toBe(false);
    expect(isHeic(new Uint8Array())).toBe(false);
  });

  it('accepts the real fixture the browser test decodes', async () => {
    const { readFile } = await import('node:fs/promises');
    const bytes = new Uint8Array(await readFile(new URL('../fixtures/sample.heic', import.meta.url)));
    expect(isHeic(bytes)).toBe(true);
  });
});
