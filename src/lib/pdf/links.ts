import { PDFArray, PDFContext, PDFDict, PDFDocument, PDFName, PDFPage, PDFRef } from '@cantoo/pdf-lib';
import { pageIndexByTag, resolvePageIndex, tryLookup } from './outlines';

/**
 * Fixes up Link annotations after `copyPages` has copied `destPages` from `source` at
 * `sourceIndices` (same order, same length — one destination page per source index).
 *
 * `copyPages` deep-copies whatever a page reaches, including the page a Link's `/Dest`
 * points to — but it copies that target *again*, as its own independent object, even
 * when the target is itself one of the pages being copied in this same call. The result
 * is a Link whose destination is always a stray, unreachable duplicate, never the real
 * page that ended up in the output. This resolves each Link's *original* target against
 * `source` before the copy (the same way `outlines.ts` resolves a bookmark's target), then
 * either repoints the copied Link at the real output page (target was kept) or drops the
 * annotation (target didn't make it into this output) — never leaves it pointing at the
 * orphan copy. Named destinations and cross-document (`GoToR`) links are left untouched,
 * same as `outlines.ts`: there's no way to tell whether those are dangling.
 */
export function fixupLinks(source: PDFDocument, sourceIndices: number[], destPages: PDFPage[]): void {
  const byTag = pageIndexByTag(source);
  const positionByIndex = new Map(sourceIndices.map((index, position) => [index, position]));
  const sourcePages = source.getPages();

  sourceIndices.forEach((sourceIndex, position) => {
    const originalAnnots = tryLookup(() => sourcePages[sourceIndex]!.node.lookupMaybe(PDFName.of('Annots'), PDFArray));
    const destPage = destPages[position]!;
    const destContext = destPage.doc.context;
    const copiedAnnots = tryLookup(() => destPage.node.lookupMaybe(PDFName.of('Annots'), PDFArray));
    if (!originalAnnots || !copiedAnnots) return;

    const surviving: PDFRef[] = [];
    let changed = false;
    for (let i = 0; i < copiedAnnots.size(); i++) {
      const copiedRef = copiedAnnots.get(i);
      const originalRef = originalAnnots.get(i);
      const verdict =
        copiedRef instanceof PDFRef && originalRef instanceof PDFRef
          ? planLink(sourcePages[sourceIndex]!.doc, originalRef, byTag, positionByIndex)
          : { action: 'keep' as const };

      if (verdict.action === 'drop') {
        changed = true;
        continue;
      }
      if (verdict.action === 'repoint' && copiedRef instanceof PDFRef) {
        changed = true;
        repointDest(destContext, copiedRef, destPages[verdict.position]!.ref);
      }
      if (copiedRef instanceof PDFRef) surviving.push(copiedRef);
    }
    if (changed) {
      if (surviving.length === 0) destPage.node.delete(PDFName.of('Annots'));
      else destPage.node.set(PDFName.of('Annots'), destContext.obj(surviving));
    }
  });
}

type LinkVerdict = { action: 'keep' } | { action: 'drop' } | { action: 'repoint'; position: number };

function planLink(
  source: PDFDocument,
  ref: PDFRef,
  byTag: Map<string, number>,
  positionByIndex: Map<number, number>,
): LinkVerdict {
  const dict = tryLookup(() => source.context.lookup(ref, PDFDict));
  if (!dict) return { action: 'keep' };
  const subtype = tryLookup(() => dict.lookupMaybe(PDFName.of('Subtype'), PDFName));
  if (subtype?.asString() !== '/Link') return { action: 'keep' };

  const targetIndex = resolvePageIndex(dict, byTag);
  if (targetIndex === undefined) return { action: 'keep' }; // named or cross-document — can't tell

  const position = positionByIndex.get(targetIndex);
  return position === undefined ? { action: 'drop' } : { action: 'repoint', position };
}

/** Rewrites a copied Link annotation's `/Dest[0]` (or `/A/D[0]`) to `newTarget`. */
function repointDest(context: PDFContext, ref: PDFRef, newTarget: PDFRef): void {
  const dict = tryLookup(() => context.lookup(ref, PDFDict));
  if (!dict) return;

  const direct = tryLookup(() => dict.lookupMaybe(PDFName.of('Dest'), PDFArray));
  if (direct && direct.size() > 0) {
    direct.set(0, newTarget);
    return;
  }

  const action = tryLookup(() => dict.lookupMaybe(PDFName.of('A'), PDFDict));
  const destArray = action && tryLookup(() => action.lookupMaybe(PDFName.of('D'), PDFArray));
  if (destArray && destArray.size() > 0) destArray.set(0, newTarget);
}
