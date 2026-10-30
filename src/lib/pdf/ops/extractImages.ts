import { unzlibSync } from 'fflate';
import { PDFDict, PDFName, type PDFDocument, type PDFRawStream } from '@cantoo/pdf-lib';
import { components, imageStreams, numberOf, singleFilter, toCanvas } from '../images';
import { ToolError } from '../errors';
import { loadPdf, type PdfInput } from '../load';
import { baseName, type OpContext, type OutputFile } from '../types';

export interface ExtractImagesArgs {
  input: PdfInput;
}

export interface ExtractImagesResult {
  files: OutputFile[];
  extracted: number;
  /** Found but not in a format this op decodes — reported, not silently dropped. */
  skipped: number;
}

const name = (value: string) => PDFName.of(value);

function canDecodeRawSamples(): boolean {
  return typeof OffscreenCanvas !== 'undefined';
}

/**
 * Pulls each embedded image XObject out of a PDF as its own file, named by position so
 * the order survives a zip. A JPEG-filtered image (`DCTDecode`) is the PDF's own stream
 * bytes, byte for byte — `/Filter DCTDecode` *is* a standalone JPEG datastream per the
 * PDF spec, so no decode happens and no quality is lost. A losslessly-filtered image
 * (`FlateDecode`, plain 8-bit Gray/RGB samples) is laid onto a canvas and re-encoded as
 * PNG, the same decode `compress.ts` already does the other way round (`../images.ts`
 * is shared between the two for exactly that overlap).
 *
 * Stated plainly rather than guessed at: CMYK, Indexed-palette, 16-bit, predictor-filtered
 * and CCITT-fax/JPEG2000-filtered images are not decoded here and are counted in
 * `skipped` instead of silently vanishing. `ToolError 'no-images'` when there was
 * nothing to extract at all (nothing found, or everything found was unsupported).
 */
export async function extractImages({ input }: ExtractImagesArgs, ctx: OpContext): Promise<ExtractImagesResult> {
  const doc = await loadPdf(input);
  const streams = imageStreams(doc);
  const stem = baseName(input.name);

  const files: OutputFile[] = [];
  let skipped = 0;

  for (const [index, stream] of streams.entries()) {
    const extracted = await extractOne(doc, stream, stem, index + 1);
    if (extracted) files.push(extracted);
    else skipped++;
    ctx.progress((index + 1) / streams.length);
  }

  if (files.length === 0 && skipped === 0) throw new ToolError('no-images', { name: input.name });
  return { files, extracted: files.length, skipped };
}

async function extractOne(doc: PDFDocument, stream: PDFRawStream, stem: string, position: number): Promise<OutputFile | undefined> {
  const dict = stream.dict;
  const filter = singleFilter(dict);

  if (filter === 'DCTDecode') {
    return { name: `${stem}-image-${position}.jpg`, bytes: stream.contents.slice() as Uint8Array<ArrayBuffer>, type: 'image/jpeg' };
  }

  if (filter === 'FlateDecode' && canDecodeRawSamples()) {
    const width = numberOf(dict, 'Width');
    const height = numberOf(dict, 'Height');
    const comps = components(doc, dict.get(name('ColorSpace')));
    if (!width || !height || !comps || numberOf(dict, 'BitsPerComponent') !== 8) return undefined;
    if (dict.has(name('Decode'))) return undefined;
    const params = doc.context.lookup(dict.get(name('DecodeParms')));
    if (params instanceof PDFDict && (numberOf(params, 'Predictor') ?? 1) > 1) return undefined;

    const pixels = unzlibSync(stream.contents);
    if (pixels.length !== width * height * comps) return undefined;

    const canvas = toCanvas(pixels, width, height, comps);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return { name: `${stem}-image-${position}.png`, bytes: bytes as Uint8Array<ArrayBuffer>, type: 'image/png' };
  }

  return undefined;
}
