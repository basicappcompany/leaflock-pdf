import { PDFName } from '@cantoo/pdf-lib';
import { pruneUnreachableObjects } from '../../secure/prune';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { applyMetadata, type DocMetadata } from '../metadata';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface EditMetadataArgs {
  input: PdfInput;
  values: DocMetadata;
  outputName: string;
}

export interface EditMetadataResult {
  file: OutputFile;
  /** Whether a stale XMP copy of these fields was dropped. */
  removedXmp: boolean;
}

/**
 * Writes the document properties someone typed, clearing any they left empty.
 *
 * A PDF can state the same thing twice — once in the Info dictionary and once in an XMP
 * packet — and readers disagree about which wins, so editing only one leaves a file that
 * shows the old author in some viewers and the new one in others. The XMP copy is
 * therefore removed rather than left to contradict what was just typed.
 */
export async function editMetadata(
  { input, values, outputName }: EditMetadataArgs,
  _ctx: OpContext,
): Promise<EditMetadataResult> {
  const doc = await loadPdf(input);

  applyMetadata(doc, values);

  const removedXmp = doc.catalog.has(PDFName.of('Metadata'));
  doc.catalog.delete(PDFName.of('Metadata'));
  // Unlinking the packet does not remove its bytes; see docs/design.md §5a.
  if (removedXmp) pruneUnreachableObjects(doc);

  markProduced(doc);
  return { file: pdfFile(outputName, await doc.save({ rewrite: true })), removedXmp };
}
