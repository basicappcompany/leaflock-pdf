import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { TextRun } from './convert/structure';
import { PdfInputError } from './pdf/inputError';

export type { PDFDocumentProxy, PDFPageProxy };

type PdfJs = typeof import('pdfjs-dist');

let library: Promise<PdfJs> | undefined;

/** Loads pdf.js on first use, so pages that don't render previews never download it. */
function pdfjs(): Promise<PdfJs> {
  library ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(
    ([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    },
  );
  return library;
}

/**
 * Opens a PDF for rendering or text extraction. pdf.js takes ownership of the buffer
 * it is given, so we hand it a copy and the caller's bytes stay usable.
 */
export async function openPdf(name: string, bytes: Uint8Array, password?: string): Promise<PDFDocumentProxy> {
  const lib = await pdfjs();
  const task = lib.getDocument({
    data: bytes.slice(),
    ...(password === undefined ? {} : { password }),
    // Everything pdf.js fetches at run time is served from our own origin (see integrations/vendor-assets.mjs).
    cMapUrl: '/vendor/pdfjs/cmaps/',
    standardFontDataUrl: '/vendor/pdfjs/standard_fonts/',
    wasmUrl: '/vendor/pdfjs/wasm/',
    iccUrl: '/vendor/pdfjs/iccs/',
    enableXfa: false,
  });
  try {
    return await task.promise;
  } catch (error) {
    const errorName = error instanceof Error ? error.name : '';
    if (errorName === 'PasswordException') {
      throw new PdfInputError(name, password === undefined ? 'password-protected' : 'wrong-password', { cause: error });
    }
    throw new PdfInputError(name, 'not-a-pdf', { cause: error });
  }
}

/** Frees a document's memory and its share of the pdf.js worker. */
export function closePdf(doc: PDFDocumentProxy): Promise<void> {
  return doc.loadingTask.destroy();
}

export interface RenderOptions {
  /** Target CSS width in pixels; height follows the page's aspect ratio. */
  width?: number;
  /** Or an explicit scale where 1 = 72 dpi. */
  scale?: number;
  /** Extra rotation in degrees (multiple of 90) on top of the page's own. */
  rotation?: number;
  /** Device pixel ratio to render at; defaults to the screen's. */
  pixelRatio?: number;
  /** Fill colour behind the page; pages without one are transparent. */
  background?: string;
}

/** Renders a page into a new canvas. */
export async function renderPage(page: PDFPageProxy, options: RenderOptions = {}): Promise<HTMLCanvasElement> {
  const rotation = (page.rotate + (options.rotation ?? 0)) % 360;
  const unscaled = page.getViewport({ scale: 1, rotation });
  const scale = options.scale ?? (options.width ? options.width / unscaled.width : 1);
  const ratio = options.pixelRatio ?? (typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);
  const viewport = page.getViewport({ scale: scale * ratio, rotation });

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvas, viewport, background: options.background ?? 'white' }).promise;
  return canvas;
}

/** Plain text of a page, with line breaks where pdf.js reports them. */
export async function pageText(page: PDFPageProxy): Promise<string> {
  const content = await page.getTextContent();
  let text = '';
  for (const item of content.items) {
    if ('str' in item) {
      text += item.str;
      if (item.hasEOL) text += '\n';
    }
  }
  return text;
}

/**
 * Positioned text runs with their style resolved, for PDF → Word.
 *
 * `getTextContent()` alone is not enough: it reports an opaque font id (`g_d0_f1`) and
 * its `styles` map says only `fontFamily: "sans-serif"`, never which font is the bold
 * one. The styles live on pdf.js's own parsed font objects in `page.commonObjs` — but
 * those are only populated once pdf.js has parsed the page's content stream, and
 * `commonObjs.get()` **throws** ("Requesting object that isn't resolved yet") rather than
 * returning `undefined` before that. So the operator list is built first purely to force
 * that parse; its output is deliberately unused. Verified against a fixture using
 * Helvetica, Helvetica-Bold, Helvetica-Oblique and Times-BoldItalic.
 *
 * `commonObjs` is not part of pdf.js's documented API surface, so every lookup is
 * defensive: a run whose font cannot be resolved is kept as regular text rather than
 * failing the conversion. The guard that a pdf.js upgrade has not stopped reporting
 * styles is the round trip in `tests/e2e/convert.spec.ts`, which converts a PDF with
 * bold and italic text and asserts both survive into the .docx — it has to run in a real
 * browser, which is where pdf.js actually does this work.
 */
export async function pageTextRuns(page: PDFPageProxy): Promise<TextRun[]> {
  await page.getOperatorList();
  const content = await page.getTextContent();

  const cache = new Map<string, { bold: boolean; italic: boolean }>();
  const styleOf = (fontName: string): { bold: boolean; italic: boolean } => {
    const known = cache.get(fontName);
    if (known) return known;
    let style = { bold: false, italic: false };
    try {
      const font = page.commonObjs.get(fontName) as { bold?: boolean; italic?: boolean } | undefined;
      if (font) style = { bold: font.bold === true, italic: font.italic === true };
    } catch {
      // Unresolved font: plain text is a better answer than no document.
    }
    cache.set(fontName, style);
    return style;
  };

  const runs: TextRun[] = [];
  for (const item of content.items) {
    if (!('str' in item) || item.str === '') continue;
    const transform = item.transform as number[];
    const size = Math.abs(transform[3] ?? 0) || Math.abs(transform[0] ?? 0);
    runs.push({
      text: item.str,
      x: transform[4] ?? 0,
      y: transform[5] ?? 0,
      width: item.width,
      size,
      ...styleOf(item.fontName),
    });
  }
  return runs;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))), type, quality);
  });
}
