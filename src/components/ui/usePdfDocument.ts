import { useEffect, useState } from 'react';
import { closePdf, openPdf, type PDFDocumentProxy } from '../../lib/pdfjs';

export type PdfDocumentState =
  | { state: 'empty' }
  | { state: 'loading' }
  | { state: 'ready'; doc: PDFDocumentProxy; bytes: Uint8Array<ArrayBuffer> }
  | { state: 'error'; error: unknown };

/**
 * Opens `file` with pdf.js for previews, and keeps its bytes for running jobs.
 * The document is destroyed when the file changes or the component unmounts.
 */
export function usePdfDocument(file: File | undefined, password?: string): PdfDocumentState {
  const [result, setResult] = useState<PdfDocumentState>({ state: 'empty' });

  useEffect(() => {
    if (!file) {
      setResult({ state: 'empty' });
      return;
    }
    let cancelled = false;
    let doc: PDFDocumentProxy | undefined;
    setResult({ state: 'loading' });
    (async () => {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        doc = await openPdf(file.name, bytes, password);
        if (cancelled) {
          void closePdf(doc);
          return;
        }
        setResult({ state: 'ready', doc, bytes });
      } catch (error) {
        if (!cancelled) setResult({ state: 'error', error });
      }
    })();
    return () => {
      cancelled = true;
      if (doc) void closePdf(doc);
    };
  }, [file, password]);

  return result;
}

/** Reads a picked file into bytes for a worker job. */
export async function readBytes(file: File): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await file.arrayBuffer());
}
