import { degrees, rgb, StandardFonts, type PDFDocument, type PDFFont, type PDFImage, type PDFPage } from '@cantoo/pdf-lib';
import { parseHexColor, placeInBox, type PageFrame } from './geometry';

/** Fonts tried, in order, when text has to be rendered by the browser (any script). */
export const SYSTEM_FONT_STACK =
  "system-ui, 'Segoe UI', 'Noto Sans', 'Nirmala UI', 'Yu Gothic UI', 'Microsoft YaHei UI', 'Malgun Gothic', 'Leelawadee UI', Arial, sans-serif";

export interface TextStyle {
  /** Font size in points. */
  size: number;
  /** "#rrggbb" */
  color: string;
  align?: 'left' | 'center' | 'right';
  /** CSS font-family for the rendered (image) path; vector text is always Helvetica. */
  fontFamily?: string;
  /** Force the rendered path, e.g. for handwriting-style signatures. */
  forceImage?: boolean;
}

export interface DrawOptions {
  /** Degrees counter-clockwise as the reader sees it, around the text's centre. */
  angle?: number;
  opacity?: number;
}

/** Text measured and ready to draw, possibly many times (one embedded image is reused). */
export interface PreparedText {
  /** Size of the text block in points. */
  width: number;
  height: number;
  /** True when drawn as real (selectable) text, false when drawn as an image. */
  vector: boolean;
  /** Draws the block centred on a display point of the page. */
  draw(page: PDFPage, frame: PageFrame, centerX: number, centerY: number, options?: DrawOptions): void;
}

const LINE_HEIGHT = 1.2;
/** Helvetica's descender is 207/1000 em. */
const DESCENT = 0.207;

const helveticaCache = new WeakMap<PDFDocument, Promise<PDFFont>>();

function helvetica(doc: PDFDocument): Promise<PDFFont> {
  let font = helveticaCache.get(doc);
  if (!font) {
    font = doc.embedFont(StandardFonts.Helvetica);
    helveticaCache.set(doc, font);
  }
  return font;
}

const characterSets = new WeakMap<PDFFont, Set<number>>();

/**
 * Whether `font` has a glyph for every character. pdf-lib doesn't throw on missing
 * characters; it silently writes "?" instead, so we have to check ourselves.
 */
export function canEncode(font: PDFFont, text: string): boolean {
  let set = characterSets.get(font);
  if (!set) {
    set = new Set(font.getCharacterSet());
    characterSets.set(font, set);
  }
  for (const char of text) {
    if (char === '\n' || char === '\r') continue;
    if (!set.has(char.codePointAt(0)!)) return false;
  }
  return true;
}

/** Widths of each line in Helvetica, or null if any character isn't in its WinAnsi set. */
function vectorWidths(font: PDFFont, lines: string[], size: number): number[] | null {
  if (!lines.every((line) => canEncode(font, line))) return null;
  return lines.map((line) => font.widthOfTextAtSize(line, size));
}

/** Measures `text` and prepares it for drawing, choosing vector text when Helvetica can encode it. */
export async function prepareText(doc: PDFDocument, text: string, style: TextStyle): Promise<PreparedText> {
  const lines = text.split(/\r?\n/);
  const { size } = style;
  const align = style.align ?? 'left';
  const lineHeight = size * LINE_HEIGHT;
  const height = lines.length * lineHeight;

  const font = await helvetica(doc);
  const widths = style.forceImage ? null : vectorWidths(font, lines, size);
  if (widths) {
    const width = Math.max(0, ...widths);
    const { r, g, b } = parseHexColor(style.color);
    return {
      width,
      height,
      vector: true,
      draw(page, frame, centerX, centerY, options = {}) {
        const box = { centerX, centerY, width, height, angle: options.angle ?? 0 };
        lines.forEach((line, index) => {
          if (line === '') return;
          const lineWidth = widths[index]!;
          const localX = align === 'center' ? (width - lineWidth) / 2 : align === 'right' ? width - lineWidth : 0;
          const localY = height - (index + 1) * lineHeight + (lineHeight - size) / 2 + DESCENT * size;
          const at = placeInBox(frame, box, localX, localY);
          page.drawText(line, {
            x: at.x,
            y: at.y,
            size,
            font,
            color: rgb(r, g, b),
            rotate: degrees(at.rotate),
            ...(options.opacity === undefined ? {} : { opacity: options.opacity }),
          });
        });
      },
    };
  }

  const rendered = await renderTextImage(lines, style);
  const image: PDFImage = await doc.embedPng(rendered.png);
  return {
    width: rendered.width,
    height: rendered.height,
    vector: false,
    draw(page, frame, centerX, centerY, options = {}) {
      const box = { centerX, centerY, width: rendered.width, height: rendered.height, angle: options.angle ?? 0 };
      const at = placeInBox(frame, box);
      page.drawImage(image, {
        x: at.x,
        y: at.y,
        width: rendered.width,
        height: rendered.height,
        rotate: degrees(at.rotate),
        ...(options.opacity === undefined ? {} : { opacity: options.opacity }),
      });
    },
  };
}

/**
 * Renders lines of text to a transparent PNG with the browser's fonts, so every script works.
 * Works on the main thread and in workers (OffscreenCanvas). Sizes are returned in points.
 */
export async function renderTextImage(
  lines: string[],
  style: TextStyle,
): Promise<{ png: Uint8Array; width: number; height: number }> {
  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error('Rendering text needs OffscreenCanvas');
  }
  const { size } = style;
  const align = style.align ?? 'left';
  const family = style.fontFamily ?? SYSTEM_FONT_STACK;
  const lineHeight = size * LINE_HEIGHT;

  // About 300 dpi, capped so huge watermarks don't blow up memory.
  let scale = 300 / 72;
  const measureContext = new OffscreenCanvas(1, 1).getContext('2d')!;
  measureContext.font = `${size * scale}px ${family}`;
  const measured = lines.map((line) => measureContext.measureText(line));
  const widestPx = Math.max(1, ...measured.map((metrics) => metrics.width));
  // Generous side padding: script fonts often overhang their advance width.
  const pad = size * 0.25;
  const widthPt = widestPx / scale + pad * 2;
  const heightPt = lines.length * lineHeight;
  scale = Math.min(scale, 4096 / widthPt, 4096 / heightPt);

  const canvas = new OffscreenCanvas(Math.ceil(widthPt * scale), Math.ceil(heightPt * scale));
  const context = canvas.getContext('2d')!;
  context.font = `${size * scale}px ${family}`;
  context.fillStyle = style.color;
  context.textBaseline = 'middle';
  context.textAlign = align;
  const x = align === 'center' ? canvas.width / 2 : align === 'right' ? canvas.width - pad * scale : pad * scale;
  lines.forEach((line, index) => {
    context.fillText(line, x, (index + 0.5) * lineHeight * scale);
  });

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return { png: new Uint8Array(await blob.arrayBuffer()), width: canvas.width / scale, height: canvas.height / scale };
}
