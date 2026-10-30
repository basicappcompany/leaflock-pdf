import { PDFDocument, StandardFonts, type PDFFont } from '@cantoo/pdf-lib';
import { tokensOf, wrapTokens, type Token } from '../../convert/wrap';
import type { Block, Span } from '../../convert/structure';
import { ToolError } from '../errors';
import { markProduced } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface BlocksToPdfArgs {
  blocks: Block[];
  outputName: string;
}

export interface BlocksToPdfResult {
  file: OutputFile;
  pages: number;
}

/** A4 in points. Office → PDF has no source page size to honour — the source is a
 * reflowable document — so this is simply a sensible, common default. */
const PAGE_SIZE = { width: 595.28, height: 841.89 };
const MARGIN = 56;
const BODY_SIZE = 11;
const HEADING_SIZES: Record<1 | 2 | 3, number> = { 1: 22, 2: 17, 3: 13.5 };
const LINE_HEIGHT = 1.35;
const PARAGRAPH_GAP = 10;
const HEADING_GAP_ABOVE = 14;
const LIST_INDENT = 16;

/**
 * Draws an inferred document outline onto paginated A4 pages — the Office → PDF half of
 * the same `Block`/`Span` shape PDF → Word writes the other way
 * (`src/lib/convert/docxBlocks.ts` is the reader). A worker operation, unlike
 * `docx.ts`/`xlsx.ts`: there is no heavy new dependency to keep off the main thread here,
 * pdf-lib already lives in this worker, and that is the whole job.
 *
 * Headings render bold regardless of the source run's own bold flag — a heading is
 * visually bold by convention whether or not its XML happened to mark every run that
 * way — but keep the source's italic. Ordinary paragraph and list text uses exactly the
 * bold/italic the source recorded.
 */
export async function blocksToPdf({ blocks, outputName }: BlocksToPdfArgs, ctx: OpContext): Promise<BlocksToPdfResult> {
  if (blocks.length === 0) throw new ToolError('no-text');

  const doc = await PDFDocument.create();
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
  };
  const styleFont = (span: Span) => fontOf(fonts, span.bold, span.italic);

  const contentWidth = PAGE_SIZE.width - MARGIN * 2;
  const cursor = { page: doc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]), y: PAGE_SIZE.height - MARGIN, pages: 1 };

  const newPage = () => {
    cursor.page = doc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
    cursor.y = PAGE_SIZE.height - MARGIN;
    cursor.pages++;
  };

  const drawLines = (lines: Token[][], x: number, size: number) => {
    for (const line of lines) {
      const lineHeight = size * LINE_HEIGHT;
      if (cursor.y - lineHeight < MARGIN) newPage();
      cursor.y -= lineHeight;

      let cursorX = x;
      for (const token of line) {
        cursor.page.drawText(token.text, { x: cursorX, y: cursor.y, size: token.size, font: token.font as PDFFont });
        cursorX += token.font.widthOfTextAtSize(token.text, token.size);
      }
    }
  };

  let listCounter = 0;
  let previousOrdered: boolean | undefined;

  blocks.forEach((block, index) => {
    const isListItem = block.kind === 'listItem';
    if (isListItem && block.ordered === previousOrdered) listCounter++;
    else if (isListItem) listCounter = 1;
    if (isListItem) previousOrdered = block.ordered;
    else previousOrdered = undefined;

    if (block.kind === 'heading') {
      const size = HEADING_SIZES[block.level];
      const font = (span: Span) => (span.italic ? fonts.boldItalic : fonts.bold);
      const tokens = tokensOf(block.spans, size, font);
      if (index > 0) cursor.y -= HEADING_GAP_ABOVE;
      drawLines(wrapTokens(tokens, contentWidth), MARGIN, size);
      cursor.y -= PARAGRAPH_GAP / 2;
    } else if (block.kind === 'paragraph') {
      const tokens = tokensOf(block.spans, BODY_SIZE, styleFont);
      drawLines(wrapTokens(tokens, contentWidth), MARGIN, BODY_SIZE);
      cursor.y -= PARAGRAPH_GAP;
    } else {
      const marker = block.ordered ? `${listCounter}.` : '•';
      const markerFont = fonts.regular;
      const markerWidth = Math.max(markerFont.widthOfTextAtSize('9.', BODY_SIZE), markerFont.widthOfTextAtSize('•', BODY_SIZE));
      const indent = LIST_INDENT + markerWidth;

      const tokens = tokensOf(block.spans, BODY_SIZE, styleFont);
      const lines = wrapTokens(tokens, contentWidth - indent);

      // The marker sits beside the first line only; continuation lines are indented to
      // match, giving the usual hanging-indent look without tracking x per line.
      if (lines.length > 0) {
        const lineHeight = BODY_SIZE * LINE_HEIGHT;
        if (cursor.y - lineHeight < MARGIN) newPage();
        const markerY = cursor.y - lineHeight;
        cursor.page.drawText(marker, { x: MARGIN, y: markerY, size: BODY_SIZE, font: markerFont });
      }
      drawLines(lines, MARGIN + indent, BODY_SIZE);
      cursor.y -= PARAGRAPH_GAP / 2;
    }
    ctx.progress((index + 1) / blocks.length);
  });

  markProduced(doc);
  return { file: pdfFile(outputName, await doc.save()), pages: cursor.pages };
}

function fontOf(fonts: Record<'regular' | 'bold' | 'italic' | 'boldItalic', PDFFont>, bold: boolean, italic: boolean): PDFFont {
  if (bold && italic) return fonts.boldItalic;
  if (bold) return fonts.bold;
  if (italic) return fonts.italic;
  return fonts.regular;
}
