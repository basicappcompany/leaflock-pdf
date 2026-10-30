import { unzlibSync } from 'fflate';
import { PDFDict, PDFName, PDFNumber, type PDFDocument, type PDFRawStream } from '@cantoo/pdf-lib';
import { components, imageStreams, numberOf, singleFilter, toCanvas } from '../images';
import { pruneUnreachableObjects } from '../../secure/prune';
import { loadPdf, type PdfInput } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export type CompressLevel = 'light' | 'recommended' | 'strong';

/** Longest image side in pixels, and JPEG quality, per level. */
export const compressSettings: Record<CompressLevel, { maxSide: number; quality: number }> = {
  light: { maxSide: 2400, quality: 0.82 },
  recommended: { maxSide: 1600, quality: 0.7 },
  strong: { maxSide: 1000, quality: 0.5 },
};

export interface CompressArgs {
  input: PdfInput;
  level: CompressLevel;
  outputName: string;
}

export interface CompressResult {
  file: OutputFile;
  before: number;
  after: number;
  /** Images that were made smaller. */
  images: number;
  /** True when nothing could be saved; `file` is then the original. */
  unchanged: boolean;
}

const name = (value: string) => PDFName.of(value);

/**
 * Makes a PDF smaller: re-encodes large or heavy images as JPEG (in the worker, with
 * OffscreenCanvas), drops embedded thumbnails and editor data, removes unused objects
 * and writes compact object streams.
 */
export async function compress({ input, level, outputName }: CompressArgs, ctx: OpContext): Promise<CompressResult> {
  const doc = await loadPdf(input);
  const before = input.bytes.byteLength;

  let images = 0;
  if (canRecodeImages()) {
    const candidates = imageStreams(doc);
    for (const [index, stream] of candidates.entries()) {
      try {
        if (await recompressImage(doc, stream, compressSettings[level])) images++;
      } catch {
        // An image we can't decode stays exactly as it was.
      }
      ctx.progress((index + 1) / (candidates.length + 1));
    }
  }

  removeExtras(doc);
  pruneUnreachableObjects(doc);
  const bytes = await doc.save({ useObjectStreams: true, rewrite: true });
  ctx.progress(1);

  if (bytes.byteLength >= before) {
    return { file: pdfFile(outputName, input.bytes.slice()), before, after: before, images: 0, unchanged: true };
  }
  return { file: pdfFile(outputName, bytes), before, after: bytes.byteLength, images, unchanged: false };
}

function canRecodeImages(): boolean {
  return typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function';
}

async function recompressImage(
  doc: PDFDocument,
  stream: PDFRawStream,
  settings: { maxSide: number; quality: number },
): Promise<boolean> {
  const dict = stream.dict;
  const width = numberOf(dict, 'Width');
  const height = numberOf(dict, 'Height');
  const comps = components(doc, dict.get(name('ColorSpace')));
  const filter = singleFilter(dict);
  if (!width || !height || !comps || numberOf(dict, 'BitsPerComponent') !== 8) return false;
  // Decode arrays and colour-key masks depend on exact pixel values, which JPEG doesn't keep.
  if (dict.has(name('Decode')) || dict.has(name('Mask'))) return false;

  let source: CanvasImageSource;
  let minimumSaving: number;
  if (filter === 'DCTDecode') {
    source = await createImageBitmap(new Blob([stream.contents as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' }), {
      // PDF ignores EXIF rotation; the stored pixels are what the page shows.
      imageOrientation: 'none',
    });
    minimumSaving = 0.1;
  } else if (filter === 'FlateDecode') {
    const params = doc.context.lookup(dict.get(name('DecodeParms')));
    if (params instanceof PDFDict && (numberOf(params, 'Predictor') ?? 1) > 1) return false;
    const pixels = unzlibSync(stream.contents);
    if (pixels.length !== width * height * comps) return false;
    source = toCanvas(pixels, width, height, comps);
    // Lossless images are often line art or text, where JPEG artefacts show. Only convert
    // when the saving is large, which in practice means photos.
    minimumSaving = 0.5;
  } else {
    return false;
  }

  const scale = Math.min(1, settings.maxSide / Math.max(width, height));
  const newWidth = Math.max(1, Math.round(width * scale));
  const newHeight = Math.max(1, Math.round(height * scale));
  const canvas = new OffscreenCanvas(newWidth, newHeight);
  const context = canvas.getContext('2d')!;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, newWidth, newHeight);
  if ('close' in source) source.close();

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: settings.quality });
  const jpeg = new Uint8Array(await blob.arrayBuffer());
  if (jpeg.byteLength > stream.contents.byteLength * (1 - minimumSaving)) return false;

  stream.updateContents(jpeg);
  dict.set(name('Width'), PDFNumber.of(newWidth));
  dict.set(name('Height'), PDFNumber.of(newHeight));
  dict.set(name('Filter'), name('DCTDecode'));
  dict.set(name('BitsPerComponent'), PDFNumber.of(8));
  // The canvas always writes RGB JPEGs; ICC-based RGB keeps its profile.
  if (comps === 1) dict.set(name('ColorSpace'), name('DeviceRGB'));
  dict.delete(name('DecodeParms'));
  return true;
}

/** Drops data viewers don't need: page thumbnails and editor-private data. */
function removeExtras(doc: PDFDocument) {
  for (const page of doc.getPages()) {
    page.node.delete(name('Thumb'));
    page.node.delete(name('PieceInfo'));
  }
  doc.catalog.delete(name('PieceInfo'));
}
