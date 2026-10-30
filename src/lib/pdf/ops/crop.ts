import type { PDFPage } from '@cantoo/pdf-lib';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { baseName, pdfFile, type OpContext, type OutputFile } from '../types';
import { normaliseRotation } from '../../organize/pages';

/** How much to trim from each edge, as a share (0–1) of the page as it is displayed. */
export interface CropMargins {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface CropArgs {
  input: PdfInput;
  margins: CropMargins;
  /** 0-based pages to crop; the others are left as they are. */
  pages: number[];
  outputName?: string;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Turns margins measured on the displayed page into margins on the unrotated page.
 * /Rotate turns the page clockwise for display, so at 90° the page's left edge is shown on top.
 */
export function unrotateMargins(margins: CropMargins, rotation: number): CropMargins {
  const { left, top, right, bottom } = margins;
  switch (normaliseRotation(rotation)) {
    case 0:
      return margins;
    case 90:
      return { left: top, top: right, right: bottom, bottom: left };
    case 180:
      return { left: right, top: bottom, right: left, bottom: top };
    case 270:
      return { left: bottom, top: left, right: top, bottom: right };
  }
}

/** The new crop box inside `visible` (the current crop box, in PDF units with y pointing up). */
export function croppedBox(visible: Box, margins: CropMargins, rotation: number): Box {
  const m = unrotateMargins(margins, rotation);
  return {
    x: visible.x + m.left * visible.width,
    y: visible.y + m.bottom * visible.height,
    width: visible.width * (1 - m.left - m.right),
    height: visible.height * (1 - m.top - m.bottom),
  };
}

function validMargins({ left, top, right, bottom }: CropMargins): boolean {
  const inRange = [left, top, right, bottom].every((value) => Number.isFinite(value) && value >= 0 && value < 1);
  return inRange && left + right < 1 && top + bottom < 1;
}

function cropPage(page: PDFPage, margins: CropMargins): void {
  const box = croppedBox(page.getCropBox(), margins, page.getRotation().angle);
  page.setCropBox(box.x, box.y, box.width, box.height);
  // Printers and some viewers go by the trim box; keep it inside the crop.
  page.setTrimBox(box.x, box.y, box.width, box.height);
}

/** Trims the chosen pages. Nothing is deleted: the crop box just hides what's outside it. */
export async function crop({ input, margins, pages, outputName }: CropArgs, ctx: OpContext): Promise<OutputFile[]> {
  if (!validMargins(margins)) throw new RangeError('Crop margins must leave part of the page');
  const doc = await loadPdf(input);
  const all = doc.getPages();
  for (const [position, index] of pages.entries()) {
    const page = all[index];
    if (!page) throw new RangeError(`No page ${index}`);
    cropPage(page, margins);
    ctx.progress((position + 1) / pages.length);
  }
  markProduced(doc);
  return [pdfFile(outputName ?? `${baseName(input.name)}-cropped.pdf`, await doc.save())];
}
