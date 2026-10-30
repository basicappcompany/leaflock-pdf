import { describe, expect, it } from 'vitest';
import { isKind } from '../../src/components/ui/FilePicker';

/** Windows has no built-in HEIC codec, so a .heic file commonly reports no MIME type
 * at all there — unlike a browser that recognises the type but can't decode it, which
 * still reports `image/heic` and is already covered by the MIME check. */
function heicFileWithNoMimeType(name: string): File {
  return new File([], name, { type: '' });
}

describe('isKind', () => {
  it('accepts an image whose MIME type the browser recognises', () => {
    expect(isKind(new File([], 'photo.jpg', { type: 'image/jpeg' }), 'image')).toBe(true);
  });

  it('accepts .heic/.heif by extension even with no MIME type', () => {
    expect(isKind(heicFileWithNoMimeType('photo.heic'), 'image')).toBe(true);
    expect(isKind(heicFileWithNoMimeType('photo.HEIC'), 'image')).toBe(true);
    expect(isKind(heicFileWithNoMimeType('photo.heif'), 'image')).toBe(true);
  });

  it('does not accept an unrelated file just because it also has no MIME type', () => {
    expect(isKind(heicFileWithNoMimeType('notes.txt'), 'image')).toBe(false);
  });

  it('is unaffected for the pdf kind', () => {
    expect(isKind(new File([], 'doc.pdf', { type: 'application/pdf' }), 'pdf')).toBe(true);
    expect(isKind(new File([], 'photo.heic', { type: '' }), 'pdf')).toBe(false);
  });
});
