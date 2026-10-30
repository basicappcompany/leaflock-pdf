import { PDFArray, PDFContext, PDFDict, PDFDocument, PDFName, PDFObject, PDFPage, PDFRef, PDFString } from '@cantoo/pdf-lib';

/**
 * `PDFDict.lookupMaybe`/`PDFContext.lookupMaybe` only return `undefined` for an absent
 * or null value — a value of the *wrong* type throws `UnexpectedObjectTypeError`
 * instead. A malformed PDF, or a perfectly valid one using a type we don't expect (a
 * named destination where we expected an array, say), hits that throw constantly, so
 * every type-checked lookup in this file goes through here instead of calling
 * `lookupMaybe` directly.
 */
export function tryLookup<T extends PDFObject>(get: () => T | undefined): T | undefined {
  try {
    return get();
  } catch {
    return undefined;
  }
}

/**
 * One bookmark, with its target page index within its own source document (not yet
 * remapped to a merged document) and any nested bookmarks. `pageIndex` is `undefined`
 * when the destination couldn't be resolved — a named destination, a cross-document
 * (`GoToR`) link, or a malformed entry — in which case the title and its children are
 * still kept, just not clickable, the way a pure "Part One" heading with no target of
 * its own would be.
 */
export interface OutlineNode {
  title: string;
  pageIndex: number | undefined;
  children: OutlineNode[];
}

/** Guards against a malformed or cyclic /Outlines tree; real documents never nest this deep. */
const MAX_OUTLINE_DEPTH = 64;

/**
 * Reads the bookmark tree of `source`, if it has one. Returns `[]` when there is no
 * `/Outlines` entry, it's empty, or it can't be parsed — never throws, since a missing
 * or malformed outline tree isn't a reason to fail the operation using this document.
 */
export function readOutline(source: PDFDocument): OutlineNode[] {
  const outlines = tryLookup(() => source.catalog.lookupMaybe(PDFName.of('Outlines'), PDFDict));
  const first = outlines && tryLookup(() => outlines.lookupMaybe(PDFName.of('First'), PDFDict));
  if (!first) return [];

  return readSiblings(first, pageIndexByTag(source), new Set(), 0);
}

/** A document's pages, keyed by ref tag, for resolving a `/Dest`'s target page index.
 * Also used by `links.ts` for the same purpose, on Link annotations rather than bookmarks. */
export function pageIndexByTag(source: PDFDocument): Map<string, number> {
  const byTag = new Map<string, number>();
  source.getPages().forEach((page, index) => byTag.set(page.ref.tag, index));
  return byTag;
}

function readSiblings(firstDict: PDFDict, byTag: Map<string, number>, visited: Set<PDFDict>, depth: number): OutlineNode[] {
  if (depth > MAX_OUTLINE_DEPTH) return [];

  const nodes: OutlineNode[] = [];
  let current: PDFDict | undefined = firstDict;
  while (current && !visited.has(current)) {
    visited.add(current);
    nodes.push(readNode(current, byTag, visited, depth));
    current = tryLookup(() => current!.lookupMaybe(PDFName.of('Next'), PDFDict));
  }
  return nodes;
}

function readNode(dict: PDFDict, byTag: Map<string, number>, visited: Set<PDFDict>, depth: number): OutlineNode {
  const title = tryLookup(() => dict.lookupMaybe(PDFName.of('Title'), PDFString))?.decodeText() ?? '';
  const pageIndex = resolvePageIndex(dict, byTag);
  const firstChild = tryLookup(() => dict.lookupMaybe(PDFName.of('First'), PDFDict));
  const children = firstChild ? readSiblings(firstChild, byTag, visited, depth + 1) : [];
  return { title, pageIndex, children };
}

/** Resolves a bookmark's (or, from `links.ts`, a Link annotation's) target page from
 * `/Dest`, or a `/GoTo` action's `/D`. Named destinations and `GoToR` (cross-document)
 * actions aren't supported yet. */
export function resolvePageIndex(dict: PDFDict, byTag: Map<string, number>): number | undefined {
  const destArray = findDestArray(dict);
  if (!destArray || destArray.size() === 0) return undefined;

  const target = destArray.get(0);
  if (!(target instanceof PDFRef)) return undefined; // named or inline destination — unsupported

  return byTag.get(target.tag);
}

/** Also used by `links.ts` to resolve a Link annotation's target the same way. */
export function findDestArray(dict: PDFDict): PDFArray | undefined {
  const direct = tryLookup(() => dict.lookupMaybe(PDFName.of('Dest'), PDFArray));
  if (direct) return direct;

  const action = tryLookup(() => dict.lookupMaybe(PDFName.of('A'), PDFDict));
  if (!action) return undefined;

  const isGoTo = tryLookup(() => action.lookupMaybe(PDFName.of('S'), PDFName))?.asString() === '/GoTo';
  if (!isGoTo) return undefined; // GoToR and other action types aren't supported yet

  return tryLookup(() => action.lookupMaybe(PDFName.of('D'), PDFArray));
}

/** One input document's contribution to a merge: its outline tree, and the pages it
 * became in the destination document, in source page order. */
export interface OutlineSection {
  nodes: OutlineNode[];
  pages: PDFPage[];
}

/**
 * Builds a merged `/Outlines` tree from each input's contribution and attaches it to
 * `dest`'s catalog. A no-op, leaving `dest` without an `/Outlines` entry, when every
 * section is empty — never worth writing a bookmark tree with nothing in it.
 */
export function writeOutline(dest: PDFDocument, sections: OutlineSection[]): void {
  const topLevel = sections.flatMap((section) => section.nodes.map((node) => ({ node, pages: section.pages })));
  if (topLevel.length === 0) return;

  const context = dest.context;
  const outlinesRef = context.register(PDFDict.fromMapWithContext(new Map(), context));
  const outlinesDict = context.lookup(outlinesRef, PDFDict);
  outlinesDict.set(PDFName.of('Type'), PDFName.of('Outlines'));

  const childRefs = topLevel.map(({ node, pages }) => buildNode(context, node, pages, outlinesRef));
  linkSiblings(context, outlinesDict, childRefs);

  dest.catalog.set(PDFName.of('Outlines'), outlinesRef);
}

function buildNode(context: PDFContext, node: OutlineNode, pages: PDFPage[], parentRef: PDFRef): PDFRef {
  const dict = new Map();
  dict.set(PDFName.of('Title'), PDFString.of(node.title));
  dict.set(PDFName.of('Parent'), parentRef);

  const targetPage = node.pageIndex !== undefined ? pages[node.pageIndex] : undefined;
  if (targetPage) {
    const dest = PDFArray.withContext(context);
    dest.push(targetPage.ref);
    dest.push(PDFName.of('Fit'));
    dict.set(PDFName.of('Dest'), dest);
  }

  const ref = context.register(PDFDict.fromMapWithContext(dict, context));

  if (node.children.length > 0) {
    const selfDict = context.lookup(ref, PDFDict);
    const childRefs = node.children.map((child) => buildNode(context, child, pages, ref));
    linkSiblings(context, selfDict, childRefs);
    selfDict.set(PDFName.of('Count'), context.obj(countDescendants(node.children)));
  }

  return ref;
}

function countDescendants(nodes: OutlineNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countDescendants(node.children), 0);
}

/** Wires `/First` and `/Last` on `parentDict`, and `/Next`/`/Prev` between consecutive refs. */
function linkSiblings(context: PDFContext, parentDict: PDFDict, refs: PDFRef[]): void {
  if (refs.length === 0) return;
  parentDict.set(PDFName.of('First'), refs[0]!);
  parentDict.set(PDFName.of('Last'), refs[refs.length - 1]!);

  refs.forEach((ref, index) => {
    const dict = context.lookup(ref, PDFDict);
    if (index > 0) dict.set(PDFName.of('Prev'), refs[index - 1]!);
    if (index < refs.length - 1) dict.set(PDFName.of('Next'), refs[index + 1]!);
  });
}
