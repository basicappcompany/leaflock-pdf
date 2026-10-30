import { PDFArray, PDFBool, PDFDict, PDFDocument, PDFName, PDFPage, PDFRef } from '@cantoo/pdf-lib';
import { tryLookup } from './outlines';

/** Guards against a malformed or cyclic field hierarchy; real forms never nest this deep. */
const MAX_FIELD_DEPTH = 64;

/**
 * Finds the root field of each Widget annotation already present on `pages` — pdf-lib's
 * `copyPages` copies widget annotations for free (they're reachable from the page), but
 * never copies the `/AcroForm` catalog entry that lists them as fields, so a copied form
 * has working-looking boxes on the page with no field behind them. This walks each
 * widget's `/Parent` chain to the field that owns it (itself, for a field that is its own
 * widget) and returns the unique set, in page order, ready to become `/AcroForm /Fields`.
 */
export function collectFieldRefs(pages: PDFPage[]): PDFRef[] {
  const refs: PDFRef[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    const context = page.doc.context;
    const annots = tryLookup(() => page.node.lookupMaybe(PDFName.of('Annots'), PDFArray));
    if (!annots) continue;

    for (let i = 0; i < annots.size(); i++) {
      const ref = annots.get(i);
      if (!(ref instanceof PDFRef)) continue;
      const dict = tryLookup(() => context.lookup(ref, PDFDict));
      if (!dict) continue;
      const subtype = tryLookup(() => dict.lookupMaybe(PDFName.of('Subtype'), PDFName));
      if (subtype?.asString() !== '/Widget') continue;

      const rootRef = walkToRoot(ref, dict, context);
      if (!seen.has(rootRef.tag)) {
        seen.add(rootRef.tag);
        refs.push(rootRef);
      }
    }
  }

  return refs;
}

function walkToRoot(ref: PDFRef, dict: PDFDict, context: PDFPage['doc']['context']): PDFRef {
  let currentRef = ref;
  let currentDict = dict;
  for (let depth = 0; depth < MAX_FIELD_DEPTH; depth++) {
    const parentRef = currentDict.get(PDFName.of('Parent'));
    if (!(parentRef instanceof PDFRef)) return currentRef;
    const parentDict = tryLookup(() => context.lookup(parentRef, PDFDict));
    if (!parentDict) return currentRef;
    currentRef = parentRef;
    currentDict = parentDict;
  }
  return currentRef;
}

/** Whether `source`'s form asked viewers to render field appearances themselves. */
export function readNeedAppearances(source: PDFDocument): boolean {
  const acroForm = tryLookup(() => source.catalog.lookupMaybe(PDFName.of('AcroForm'), PDFDict));
  const flag = acroForm && tryLookup(() => acroForm.lookupMaybe(PDFName.of('NeedAppearances'), PDFBool));
  return flag?.asBoolean() ?? false;
}

/**
 * Attaches an `/AcroForm` to `dest` listing `fieldRefs` — already-copied field/widget
 * objects found by `collectFieldRefs` — so the form pdf-lib (and every other reader)
 * recognises survives the copy. A no-op when there are no fields.
 *
 * Known limitation, same spirit as `outlines.ts`: fields from different inputs that
 * happen to share a name aren't renamed, so a merge of two forms with a field called
 * `name` leaves two same-named fields rather than disambiguating them.
 */
export function writeAcroForm(dest: PDFDocument, fieldRefs: PDFRef[], needAppearances: boolean): void {
  if (fieldRefs.length === 0) return;

  const context = dest.context;
  const acroFormRef = context.register(PDFDict.fromMapWithContext(new Map(), context));
  const acroFormDict = context.lookup(acroFormRef, PDFDict);
  acroFormDict.set(PDFName.of('Fields'), context.obj(fieldRefs));
  if (needAppearances) acroFormDict.set(PDFName.of('NeedAppearances'), PDFBool.True);

  dest.catalog.set(PDFName.of('AcroForm'), acroFormRef);
}
