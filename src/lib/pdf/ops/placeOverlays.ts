import { BlendMode, degrees, rgb, type PDFImage } from '@cantoo/pdf-lib';
import { prepareText } from '../../edit/drawText';
import { boxFromTopLeft, pageFrame, parseHexColor, placeInBox } from '../../edit/geometry';
import type { OverlayImage, OverlayItem } from '../../edit/overlays';
import { ToolError } from '../errors';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';
import { stripJpegMetadata } from '../jpegMetadata';

export interface PlaceOverlaysArgs {
  input: PdfInput;
  outputName: string;
  items: OverlayItem[];
  /** Images referenced by `imageId`, so a signature placed on ten pages is embedded once. */
  images: Record<string, OverlayImage>;
}

function color(hex: string) {
  const { r, g, b } = parseHexColor(hex);
  return rgb(r, g, b);
}

/** Draws signatures, text, shapes, highlights and white-out boxes onto pages. */
export async function placeOverlays(args: PlaceOverlaysArgs, ctx: OpContext): Promise<OutputFile[]> {
  if (args.items.length === 0) throw new ToolError('nothing-placed');
  const doc = await loadPdf(args.input);
  const pages = doc.getPages();

  const embedded = new Map<string, Promise<PDFImage>>();
  function image(id: string): Promise<PDFImage> {
    let result = embedded.get(id);
    if (!result) {
      const source = args.images[id];
      if (!source) throw new Error(`Missing overlay image ${id}`);
      result = source.type === 'png' ? doc.embedPng(source.bytes) : doc.embedJpg(stripJpegMetadata(source.bytes));
      embedded.set(id, result);
    }
    return result;
  }

  for (const [index, item] of args.items.entries()) {
    const page = pages[item.page];
    if (!page) continue;
    const frame = pageFrame(page);
    const left = item.x * frame.width;
    const top = item.y * frame.height;
    const width = item.w * frame.width;
    const height = item.h * frame.height;
    const box = boxFromTopLeft(left, top, width, height);
    const at = placeInBox(frame, box);
    const rotate = degrees(at.rotate);

    switch (item.kind) {
      case 'image': {
        page.drawImage(await image(item.imageId), { x: at.x, y: at.y, width, height, rotate });
        break;
      }
      case 'text': {
        if (item.text.trim() === '') break;
        const text = await prepareText(doc, item.text, {
          size: item.fontSize,
          color: item.color,
          ...(item.fontFamily ? { fontFamily: item.fontFamily } : {}),
        });
        // Text starts at the box's top-left corner, like a text box in an editor.
        text.draw(page, frame, left + text.width / 2, top + text.height / 2);
        break;
      }
      case 'rect': {
        page.drawRectangle({
          x: at.x,
          y: at.y,
          width,
          height,
          rotate,
          ...(item.fill ? { color: color(item.fill) } : {}),
          ...(item.stroke ? { borderColor: color(item.stroke), borderWidth: item.strokeWidth } : { borderWidth: 0 }),
        });
        break;
      }
      case 'highlight': {
        page.drawRectangle({
          x: at.x,
          y: at.y,
          width,
          height,
          rotate,
          color: color(item.color),
          opacity: 0.4,
          blendMode: BlendMode.Multiply,
          borderWidth: 0,
        });
        break;
      }
      case 'whiteout': {
        page.drawRectangle({ x: at.x, y: at.y, width, height, rotate, color: rgb(1, 1, 1), borderWidth: 0 });
        break;
      }
      case 'redaction':
        // Redaction boxes are burned in by the Redact tool (rasterizePages), never drawn as shapes.
        throw new Error('placeOverlays does not draw redactions');
    }
    ctx.progress((index + 1) / args.items.length);
  }

  markProduced(doc);
  return [pdfFile(args.outputName, await doc.save())];
}
