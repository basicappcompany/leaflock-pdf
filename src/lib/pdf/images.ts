import { PDFArray, PDFDict, PDFName, PDFNumber, PDFRawStream, PDFRef, type PDFDocument, type PDFObject } from '@cantoo/pdf-lib';

const name = (value: string) => PDFName.of(value);

/** Shared by every op that walks a PDF's image XObjects: `compress.ts` (to shrink them)
 * and `extractImages.ts` (to pull them out) scan the same objects the same way. */

/** Image XObjects a page actually shows: not soft masks or stencil masks themselves,
 * which are alpha/stencil data rather than content someone would want as a photo. */
export function imageStreams(doc: PDFDocument): PDFRawStream[] {
  const masks = new Set<string>();
  const images: [PDFRef, PDFRawStream][] = [];
  for (const [ref, object] of doc.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream)) continue;
    const dict = object.dict;
    if (dict.get(name('Subtype')) !== name('Image')) continue;
    for (const key of ['SMask', 'Mask']) {
      const mask = dict.get(name(key));
      if (mask instanceof PDFRef) masks.add(mask.toString());
    }
    images.push([ref, object]);
  }
  return images
    .filter(([ref, stream]) => !masks.has(ref.toString()) && stream.dict.get(name('ImageMask'))?.toString() !== 'true')
    .map(([, stream]) => stream);
}

/** Number of colour components for colour spaces this product knows how to decode to
 * plain pixels, else `undefined` — Indexed, DeviceCMYK and Separation are not among them. */
export function components(doc: PDFDocument, colorSpace: PDFObject | undefined): 1 | 3 | undefined {
  const resolved = doc.context.lookup(colorSpace);
  if (resolved === name('DeviceRGB')) return 3;
  if (resolved === name('DeviceGray')) return 1;
  if (resolved instanceof PDFArray && resolved.get(0) === name('ICCBased')) {
    const profile = doc.context.lookup(resolved.get(1));
    const n = profile instanceof PDFRawStream ? profile.dict.get(name('N')) : undefined;
    if (n instanceof PDFNumber && (n.asNumber() === 1 || n.asNumber() === 3)) return n.asNumber() as 1 | 3;
  }
  return undefined;
}

/** The stream's `/Filter`, when it names exactly one (a multi-filter chain is left
 * alone — rare in practice, and not worth guessing the decode order for). */
export function singleFilter(dict: PDFDict): string | undefined {
  const filter = dict.get(name('Filter'));
  if (filter instanceof PDFName) return filter.decodeText();
  if (filter instanceof PDFArray && filter.size() === 1) {
    const only = filter.get(0);
    return only instanceof PDFName ? only.decodeText() : undefined;
  }
  return undefined;
}

export function numberOf(dict: PDFDict, key: string): number | undefined {
  const value = dict.get(name(key));
  return value instanceof PDFNumber ? value.asNumber() : undefined;
}

/** Lays out raw, unfiltered Gray/RGB samples as an opaque canvas. */
export function toCanvas(pixels: Uint8Array, width: number, height: number, comps: 1 | 3): OffscreenCanvas {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, j = 0; i < width * height; i++, j += comps) {
    rgba[i * 4] = pixels[j]!;
    rgba[i * 4 + 1] = pixels[comps === 3 ? j + 1 : j]!;
    rgba[i * 4 + 2] = pixels[comps === 3 ? j + 2 : j]!;
    rgba[i * 4 + 3] = 255;
  }
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext('2d')!.putImageData(new ImageData(rgba, width, height), 0, 0);
  return canvas;
}
