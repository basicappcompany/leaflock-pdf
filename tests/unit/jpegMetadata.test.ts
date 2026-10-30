import { describe, expect, it } from 'vitest';
import { stripJpegMetadata } from '../../src/lib/pdf/jpegMetadata';

/** A marker segment: FF <marker> <2-byte length> <payload>. */
function segment(marker: number, payload: string): number[] {
  const bytes = [...new TextEncoder().encode(payload)];
  const length = bytes.length + 2;
  return [0xff, marker, length >> 8, length & 0xff, ...bytes];
}

const soi = [0xff, 0xd8];
const scan = [0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0x10, 0x20, 0x30, 0xff, 0x00, 0x40, 0xff, 0xd9];

function jpeg(...segments: number[][]): Uint8Array {
  return new Uint8Array([...soi, ...segments.flat(), ...scan]);
}

function text(bytes: Uint8Array): string {
  return new TextDecoder('latin1').decode(bytes);
}

describe('stripJpegMetadata', () => {
  it('removes EXIF, XMP, IPTC and comments but keeps JFIF, colour data and the image', () => {
    const input = jpeg(
      segment(0xe0, 'JFIF\0'),
      segment(0xe1, 'Exif\0\0GPSLatitude=51.5'),
      segment(0xe1, 'http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>Author</x:xmpmeta>'),
      segment(0xed, 'Photoshop 3.0\0IPTC caption'),
      segment(0xfe, 'shot on my phone'),
      segment(0xe2, 'ICC_PROFILE\0profile'),
      segment(0xee, 'Adobe'),
      segment(0xdb, 'quantisation table'),
    );

    const output = text(stripJpegMetadata(input));

    for (const gone of ['Exif', 'GPSLatitude', 'xmpmeta', 'IPTC', 'shot on my phone']) {
      expect(output).not.toContain(gone);
    }
    for (const kept of ['JFIF', 'ICC_PROFILE', 'Adobe', 'quantisation table']) {
      expect(output).toContain(kept);
    }
    // Everything from the start of scan onwards is byte-for-byte the same.
    expect(output.endsWith(text(new Uint8Array(scan)))).toBe(true);
    expect(output.startsWith(text(new Uint8Array(soi)))).toBe(true);
  });

  it('returns a JPEG without metadata unchanged', () => {
    const input = jpeg(segment(0xe0, 'JFIF\0'), segment(0xdb, 'table'));
    expect(stripJpegMetadata(input)).toEqual(input);
  });

  it('leaves data it cannot parse alone', () => {
    const notJpeg = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    expect(stripJpegMetadata(notJpeg)).toBe(notJpeg);
    const truncated = new Uint8Array([...soi, 0xff, 0xe1, 0x10, 0x00, 0x01]);
    expect(stripJpegMetadata(truncated)).toBe(truncated);
  });
});
