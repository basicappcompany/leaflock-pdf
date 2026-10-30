import { EncryptedPDFError, PDFDocument } from '@cantoo/pdf-lib';
import { ToolError } from '../errors';
import { loadPdf, markProduced, PdfInputError, type PdfInput } from '../load';
import { pruneUnreachableObjects } from '../../secure/prune';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface UnlockArgs {
  input: PdfInput;
  /** Omit to try without one: files that only restrict printing or copying open with an empty password. */
  password?: string;
  outputName: string;
}

export interface UnlockResult {
  file: OutputFile;
  /** True when the file only had restrictions (no password was needed to open it). */
  restrictionsOnly: boolean;
}

/**
 * Removes a PDF's encryption. ToolError codes: 'not-encrypted' (nothing to do),
 * 'needs-password' (no password given, and the file can't be opened without one).
 */
export async function unlock({ input, password, outputName }: UnlockArgs, _ctx: OpContext): Promise<UnlockResult> {
  if (!(await isEncrypted(input))) throw new ToolError('not-encrypted', { name: input.name });

  let restrictionsOnly = false;
  let doc: PDFDocument;
  if (!password) {
    try {
      doc = await loadPdf(input, { password: '' });
      restrictionsOnly = true;
    } catch (error) {
      if (error instanceof PdfInputError && error.problem === 'wrong-password') {
        throw new ToolError('needs-password', { name: input.name });
      }
      throw error;
    }
  } else {
    try {
      doc = await loadPdf(input, { password });
    } catch (error) {
      // The typed password may be wrong while the file has no open password at all.
      if (error instanceof PdfInputError && error.problem === 'wrong-password') {
        doc = await loadPdf(input, { password: '' }).catch(() => {
          throw error;
        });
        restrictionsOnly = true;
      } else {
        throw error;
      }
    }
  }

  // Once decrypted, pdf-lib drops /Encrypt from the trailer. The old encryption dictionary and
  // cross-reference streams are still parsed objects, though, so prune them before saving.
  pruneUnreachableObjects(doc);
  markProduced(doc);
  return { file: pdfFile(outputName, await doc.save({ rewrite: true })), restrictionsOnly };
}

async function isEncrypted(input: PdfInput): Promise<boolean> {
  try {
    await PDFDocument.load(input.bytes, { updateMetadata: false });
    return false;
  } catch (error) {
    if (error instanceof EncryptedPDFError) return true;
    throw new PdfInputError(input.name, 'not-a-pdf', { cause: error });
  }
}
