import { EncryptedPDFError, PDFArray, PDFDict, PDFDocument, PDFName, PDFRef, PDFString } from '@cantoo/pdf-lib';
import { loadPdf, markProduced, PdfInputError, type PdfInput } from '../load';
import { readMetadata } from '../metadata';
import { tryLookup } from '../outlines';
import { buildPdfaXmpPacket } from '../pdfa/xmp';
import { buildSrgbIccProfile } from '../pdfa/srgbIcc';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface PdfToPdfAArgs {
  input: PdfInput;
  outputName: string;
}

export interface PdfToPdfAResult {
  file: OutputFile;
  /** JavaScript, open actions and embedded-file entries removed — all forbidden by PDF/A. */
  activeContentRemoved: number;
  /** Fonts this document references without embedding them. Empty means every font is
   * embedded, which is the one PDF/A requirement this tool cannot fix on its own —
   * see the tool's own FAQ for why. */
  nonEmbeddedFonts: string[];
}

const name = (value: string) => PDFName.of(value);

/**
 * Converts a PDF toward PDF/A-2b: adds the sRGB output intent and PDF/A identification
 * XMP every validator checks first, and removes what the standard forbids outright
 * (JavaScript, actions that run on open, embedded files). Deliberately does not
 * re-embed a font it was never given — see `nonEmbeddedFonts` on the result, and the
 * tool's own stated limit, same honesty as Office → PDF's dropped tables.
 *
 * Rejects any encrypted input — including a restriction-only file that other tools
 * open with an empty password, the common `PdfInputError('password-protected')` path
 * (so the UI's existing "Unlock it first" message applies unchanged): PDF/A forbids
 * encryption outright, so this has to be stricter than `loadPdf`'s usual leniency.
 */
export async function pdfToPdfA({ input, outputName }: PdfToPdfAArgs, _ctx: OpContext): Promise<PdfToPdfAResult> {
  if (await isEncrypted(input)) throw new PdfInputError(input.name, 'password-protected');

  const doc = await loadPdf(input);
  const metadata = readMetadata(doc);

  const activeContentRemoved = removeActiveContent(doc);
  const nonEmbeddedFonts = listNonEmbeddedFonts(doc);

  const iccRef = doc.context.register(doc.context.flateStream(buildSrgbIccProfile(), { N: 3, Alternate: 'DeviceRGB' }));
  const outputIntent = doc.context.obj({
    Type: 'OutputIntent',
    S: 'GTS_PDFA1',
    OutputConditionIdentifier: PDFString.of('sRGB IEC61966-2-1'),
    Info: PDFString.of('sRGB IEC61966-2-1'),
    DestOutputProfile: iccRef,
  });
  doc.catalog.set(name('OutputIntents'), doc.context.obj([outputIntent]));

  // `context.stream` takes a JS string through pdf-lib's own `typedArrayFor`, which
  // keeps only the low byte of each char code — fine for the packet's ASCII structure,
  // but it would truncate the required literal BOM in the `<?xpacket?>` header (and any
  // non-ASCII character in a title or author) into a single stray byte. Encoding to
  // real UTF-8 bytes first avoids that.
  const xmp = buildPdfaXmpPacket(metadata, 2, 'B');
  const metadataRef = doc.context.register(
    doc.context.stream(new TextEncoder().encode(xmp), { Type: 'Metadata', Subtype: 'XML' }),
  );
  doc.catalog.set(name('Metadata'), metadataRef);

  markProduced(doc);
  return { file: pdfFile(outputName, await doc.save()), activeContentRemoved, nonEmbeddedFonts };
}

/**
 * Deliberately bypasses `loadPdf`'s own leniency: it retries an empty password for a
 * restriction-only file and succeeds, which is right for every other tool but wrong
 * here — PDF/A forbids encryption outright, restriction-only included, so this has to
 * notice it before `loadPdf` quietly works around it.
 */
async function isEncrypted(input: PdfInput): Promise<boolean> {
  try {
    await PDFDocument.load(input.bytes, { updateMetadata: false });
    return false;
  } catch (error) {
    return error instanceof EncryptedPDFError;
  }
}

/** Document- and page-level JavaScript, open actions, and embedded files — all
 * forbidden by PDF/A. Returns how many were found and removed. */
function removeActiveContent(doc: PDFDocument): number {
  let removed = 0;

  for (const key of ['OpenAction', 'AA']) {
    if (doc.catalog.has(name(key))) {
      doc.catalog.delete(name(key));
      removed++;
    }
  }

  const names = tryLookup(() => doc.catalog.lookupMaybe(name('Names'), PDFDict));
  if (names) {
    for (const key of ['JavaScript', 'EmbeddedFiles']) {
      if (!names.has(name(key))) continue;
      names.delete(name(key));
      removed++;
    }
  }

  for (const page of doc.getPages()) {
    if (page.node.has(name('AA'))) {
      page.node.delete(name('AA'));
      removed++;
    }
  }

  return removed;
}

/** Base font names (subset tag stripped) this document references without an embedded
 * font program — the one PDF/A requirement this operation reports but doesn't fix. */
function listNonEmbeddedFonts(doc: PDFDocument): string[] {
  const found = new Set<string>();

  for (const [, object] of doc.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFDict) || object.get(name('Type')) !== name('Font')) continue;

    let target = object;
    if (object.get(name('Subtype')) === name('Type0')) {
      const descendants = tryLookup(() => object.lookupMaybe(name('DescendantFonts'), PDFArray));
      const first = descendants && descendants.size() > 0 ? descendants.get(0) : undefined;
      const descendant = first instanceof PDFRef ? tryLookup(() => doc.context.lookup(first, PDFDict)) : undefined;
      if (!descendant) continue;
      target = descendant;
    }

    const descriptor = tryLookup(() => target.lookupMaybe(name('FontDescriptor'), PDFDict));
    const embedded = !!descriptor && ['FontFile', 'FontFile2', 'FontFile3'].some((key) => descriptor.has(name(key)));
    if (embedded) continue;

    const baseFont = tryLookup(() => object.lookupMaybe(name('BaseFont'), PDFName))?.decodeText() ?? 'Unknown font';
    found.add(baseFont.replace(/^[A-Z]{6}\+/, ''));
  }

  return [...found].sort();
}
