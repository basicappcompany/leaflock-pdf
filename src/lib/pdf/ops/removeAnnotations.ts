import { PDFArray, PDFDict, PDFName, PDFRef, type PDFDocument, type PDFPage } from '@cantoo/pdf-lib';
import { pruneUnreachableObjects } from '../../secure/prune';
import { ToolError } from '../errors';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { tryLookup } from '../outlines';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface RemoveAnnotationsArgs {
  input: PdfInput;
  /** Also remove clickable links. Off by default: a link is navigation, not markup. */
  links: boolean;
  outputName: string;
}

export interface RemoveAnnotationsResult {
  file: OutputFile;
  /** Comments, highlights, stamps and drawings removed. */
  annotations: number;
  /** Links removed — zero unless `links`. */
  links: number;
  /** Pages that had something removed. */
  pages: number;
}

/**
 * Removes comments and markup outright, as opposed to Flatten PDF, which paints them into
 * the page first. Form fields (`Widget`) always stay — emptying a form is Flatten's job,
 * and silently deleting someone's fillable fields here would be a surprise. Links stay
 * unless asked for, since a link is navigation rather than markup.
 *
 * `ToolError 'no-annotations'` when there is nothing to remove.
 */
export async function removeAnnotations(
  { input, links, outputName }: RemoveAnnotationsArgs,
  ctx: OpContext,
): Promise<RemoveAnnotationsResult> {
  const doc = await loadPdf(input);

  let annotations = 0;
  let removedLinks = 0;
  let pages = 0;

  const allPages = doc.getPages();
  for (const [index, page] of allPages.entries()) {
    const removed = stripPage(doc, page, links);
    annotations += removed.annotations;
    removedLinks += removed.links;
    if (removed.annotations > 0 || removed.links > 0) pages++;
    ctx.progress((index + 1) / allPages.length);
  }

  if (annotations === 0 && removedLinks === 0) {
    throw new ToolError('no-annotations', { name: input.name });
  }

  // The annotation dictionaries are unreachable now, but their bytes (and their appearance
  // streams, which can be the bulk of a marked-up file) are still written without this.
  pruneUnreachableObjects(doc);
  markProduced(doc);

  return {
    file: pdfFile(outputName, await doc.save({ rewrite: true })),
    annotations,
    links: removedLinks,
    pages,
  };
}

function stripPage(doc: PDFDocument, page: PDFPage, removeLinks: boolean): { annotations: number; links: number } {
  const annots = tryLookup(() => page.node.lookupMaybe(PDFName.of('Annots'), PDFArray));
  if (!annots) return { annotations: 0, links: 0 };

  const surviving: PDFRef[] = [];
  let annotations = 0;
  let links = 0;

  for (let i = 0; i < annots.size(); i++) {
    const ref = annots.get(i);
    if (!(ref instanceof PDFRef)) continue;
    const annot = tryLookup(() => doc.context.lookup(ref, PDFDict));
    const subtype = annot && tryLookup(() => annot.lookupMaybe(PDFName.of('Subtype'), PDFName))?.decodeText();

    if (subtype === 'Widget') {
      surviving.push(ref);
      continue;
    }
    if (subtype === 'Link') {
      if (removeLinks) links++;
      else surviving.push(ref);
      continue;
    }
    // Popups carry a comment's text and are counted with the comment they belong to.
    if (subtype !== 'Popup') annotations++;
  }

  if (surviving.length !== annots.size()) {
    if (surviving.length === 0) page.node.delete(PDFName.of('Annots'));
    else page.node.set(PDFName.of('Annots'), doc.context.obj(surviving));
  }
  return { annotations, links };
}
