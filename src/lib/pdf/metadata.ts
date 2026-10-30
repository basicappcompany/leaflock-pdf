import { PDFDict, PDFName, type PDFDocument } from '@cantoo/pdf-lib';
import { tryLookup } from './outlines';

export interface DocMetadata {
  title: string | undefined;
  author: string | undefined;
  subject: string | undefined;
  keywords: string | undefined;
}

/** Reads the handful of Info-dict fields worth carrying across a merge/split/organize. */
export function readMetadata(source: PDFDocument): DocMetadata {
  return {
    title: source.getTitle(),
    author: source.getAuthor(),
    subject: source.getSubject(),
    keywords: source.getKeywords(),
  };
}

/**
 * Applies the first non-empty value for each field across `candidates`, in order — e.g.
 * for a merge, the title of the first input that actually set one. `PDFDocument.create()`
 * starts with none of this, so without it every merge/split/organize output loses the
 * title and author its input had.
 */
export function writeMetadata(dest: PDFDocument, candidates: DocMetadata[]): void {
  const pick = (key: keyof DocMetadata): string | undefined => candidates.map((c) => c[key]).find((value) => value);

  const title = pick('title');
  if (title) dest.setTitle(title);
  const author = pick('author');
  if (author) dest.setAuthor(author);
  const subject = pick('subject');
  if (subject) dest.setSubject(subject);
  const keywords = pick('keywords');
  if (keywords) dest.setKeywords([keywords]);
}

/** The Info dictionary, if the document has one. */
function infoDict(doc: PDFDocument): PDFDict | undefined {
  const ref = doc.context.trailerInfo.Info;
  return ref ? tryLookup(() => doc.context.lookup(ref, PDFDict)) : undefined;
}

/** Which Info key holds each field we let people edit. */
const infoKeys = [
  ['title', 'Title'],
  ['author', 'Author'],
  ['subject', 'Subject'],
  ['keywords', 'Keywords'],
] as const satisfies readonly (readonly [keyof DocMetadata, string])[];

/**
 * Writes `values` into the document's Info dictionary, **removing** any field left empty
 * rather than storing a blank string: clearing the author should leave no author, not an
 * author whose name is nothing. Setting runs first because pdf-lib creates the Info
 * dictionary on demand, so a document that had none still gets one when there is
 * something to put in it.
 */
export function applyMetadata(doc: PDFDocument, values: DocMetadata): void {
  if (values.title) doc.setTitle(values.title);
  if (values.author) doc.setAuthor(values.author);
  if (values.subject) doc.setSubject(values.subject);
  if (values.keywords) doc.setKeywords([values.keywords]);

  const info = infoDict(doc);
  if (!info) return;
  for (const [field, key] of infoKeys) {
    if (!values[field]) info.delete(PDFName.of(key));
  }
}
