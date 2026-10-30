import { zlibSync } from 'fflate';

/** A real, decodable RGB PNG filled with one colour. */
export function makePng(width: number, height: number, rgb: [number, number, number] = [200, 60, 60]): Uint8Array {
  const row = new Uint8Array(1 + width * 3);
  for (let x = 0; x < width; x++) row.set(rgb, 1 + x * 3);
  const raw = new Uint8Array(row.length * height);
  for (let y = 0; y < height; y++) raw.set(row, y * row.length);

  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit RGB, no interlace

  return concat([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlibSync(raw)),
    chunk('IEND', new Uint8Array()),
  ]);
}

/**
 * The header of a baseline JPEG with the given size and optional EXIF orientation.
 * pdf-lib only reads the header to embed a JPEG, so this is enough for layout tests
 * (and keeps a 40 000-pixel image tiny). It is not decodable by a browser.
 */
export function makeJpeg(width: number, height: number, orientation?: number): Uint8Array {
  const parts: Uint8Array[] = [new Uint8Array([0xff, 0xd8])];
  if (orientation) {
    // "Exif\0\0" + little-endian TIFF header + one IFD entry (0x0112, SHORT, 1, value).
    const tiff = new Uint8Array(8 + 2 + 12 + 4);
    const view = new DataView(tiff.buffer);
    tiff.set([0x49, 0x49, 0x2a, 0x00]);
    view.setUint32(4, 8, true);
    view.setUint16(8, 1, true);
    view.setUint16(10, 0x0112, true);
    view.setUint16(12, 3, true);
    view.setUint32(14, 1, true);
    view.setUint16(18, orientation, true);
    const body = concat([new Uint8Array([0x45, 0x78, 0x69, 0x66, 0, 0]), tiff]);
    parts.push(segment(0xe1, body));
  }
  const sof = new Uint8Array(15);
  const view = new DataView(sof.buffer);
  sof[0] = 8; // bits per sample
  view.setUint16(1, height);
  view.setUint16(3, width);
  sof[5] = 3; // components
  sof.set([1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1], 6);
  parts.push(segment(0xc0, sof), new Uint8Array([0xff, 0xd9]));
  return concat(parts);
}

function segment(marker: number, body: Uint8Array): Uint8Array {
  const head = new Uint8Array(4);
  head[0] = 0xff;
  head[1] = marker;
  new DataView(head.buffer).setUint16(2, body.length + 2);
  return concat([head, body]);
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
