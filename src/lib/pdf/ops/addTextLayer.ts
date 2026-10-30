import {
  beginText,
  endText,
  PDFContentStream,
  popGraphicsState,
  pushGraphicsState,
  setCharacterSqueeze,
  setFontAndSize,
  setTextMatrix,
  setTextRenderingMode,
  showText,
  StandardFonts,
  TextRenderingMode,
  type PDFDocument,
  type PDFFont,
  type PDFName,
  type PDFOperator,
  type PDFPage,
} from '@cantoo/pdf-lib';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';

/** One recognised word, in pixels of the rendered page image (origin top left, y down). */
export interface OcrWord {
  text: string;
  x0: number;
  x1: number;
  /** Top and bottom of the word's line, so all words on a line get the same size. */
  top: number;
  bottom: number;
  /** Where the line's baseline crosses this word. */
  baseline: number;
}

export interface OcrPage {
  /** 0-based page index in the PDF. */
  pageIndex: number;
  /** Size of the image the words were recognised in, as rendered (rotation applied). */
  imageWidth: number;
  imageHeight: number;
  words: OcrWord[];
}

export interface AddTextLayerArgs {
  input: PdfInput;
  pages: OcrPage[];
  outputName: string;
}

/**
 * Lays recognised text invisibly over each page (PDF text rendering mode 3, as OCR tools do),
 * so the page looks the same but its text can be searched, selected and copied.
 */
export async function addTextLayer({ input, pages, outputName }: AddTextLayerArgs, ctx: OpContext): Promise<OutputFile[]> {
  const doc = await loadPdf(input);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const encode = encoderFor(font);

  for (const [index, ocr] of pages.entries()) {
    const page = doc.getPage(ocr.pageIndex);
    page.node.normalize();
    const fontKey = page.node.newFontDictionaryKey('LeafLockOcr');
    const operators = textOperators(page, font, fontKey, encode, ocr);
    if (operators.length > 0) {
      page.node.setFontDictionary(fontKey, font.ref);
      appendIsolated(doc, page, operators);
    }
    ctx.progress((index + 1) / pages.length);
  }

  markProduced(doc);
  return [pdfFile(outputName, await doc.save())];
}

function textOperators(
  page: PDFPage,
  font: PDFFont,
  fontKey: PDFName,
  encode: (text: string) => string,
  ocr: OcrPage,
): PDFOperator[] {
  const box = page.getCropBox();
  const rotation = (((page.getRotation().angle % 360) + 360) % 360) as 0 | 90 | 180 | 270;
  // Displayed page size in points (rotation applied), to convert word heights to font sizes.
  const shownHeight = rotation === 90 || rotation === 270 ? box.width : box.height;
  const pointsPerPixel = shownHeight / ocr.imageHeight;

  const operators: PDFOperator[] = [];
  for (const word of ocr.words) {
    const text = encode(word.text);
    if (!text) continue;
    const lineHeight = (word.bottom - word.top) * pointsPerPixel;
    const size = Math.max(1, lineHeight * 0.85);
    const wordWidth = (word.x1 - word.x0) * pointsPerPixel;
    const naturalWidth = font.widthOfTextAtSize(text, size);
    if (naturalWidth <= 0 || wordWidth <= 0) continue;

    // Word origin (left end of its baseline) as fractions of the displayed page, y down.
    const fx = word.x0 / ocr.imageWidth;
    const fy = word.baseline / ocr.imageHeight;
    const [x, y] = toPagePoint(fx, fy, box, rotation);
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    operators.push(
      beginText(),
      setFontAndSize(fontKey, size),
      setTextRenderingMode(TextRenderingMode.Invisible),
      setCharacterSqueeze((wordWidth / naturalWidth) * 100),
      setTextMatrix(cos, sin, -sin, cos, x, y),
      showText(font.encodeText(text)),
      endText(),
    );
  }
  return operators;
}

/**
 * Converts a point on the displayed page (fractions, y down) to PDF user space,
 * undoing the page's /Rotate. Text drawn with rotation = page rotation reads left to right on screen.
 */
export function toPagePoint(
  fx: number,
  fy: number,
  box: { x: number; y: number; width: number; height: number },
  rotation: 0 | 90 | 180 | 270,
): [number, number] {
  switch (rotation) {
    case 90:
      return [box.x + fy * box.width, box.y + fx * box.height];
    case 180:
      return [box.x + (1 - fx) * box.width, box.y + fy * box.height];
    case 270:
      return [box.x + (1 - fy) * box.width, box.y + (1 - fx) * box.height];
    default:
      return [box.x + fx * box.width, box.y + (1 - fy) * box.height];
  }
}

/**
 * Adds operators after the page's existing content, with that content wrapped in q/Q so
 * any transformation it leaves behind can't shift our text.
 */
function appendIsolated(doc: PDFDocument, page: PDFPage, operators: PDFOperator[]) {
  const start = doc.context.register(PDFContentStream.of(doc.context.obj({}), [pushGraphicsState()]));
  const end = doc.context.register(PDFContentStream.of(doc.context.obj({}), [popGraphicsState()]));
  page.node.wrapContentStreams(start, end);
  page.pushOperators(...operators);
}

/**
 * Keeps only characters the standard Helvetica font can encode (WinAnsi). Accented letters
 * outside it fall back to their base letter; anything else is dropped.
 */
function encoderFor(font: PDFFont): (text: string) => string {
  const supported = new Set(font.getCharacterSet());
  const encodable = (char: string) => supported.has(char.codePointAt(0)!);
  return (text) => {
    let out = '';
    for (const char of text) {
      if (encodable(char)) out += char;
      else if (char in baseLetters) out += baseLetters[char];
      else for (const part of char.normalize('NFKD')) if (encodable(part)) out += part;
    }
    return out.trim();
  };
}

/** Letters that Unicode doesn't decompose but readers still expect to find by their base letter. */
const baseLetters: Record<string, string> = { Ł: 'L', ł: 'l', Đ: 'D', đ: 'd', Ħ: 'H', ħ: 'h', ı: 'i', Ŀ: 'L', ŀ: 'l' };
