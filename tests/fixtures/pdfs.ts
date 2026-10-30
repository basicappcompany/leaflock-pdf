import { PDFArray, PDFDict, PDFDocument, PDFName, PDFString, StandardFonts } from '@cantoo/pdf-lib';

/**
 * Builds a PDF whose pages have distinctive sizes, so tests can tell which
 * source page ended up where. Each page is `[width, height]` in points.
 */
export async function makePdf(
  pageSizes: readonly [number, number][],
  security?: { userPassword?: string; ownerPassword: string },
): Promise<Uint8Array<ArrayBuffer>> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  pageSizes.forEach(([width, height], index) => {
    const page = doc.addPage([width, height]);
    page.drawText(`Page ${index + 1}`, { x: 20, y: height / 2, size: 18, font });
  });
  if (security) doc.encrypt(security);
  return (await doc.save()) as Uint8Array<ArrayBuffer>;
}

/** A bookmark to hand-write into a test fixture's `/Outlines` tree. */
export interface FixtureBookmark {
  title: string;
  pageIndex: number;
  children?: FixtureBookmark[];
}

/**
 * Builds a PDF the same way `makePdf` does, then hand-writes a `/Outlines` tree onto it
 * at the raw object level — the same technique `src/lib/pdf/outlines.ts` reads and
 * writes — so tests exercise the real PDF structure rather than our own round-trip.
 */
export async function makePdfWithBookmarks(
  pageSizes: readonly [number, number][],
  bookmarks: FixtureBookmark[],
): Promise<Uint8Array<ArrayBuffer>> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = pageSizes.map(([width, height], index) => {
    const page = doc.addPage([width, height]);
    page.drawText(`Page ${index + 1}`, { x: 20, y: height / 2, size: 18, font });
    return page;
  });

  const context = doc.context;
  const outlinesRef = context.register(PDFDict.fromMapWithContext(new Map(), context));
  const outlinesDict = context.lookup(outlinesRef, PDFDict);
  outlinesDict.set(PDFName.of('Type'), PDFName.of('Outlines'));

  function buildNode(bookmark: FixtureBookmark, parentRef: typeof outlinesRef): typeof outlinesRef {
    const dict = new Map();
    dict.set(PDFName.of('Title'), PDFString.of(bookmark.title));
    dict.set(PDFName.of('Parent'), parentRef);
    const dest = PDFArray.withContext(context);
    dest.push(pages[bookmark.pageIndex]!.ref);
    dest.push(PDFName.of('Fit'));
    dict.set(PDFName.of('Dest'), dest);

    const ref = context.register(PDFDict.fromMapWithContext(dict, context));
    const children = bookmark.children ?? [];
    if (children.length > 0) {
      const selfDict = context.lookup(ref, PDFDict);
      const childRefs = children.map((child) => buildNode(child, ref));
      selfDict.set(PDFName.of('First'), childRefs[0]!);
      selfDict.set(PDFName.of('Last'), childRefs[childRefs.length - 1]!);
      childRefs.forEach((childRef, i) => {
        const childDict = context.lookup(childRef, PDFDict);
        if (i > 0) childDict.set(PDFName.of('Prev'), childRefs[i - 1]!);
        if (i < childRefs.length - 1) childDict.set(PDFName.of('Next'), childRefs[i + 1]!);
      });
    }
    return ref;
  }

  const topRefs = bookmarks.map((bookmark) => buildNode(bookmark, outlinesRef));
  if (topRefs.length > 0) {
    outlinesDict.set(PDFName.of('First'), topRefs[0]!);
    outlinesDict.set(PDFName.of('Last'), topRefs[topRefs.length - 1]!);
    topRefs.forEach((ref, i) => {
      const dict = context.lookup(ref, PDFDict);
      if (i > 0) dict.set(PDFName.of('Prev'), topRefs[i - 1]!);
      if (i < topRefs.length - 1) dict.set(PDFName.of('Next'), topRefs[i + 1]!);
    });
  }
  doc.catalog.set(PDFName.of('Outlines'), outlinesRef);

  return (await doc.save()) as Uint8Array<ArrayBuffer>;
}

/** Builds a PDF the same way `makePdf` does, plus a title/author and a text field on its
 * first page — real ones, made through pdf-lib's own form API, not hand-written. */
export async function makePdfWithFormField(
  pageSizes: readonly [number, number][],
  fieldName: string,
  value: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = pageSizes.map(([width, height], index) => {
    const page = doc.addPage([width, height]);
    page.drawText(`Page ${index + 1}`, { x: 20, y: height / 2, size: 18, font });
    return page;
  });

  const field = doc.getForm().createTextField(fieldName);
  field.setText(value);
  field.addToPage(pages[0]!, { x: 10, y: 10, width: 100, height: 20 });

  doc.setTitle(`Title of ${fieldName}`);
  doc.setAuthor('Fixture Author');

  return (await doc.save()) as Uint8Array<ArrayBuffer>;
}

/** Builds a PDF the same way `makePdf` does, with a Link annotation on `fromPageIndex`
 * whose destination is `toPageIndex` — hand-written at the raw object level like
 * `makePdfWithBookmarks`, since pdf-lib has no link-annotation API of its own. */
export async function makePdfWithLink(
  pageSizes: readonly [number, number][],
  fromPageIndex: number,
  toPageIndex: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = pageSizes.map(([width, height], index) => {
    const page = doc.addPage([width, height]);
    page.drawText(`Page ${index + 1}`, { x: 20, y: height / 2, size: 18, font });
    return page;
  });

  const context = doc.context;
  const annotDict = new Map();
  annotDict.set(PDFName.of('Subtype'), PDFName.of('Link'));
  annotDict.set(PDFName.of('Rect'), context.obj([0, 0, 50, 50]));
  const dest = PDFArray.withContext(context);
  dest.push(pages[toPageIndex]!.ref);
  dest.push(PDFName.of('Fit'));
  annotDict.set(PDFName.of('Dest'), dest);
  const annotRef = context.register(PDFDict.fromMapWithContext(annotDict, context));
  pages[fromPageIndex]!.node.set(PDFName.of('Annots'), context.obj([annotRef]));

  return (await doc.save()) as Uint8Array<ArrayBuffer>;
}

/** Page sizes of a PDF, in order, rounded to whole points. */
export async function pageSizesOf(bytes: Uint8Array): Promise<[number, number][]> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((page) => {
    const { width, height } = page.getSize();
    return [Math.round(width), Math.round(height)];
  });
}
