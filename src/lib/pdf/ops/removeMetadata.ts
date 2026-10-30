import { PDFArray, PDFDict, PDFName, PDFRef, type PDFDocument, type PDFPage } from '@cantoo/pdf-lib';
import { pruneUnreachableObjects } from '../../secure/prune';
import { ToolError } from '../errors';
import { loadPdf, type PdfInput } from '../load';
import { tryLookup } from '../outlines';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface RemoveMetadataArgs {
  input: PdfInput;
  /** Also strip JavaScript, embedded files, and actions that run on open. */
  activeContent: boolean;
  outputName: string;
}

export interface RemoveMetadataResult {
  file: OutputFile;
  /** Info-dictionary entries removed: title, author, producer, creation date and the rest. */
  infoFields: number;
  /** Whether the file carried an XMP packet. */
  xmp: boolean;
  /** Whether the trailer carried an `/ID`, which links copies of one document together. */
  documentId: boolean;
  /** Pages that carried editing leftovers (`/PieceInfo`, `/LastModified`, page-level XMP). */
  pages: number;
  /** JavaScript, embedded files and actions removed — zero unless `activeContent`. */
  activeItems: number;
}

/** Annotations whose purpose is to carry a payload — a file, a movie, a script target — rather
 * than to mark up the page. Comments and highlights are not touched: that is Remove annotations. */
const payloadAnnotations = new Set(['FileAttachment', 'Screen', 'Movie', 'RichMedia']);

/** Actions that make a document *do* something rather than show something. */
const executableActions = new Set(['/Launch', '/JavaScript', '/SubmitForm', '/ImportData']);

/** Name trees holding active content. `/Dests` deliberately stays — named destinations are
 * what bookmarks and links point at (`outlines.ts`), so dropping it would break navigation. */
const activeNameTrees = ['JavaScript', 'EmbeddedFiles'];

/** Page entries that record who edited the file and when, left behind by editing software. */
const pageLeftovers = ['PieceInfo', 'LastModified', 'Metadata'];

/**
 * Strips the identifying data a PDF carries outside its visible content: the Info
 * dictionary, the XMP packet, the document `/ID`, and the per-page leftovers editors
 * leave behind. Optionally also removes active content (JavaScript, embedded files,
 * open actions).
 *
 * Deliberately does **not** call `markProduced`. Every other operation stamps
 * `Producer`/`Creator` with our name; doing it here would write new metadata into a file
 * the user asked to have metadata removed from, and would tell anyone who inspects the
 * file which tool they used. The tool page states that we add nothing, which is checkable
 * in any metadata viewer — so it has to stay true.
 *
 * `ToolError 'no-metadata'` when there was nothing to remove.
 */
export async function removeMetadata(
  { input, activeContent, outputName }: RemoveMetadataArgs,
  ctx: OpContext,
): Promise<RemoveMetadataResult> {
  const doc = await loadPdf(input);

  const infoFields = clearInfoDict(doc);

  const xmp = doc.catalog.has(PDFName.of('Metadata'));
  doc.catalog.delete(PDFName.of('Metadata'));

  const documentId = doc.context.trailerInfo.ID !== undefined;
  delete doc.context.trailerInfo.ID;

  doc.catalog.delete(PDFName.of('PieceInfo'));

  let activeItems = activeContent ? clearDocumentActions(doc) : 0;

  let pages = 0;
  const allPages = doc.getPages();
  for (const [index, page] of allPages.entries()) {
    if (clearPageLeftovers(page)) pages++;
    if (activeContent) activeItems += clearPageActions(doc, page);
    ctx.progress((index + 1) / allPages.length);
  }

  if (infoFields === 0 && !xmp && !documentId && pages === 0 && activeItems === 0) {
    throw new ToolError('no-metadata', { name: input.name });
  }

  // Unlinking the XMP stream from the catalog does not remove its bytes — pdf-lib writes
  // every object it parsed, so the packet would still be readable in the output. Removing
  // metadata has to mean removing it from the file, not just from the page tree.
  pruneUnreachableObjects(doc);

  return {
    file: pdfFile(outputName, await doc.save({ rewrite: true })),
    infoFields,
    xmp,
    documentId,
    pages,
    activeItems,
  };
}

/** Empties the Info dictionary in place, returning how many entries it held. Deleting the
 * keys rather than the dictionary matters: an orphaned dictionary keeps its bytes. */
function clearInfoDict(doc: PDFDocument): number {
  const ref = doc.context.trailerInfo.Info;
  const info = ref && tryLookup(() => doc.context.lookup(ref, PDFDict));
  if (!info) return 0;

  const keys = info.keys();
  for (const key of keys) info.delete(key);
  return keys.length;
}

function clearPageLeftovers(page: PDFPage): boolean {
  let found = false;
  for (const key of pageLeftovers) {
    const name = PDFName.of(key);
    if (!page.node.has(name)) continue;
    page.node.delete(name);
    found = true;
  }
  return found;
}

function clearDocumentActions(doc: PDFDocument): number {
  let removed = 0;

  for (const key of ['OpenAction', 'AA']) {
    const name = PDFName.of(key);
    if (doc.catalog.has(name)) {
      doc.catalog.delete(name);
      removed++;
    }
  }

  const names = tryLookup(() => doc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict));
  if (names) {
    for (const key of activeNameTrees) {
      const name = PDFName.of(key);
      if (!names.has(name)) continue;
      names.delete(name);
      removed++;
    }
  }

  return removed;
}

function clearPageActions(doc: PDFDocument, page: PDFPage): number {
  let removed = 0;

  if (page.node.has(PDFName.of('AA'))) {
    page.node.delete(PDFName.of('AA'));
    removed++;
  }

  const annots = tryLookup(() => page.node.lookupMaybe(PDFName.of('Annots'), PDFArray));
  if (!annots) return removed;

  const surviving: PDFRef[] = [];
  for (let i = 0; i < annots.size(); i++) {
    const ref = annots.get(i);
    if (!(ref instanceof PDFRef)) continue;
    const annot = tryLookup(() => doc.context.lookup(ref, PDFDict));
    if (!annot) {
      surviving.push(ref);
      continue;
    }

    const subtype = tryLookup(() => annot.lookupMaybe(PDFName.of('Subtype'), PDFName))?.decodeText() ?? '';
    if (payloadAnnotations.has(subtype)) {
      removed++;
      continue;
    }

    // An ordinary-looking link can still carry a Launch or JavaScript action. Dropping the
    // action leaves the annotation's appearance alone and takes away only what it executes.
    const action = tryLookup(() => annot.lookupMaybe(PDFName.of('A'), PDFDict));
    const kind = action && tryLookup(() => action.lookupMaybe(PDFName.of('S'), PDFName))?.asString();
    if (kind && executableActions.has(kind)) {
      annot.delete(PDFName.of('A'));
      removed++;
    }
    surviving.push(ref);
  }

  if (surviving.length !== annots.size()) {
    if (surviving.length === 0) page.node.delete(PDFName.of('Annots'));
    else page.node.set(PDFName.of('Annots'), doc.context.obj(surviving));
  }
  return removed;
}
