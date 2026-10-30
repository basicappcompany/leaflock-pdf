import { PDFArray, PDFDict, PDFDocument, PDFName, PDFString, StandardFonts } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { readOutline, writeOutline } from '../../src/lib/pdf/outlines';
import { makePdf, makePdfWithBookmarks } from '../fixtures/pdfs';

describe('readOutline', () => {
  it('returns [] for a document with no /Outlines entry', async () => {
    const doc = await PDFDocument.load(await makePdf([[200, 300]]));
    expect(readOutline(doc)).toEqual([]);
  });

  it('does not loop forever on a cyclic /Next chain', async () => {
    const bytes = await makePdfWithBookmarks([[200, 300]], [{ title: 'A', pageIndex: 0 }]);
    const doc = await PDFDocument.load(bytes);

    // Point the one bookmark's /Next back at itself, simulating a malformed PDF.
    const outlines = doc.catalog.lookupMaybe(PDFName.of('Outlines'), PDFDict)!;
    const firstRef = doc.context.getRef(outlines.lookupMaybe(PDFName.of('First'), PDFDict)!)!;
    const first = doc.context.lookup(firstRef, PDFDict);
    first.set(PDFName.of('Next'), firstRef);

    expect(() => readOutline(doc)).not.toThrow();
    expect(readOutline(doc)).toEqual([{ title: 'A', pageIndex: 0, children: [] }]);
  });

  it('resolves a /GoTo action the same way as a direct /Dest', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([200, 300]);
    page.drawText('Page 1', { x: 20, y: 150, size: 18, font });

    const context = doc.context;
    const outlinesRef = context.register(PDFDict.fromMapWithContext(new Map(), context));
    const outlinesDict = context.lookup(outlinesRef, PDFDict);
    outlinesDict.set(PDFName.of('Type'), PDFName.of('Outlines'));

    const dest = PDFArray.withContext(context);
    dest.push(page.ref);
    dest.push(PDFName.of('Fit'));
    const action = new Map();
    action.set(PDFName.of('S'), PDFName.of('GoTo'));
    action.set(PDFName.of('D'), dest);

    const itemDict = new Map();
    itemDict.set(PDFName.of('Title'), PDFString.of('Via action'));
    itemDict.set(PDFName.of('Parent'), outlinesRef);
    itemDict.set(PDFName.of('A'), PDFDict.fromMapWithContext(action, context));
    const itemRef = context.register(PDFDict.fromMapWithContext(itemDict, context));
    outlinesDict.set(PDFName.of('First'), itemRef);
    outlinesDict.set(PDFName.of('Last'), itemRef);
    doc.catalog.set(PDFName.of('Outlines'), outlinesRef);

    expect(readOutline(doc)).toEqual([{ title: 'Via action', pageIndex: 0, children: [] }]);
  });

  it('keeps a bookmark with an unresolvable destination, without a page to jump to', async () => {
    const doc = await PDFDocument.create();
    const context = doc.context;
    const outlinesRef = context.register(PDFDict.fromMapWithContext(new Map(), context));
    const outlinesDict = context.lookup(outlinesRef, PDFDict);

    // A named destination (just a PDFName, not an array) — unsupported, but the title survives.
    const itemDict = new Map();
    itemDict.set(PDFName.of('Title'), PDFString.of('Named dest'));
    itemDict.set(PDFName.of('Parent'), outlinesRef);
    itemDict.set(PDFName.of('Dest'), PDFName.of('chapter1'));
    const itemRef = context.register(PDFDict.fromMapWithContext(itemDict, context));
    outlinesDict.set(PDFName.of('First'), itemRef);
    outlinesDict.set(PDFName.of('Last'), itemRef);
    doc.catalog.set(PDFName.of('Outlines'), outlinesRef);

    expect(readOutline(doc)).toEqual([{ title: 'Named dest', pageIndex: undefined, children: [] }]);
  });
});

describe('writeOutline', () => {
  it('leaves the catalog without an /Outlines entry when every section is empty', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 300]);
    writeOutline(doc, [{ nodes: [], pages: [page] }]);
    expect(doc.catalog.lookupMaybe(PDFName.of('Outlines'), PDFDict)).toBeUndefined();
  });
});
