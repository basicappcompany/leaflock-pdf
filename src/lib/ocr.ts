import type { Worker as TesseractWorker } from 'tesseract.js';
import type { OcrWord } from './pdf/ops/addTextLayer';

export interface OcrResult {
  text: string;
  words: OcrWord[];
}

export type OcrProgress = (stage: 'model' | 'recognizing', fraction: number) => void;

let worker: Promise<TesseractWorker> | undefined;
let listener: OcrProgress | undefined;

/**
 * Starts (once) a tesseract.js worker for English, loading every file from our own origin:
 * the worker script, the WebAssembly core and the language model are copied into
 * public/vendor/tesseract at build time, so nothing is fetched from a CDN.
 */
function getWorker(): Promise<TesseractWorker> {
  worker ??= (async () => {
    // tesseract.js is CommonJS; depending on the bundler its API is the module or its default export.
    const module = (await import('tesseract.js')) as typeof import('tesseract.js') & { default?: typeof import('tesseract.js') };
    const { createWorker } = module.default ?? module;
    const lstmOnly = 1 as import('tesseract.js').OEM;
    return createWorker('eng', lstmOnly, {
      workerPath: '/vendor/tesseract/worker.min.js',
      corePath: '/vendor/tesseract/',
      langPath: '/vendor/tesseract/lang',
      workerBlobURL: false,
      gzip: true,
      logger: (message) => {
        if (message.status === 'recognizing text') listener?.('recognizing', message.progress);
        else if (message.status.startsWith('loading')) listener?.('model', message.progress);
      },
    });
  })();
  worker.catch(() => {
    worker = undefined;
  });
  return worker;
}

/** Recognises English text in an image, returning plain text and word boxes in its pixels. */
export async function recognize(image: HTMLCanvasElement | Blob, onProgress?: OcrProgress): Promise<OcrResult> {
  listener = onProgress;
  try {
    const tesseract = await getWorker();
    const { data } = await tesseract.recognize(image, {}, { text: true, blocks: true });
    const words: OcrWord[] = [];
    for (const block of data.blocks ?? []) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          for (const word of line.words) {
            const text = word.text.trim();
            if (!text) continue;
            words.push({
              text,
              x0: word.bbox.x0,
              x1: word.bbox.x1,
              top: line.bbox.y0,
              bottom: line.bbox.y1,
              baseline: baselineAt(line.baseline, (word.bbox.x0 + word.bbox.x1) / 2, line.bbox.y1),
            });
          }
        }
      }
    }
    return { text: data.text, words };
  } finally {
    listener = undefined;
  }
}

/** The line's baseline height at `x`; falls back to the line bottom when tesseract has none. */
function baselineAt(baseline: { x0: number; y0: number; x1: number; y1: number }, x: number, fallback: number): number {
  if (!baseline || baseline.x1 === baseline.x0) return fallback;
  const t = (x - baseline.x0) / (baseline.x1 - baseline.x0);
  const y = baseline.y0 + t * (baseline.y1 - baseline.y0);
  return Number.isFinite(y) ? y : fallback;
}

/** Frees the OCR worker (around 100 MB) when the tool goes away. */
export async function stopOcr(): Promise<void> {
  const current = worker;
  worker = undefined;
  if (current) await (await current).terminate();
}
