import {
  concatTransformationMatrix,
  drawObject,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  type PDFImage,
} from '@cantoo/pdf-lib';
import { jpegOrientation } from '../../convert/exif';
import { ToolError } from '../errors';
import { markProduced } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';
import { stripJpegMetadata } from '../jpegMetadata';

export interface ImageInput {
  name: string;
  bytes: Uint8Array;
}

export type PageSizeOption = 'fit' | 'a4' | 'letter';
export type OrientationOption = 'auto' | 'portrait' | 'landscape';
export type MarginOption = 'none' | 'small' | 'large';

export interface ImagesToPdfArgs {
  images: ImageInput[];
  pageSize: PageSizeOption;
  orientation: OrientationOption;
  margin: MarginOption;
  outputName: string;
}

/** Page sizes in points, portrait. */
const pageSizes = {
  a4: [595.28, 841.89],
  letter: [612, 792],
} as const;

/** Margins in points: none, about 8 mm, about 18 mm. */
const margins: Record<MarginOption, number> = { none: 0, small: 24, large: 50 };

/** Pixels to points when the page takes the image's own size (images are usually meant at 96 dpi). */
const POINTS_PER_PIXEL = 0.75;

/** PDF viewers refuse pages larger than 200 inches. */
const MAX_PAGE_POINTS = 14_400;

/** Turns images into a PDF, one image per page, centred and scaled to fit. */
export async function imagesToPdf(args: ImagesToPdfArgs, ctx: OpContext): Promise<OutputFile[]> {
  const { images, pageSize, orientation, margin, outputName } = args;
  if (images.length === 0) throw new RangeError('imagesToPdf needs at least one image');

  const doc = await PDFDocument.create();
  for (const [index, input] of images.entries()) {
    const { image, orientation: exif } = await embedImage(doc, input);
    // EXIF orientations 5-8 swap width and height on display.
    const swapped = exif >= 5;
    const shownWidth = swapped ? image.height : image.width;
    const shownHeight = swapped ? image.width : image.height;

    const [pageWidth, pageHeight] = pageFor(shownWidth, shownHeight, pageSize, orientation, margins[margin]);
    const page = doc.addPage([pageWidth, pageHeight]);

    const boxWidth = pageWidth - 2 * margins[margin];
    const boxHeight = pageHeight - 2 * margins[margin];
    const scale = Math.min(boxWidth / shownWidth, boxHeight / shownHeight);
    const width = shownWidth * scale;
    const height = shownHeight * scale;
    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;

    const name = page.node.newXObject('Image', image.ref);
    page.pushOperators(
      pushGraphicsState(),
      concatTransformationMatrix(...orientationMatrix(exif, x, y, width, height)),
      drawObject(name),
      popGraphicsState(),
    );
    ctx.progress((index + 1) / images.length);
  }

  markProduced(doc);
  return [pdfFile(outputName, await doc.save())];
}

function pageFor(
  width: number,
  height: number,
  pageSize: PageSizeOption,
  orientation: OrientationOption,
  margin: number,
): [number, number] {
  if (pageSize === 'fit') {
    let pageWidth = width * POINTS_PER_PIXEL + 2 * margin;
    let pageHeight = height * POINTS_PER_PIXEL + 2 * margin;
    const shrink = Math.min(1, MAX_PAGE_POINTS / Math.max(pageWidth, pageHeight));
    pageWidth *= shrink;
    pageHeight *= shrink;
    return [pageWidth, pageHeight];
  }
  const [short, long] = pageSizes[pageSize];
  const landscape = orientation === 'landscape' || (orientation === 'auto' && width > height);
  return landscape ? [long, short] : [short, long];
}

/**
 * Matrix that maps the image's unit square onto the target box, displaying it the way
 * its EXIF orientation says (1 = as stored; 2-8 = mirrored and/or rotated).
 */
export function orientationMatrix(
  exif: number,
  x: number,
  y: number,
  w: number,
  h: number,
): [number, number, number, number, number, number] {
  switch (exif) {
    case 2:
      return [-w, 0, 0, h, x + w, y];
    case 3:
      return [-w, 0, 0, -h, x + w, y + h];
    case 4:
      return [w, 0, 0, -h, x, y + h];
    case 5:
      return [0, -h, -w, 0, x + w, y + h];
    case 6:
      return [0, -h, w, 0, x, y + h];
    case 7:
      return [0, h, w, 0, x, y];
    case 8:
      return [0, h, -w, 0, x + w, y];
    default:
      return [w, 0, 0, h, x, y];
  }
}

type Format = 'jpeg' | 'png' | 'other';

function sniff(bytes: Uint8Array): Format {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  return 'other';
}

/** Embeds an image; JPEG and PNG go in as they are, other formats are re-encoded first. */
async function embedImage(doc: PDFDocument, input: ImageInput): Promise<{ image: PDFImage; orientation: number }> {
  const format = sniff(input.bytes);
  try {
    if (format === 'jpeg') {
      await assertDecodable(input);
      // Orientation is read first: stripping removes EXIF, including camera details and GPS location.
      return { image: await doc.embedJpg(stripJpegMetadata(input.bytes)), orientation: jpegOrientation(input.bytes) };
    }
    if (format === 'png') return { image: await doc.embedPng(input.bytes), orientation: 1 };
  } catch {
    throw new ToolError('unreadableImage', { name: input.name });
  }
  const converted = await reencode(input);
  const image = converted.type === 'jpeg' ? await doc.embedJpg(converted.bytes) : await doc.embedPng(converted.bytes);
  // createImageBitmap already applied any EXIF orientation.
  return { image, orientation: 1 };
}

/**
 * pdf-lib only reads a JPEG's header, so a truncated or corrupt photo would embed "fine" and
 * show as a broken page. In a browser worker we can afford a real decode to catch that.
 */
async function assertDecodable(input: ImageInput): Promise<void> {
  if (typeof createImageBitmap === 'undefined') return;
  const bitmap = await createImageBitmap(new Blob([input.bytes as Uint8Array<ArrayBuffer>]));
  bitmap.close();
}

/**
 * Converts WebP, GIF, BMP, AVIF and other browser-decodable formats to JPEG (opaque)
 * or PNG (with transparency). Needs a browser worker; unavailable in Node.
 */
async function reencode(input: ImageInput): Promise<{ type: 'jpeg' | 'png'; bytes: Uint8Array }> {
  if (typeof createImageBitmap === 'undefined' || typeof OffscreenCanvas === 'undefined') {
    throw new ToolError('unsupportedImage', { name: input.name });
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(new Blob([input.bytes as Uint8Array<ArrayBuffer>]), { imageOrientation: 'from-image' });
  } catch {
    throw new ToolError('unsupportedImage', { name: input.name });
  }
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d');
  if (!context) throw new ToolError('unsupportedImage', { name: input.name });
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const transparent = hasTransparency(context.getImageData(0, 0, canvas.width, canvas.height).data);
  const blob = await canvas.convertToBlob(
    transparent ? { type: 'image/png' } : { type: 'image/jpeg', quality: 0.92 },
  );
  return { type: transparent ? 'png' : 'jpeg', bytes: new Uint8Array(await blob.arrayBuffer()) };
}

function hasTransparency(pixels: Uint8ClampedArray): boolean {
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i]! < 255) return true;
  }
  return false;
}
