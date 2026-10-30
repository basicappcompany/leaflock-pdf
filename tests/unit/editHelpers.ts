/// <reference types="node" />
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { zlibSync } from 'fflate';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;

export interface TextItemAt {
  text: string;
  /** Position in viewport coordinates (top-left origin, as displayed, scale 1). */
  x: number;
  y: number;
}

/** Text of each page, plus where each piece sits as a reader sees the page. */
export async function readPages(bytes: Uint8Array): Promise<{ text: string; items: TextItemAt[]; width: number; height: number }[]> {
  const doc = await getDocument({ data: bytes.slice(), useSystemFonts: false, disableFontFace: true }).promise;
  const pages = [];
  for (let number = 1; number <= doc.numPages; number++) {
    const page = await doc.getPage(number);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items: TextItemAt[] = [];
    for (const item of content.items) {
      if (!('str' in item) || item.str.trim() === '') continue;
      const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
      items.push({ text: item.str, x, y });
    }
    pages.push({ text: items.map((item) => item.text).join(' '), items, width: viewport.width, height: viewport.height });
  }
  await doc.loadingTask.destroy();
  return pages;
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

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(new TextEncoder().encode(type), 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** A solid-colour RGBA PNG, for tests that need an image without a canvas. */
export function makePng(width: number, height: number, rgba: [number, number, number, number]): Uint8Array {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 6, 0, 0, 0], 8);
  const raw = new Uint8Array(height * (1 + width * 4));
  for (let row = 0; row < height; row++) {
    const offset = row * (1 + width * 4);
    for (let col = 0; col < width; col++) raw.set(rgba, offset + 1 + col * 4);
  }
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlibSync(raw)),
    chunk('IEND', new Uint8Array()),
  ];
  const png = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of parts) {
    png.set(part, at);
    at += part.length;
  }
  return png;
}

export const pdf = (name: string, bytes: Uint8Array) => ({ name, bytes });
