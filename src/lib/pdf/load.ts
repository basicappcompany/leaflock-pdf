import { EncryptedPDFError, PDFDocument, type LoadOptions } from '@cantoo/pdf-lib';
import { PdfInputError } from './inputError';

// Re-exported so the worker-side callers that already do
// `import { loadPdf, PdfInputError } from '../load'` (ops/repair.ts, ops/unlock.ts,
// pdf.worker.ts, the unit tests) need no change. Main-thread code should import these
// from inputError.ts directly instead — see that file for why.
export { PdfInputError, type PdfInputProblem } from './inputError';

export interface PdfInput {
  name: string;
  bytes: Uint8Array;
}

/**
 * Loads a PDF the user picked.
 *
 * Without a password, many PDFs are encrypted with an empty user password purely to
 * restrict editing; those open fine in any viewer, so we retry with an empty password.
 * With a password (Unlock), a wrong one is reported as such.
 */
export async function loadPdf(
  input: PdfInput,
  options: { password?: string } & Pick<LoadOptions, 'throwOnInvalidObject'> = {},
): Promise<PDFDocument> {
  const { password, ...rest } = options;
  const base: LoadOptions = { updateMetadata: false, ...rest };

  if (password !== undefined) {
    try {
      return await PDFDocument.load(input.bytes, { ...base, password });
    } catch (error) {
      if (error instanceof EncryptedPDFError || isWrongPassword(error)) {
        throw new PdfInputError(input.name, 'wrong-password', { cause: error });
      }
      throw new PdfInputError(input.name, 'not-a-pdf', { cause: error });
    }
  }

  try {
    return await PDFDocument.load(input.bytes, base);
  } catch (error) {
    if (!(error instanceof EncryptedPDFError)) {
      throw new PdfInputError(input.name, 'not-a-pdf', { cause: error });
    }
  }
  try {
    return await PDFDocument.load(input.bytes, { ...base, password: '' });
  } catch (error) {
    throw new PdfInputError(input.name, 'password-protected', { cause: error });
  }
}

function isWrongPassword(error: unknown): boolean {
  return error instanceof Error && /password/i.test(error.message);
}

/** Stamps our name on a document we produced. */
export function markProduced(doc: PDFDocument): void {
  doc.setProducer('LeafLock PDF');
  doc.setCreator('LeafLock PDF');
}
