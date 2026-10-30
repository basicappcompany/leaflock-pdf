import { degrees, PDFArray, type PDFDocument, type PDFImage, type PDFPage, type PDFRef } from '@cantoo/pdf-lib';
import { prepareText, type PreparedText } from '../../edit/drawText';
import { pageFrame, placeInBox, type PageFrame } from '../../edit/geometry';
import { tileCentres } from '../../edit/tiles';
import { ToolError } from '../errors';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';
import { stripJpegMetadata } from '../jpegMetadata';

export type WatermarkContent =
  | { kind: 'text'; text: string; fontSize: number; color: string }
  | { kind: 'image'; bytes: Uint8Array; type: 'png' | 'jpeg'; /** Width as a share of the page width. */ scale: number };

export interface AddWatermarkArgs {
  input: PdfInput;
  outputName: string;
  content: WatermarkContent;
  /** 0–1 */
  opacity: number;
  /** Degrees counter-clockwise. */
  angle: number;
  placement: 'center' | 'tile';
  /** Under puts the mark behind the page content (it stays hidden behind opaque scans). */
  layer: 'over' | 'under';
  /** 0-based pages; null for all. */
  pages: number[] | null;
}

interface Mark {
  width(frame: PageFrame): number;
  height(frame: PageFrame): number;
  draw(page: PDFPage, frame: PageFrame, centerX: number, centerY: number): void;
}

async function textMark(doc: PDFDocument, content: Extract<WatermarkContent, { kind: 'text' }>, args: AddWatermarkArgs): Promise<Mark> {
  if (content.text.trim() === '') throw new ToolError('empty-text');
  const text: PreparedText = await prepareText(doc, content.text, {
    size: content.fontSize,
    color: content.color,
    align: 'center',
  });
  return {
    width: () => text.width,
    height: () => text.height,
    draw: (page, frame, x, y) => text.draw(page, frame, x, y, { angle: args.angle, opacity: args.opacity }),
  };
}

async function imageMark(doc: PDFDocument, content: Extract<WatermarkContent, { kind: 'image' }>, args: AddWatermarkArgs): Promise<Mark> {
  let image: PDFImage;
  try {
    image = content.type === 'png' ? await doc.embedPng(content.bytes) : await doc.embedJpg(stripJpegMetadata(content.bytes));
  } catch {
    throw new ToolError('bad-image');
  }
  const aspect = image.height / image.width;
  return {
    width: (frame) => frame.width * content.scale,
    height: (frame) => frame.width * content.scale * aspect,
    draw(page, frame, centerX, centerY) {
      const width = frame.width * content.scale;
      const height = width * aspect;
      const at = placeInBox(frame, { centerX, centerY, width, height, angle: args.angle });
      page.drawImage(image, { x: at.x, y: at.y, width, height, rotate: degrees(at.rotate), opacity: args.opacity });
    },
  };
}

/**
 * Moves the content stream pdf-lib just drew into to the front of the page's /Contents,
 * so the mark is painted before (under) the original content.
 */
function sendDrawingToBack(page: PDFPage): void {
  const ref = (page as unknown as { contentStreamRef?: PDFRef }).contentStreamRef;
  const contents = page.node.Contents();
  if (!ref || !(contents instanceof PDFArray)) return;
  const index = contents.indexOf(ref);
  if (index === undefined || index === 0) return;
  contents.remove(index);
  contents.insert(0, ref);
}

/** Stamps text or an image on the chosen pages. */
export async function addWatermark(args: AddWatermarkArgs, ctx: OpContext): Promise<OutputFile[]> {
  const doc = await loadPdf(args.input);
  const mark = args.content.kind === 'text' ? await textMark(doc, args.content, args) : await imageMark(doc, args.content, args);
  const all = doc.getPages();
  const chosen = [...new Set(args.pages ?? all.map((_, index) => index))].filter((index) => index >= 0 && index < all.length);

  for (const [position, pageIndex] of chosen.entries()) {
    const page = all[pageIndex]!;
    const frame = pageFrame(page);
    const centres =
      args.placement === 'tile'
        ? tileCentres(frame.width, frame.height, mark.width(frame), mark.height(frame), args.angle)
        : [[frame.width / 2, frame.height / 2] as [number, number]];
    for (const [x, y] of centres) mark.draw(page, frame, x, y);
    if (args.layer === 'under') sendDrawingToBack(page);
    ctx.progress((position + 1) / chosen.length);
  }

  markProduced(doc);
  return [pdfFile(args.outputName, await doc.save())];
}
