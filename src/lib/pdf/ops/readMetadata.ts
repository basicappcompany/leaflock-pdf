import { PDFName } from '@cantoo/pdf-lib';
import { loadPdf, type PdfInput } from '../load';
import { readMetadata as readFrom, type DocMetadata } from '../metadata';
import type { OpContext } from '../types';

export interface ReadMetadataArgs {
  input: PdfInput;
}

export interface ReadMetadataResult {
  values: DocMetadata;
  /** Whether the file also carries an XMP packet, which some readers show in preference
   * to these fields. Editing removes it, so the two can never disagree. */
  hasXmp: boolean;
}

/** Reads the document properties a PDF carries, so the editor can show them. */
export async function readMetadata({ input }: ReadMetadataArgs, _ctx: OpContext): Promise<ReadMetadataResult> {
  const doc = await loadPdf(input);
  return {
    values: readFrom(doc),
    hasXmp: doc.catalog.has(PDFName.of('Metadata')),
  };
}
