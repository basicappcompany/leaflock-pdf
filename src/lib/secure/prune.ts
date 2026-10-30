import { PDFArray, PDFDict, PDFRef, PDFStream, type PDFDocument, type PDFObject } from '@cantoo/pdf-lib';

/**
 * Deletes every indirect object that can't be reached from the trailer.
 *
 * pdf-lib keeps whatever it parsed, including objects the document no longer uses:
 * old cross-reference streams, a removed /Encrypt dictionary, images nobody draws.
 * Writing them wastes space and, after unlocking, leaves the old encryption
 * dictionary lying around in the file. Returns how many objects were removed.
 */
export function pruneUnreachableObjects(doc: PDFDocument): number {
  const { context } = doc;
  const reachable = new Set<string>();
  const queue: PDFObject[] = [];
  const { Root, Info, Encrypt } = context.trailerInfo;
  for (const start of [Root, Info, Encrypt]) if (start) queue.push(start);

  while (queue.length > 0) {
    const object = queue.pop()!;
    if (object instanceof PDFRef) {
      const key = object.toString();
      if (reachable.has(key)) continue;
      reachable.add(key);
      const target = context.lookup(object);
      if (target) queue.push(target);
    } else if (object instanceof PDFDict) {
      queue.push(...object.values());
    } else if (object instanceof PDFArray) {
      queue.push(...object.asArray());
    } else if (object instanceof PDFStream) {
      queue.push(...object.dict.values());
    }
  }

  let removed = 0;
  for (const [ref] of context.enumerateIndirectObjects()) {
    if (!reachable.has(ref.toString())) {
      context.delete(ref);
      removed++;
    }
  }
  return removed;
}
