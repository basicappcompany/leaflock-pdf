import { getCollection, type CollectionEntry } from 'astro:content';

type Collection = 'guides' | 'pages' | 'compare';

/** "en/redact-pdf-properly" → "redact-pdf-properly" */
export function slugOf(entry: { id: string }): string {
  return entry.id.slice(entry.id.indexOf('/') + 1);
}

/** Entries of a collection written in `locale`. */
export async function entriesFor<C extends Collection>(collection: C, locale: string): Promise<CollectionEntry<C>[]> {
  const all = (await getCollection(collection)) as CollectionEntry<C>[];
  return all.filter((entry) => entry.id.startsWith(`${locale}/`));
}

/** Guides newest first. */
export async function guidesFor(locale: string): Promise<CollectionEntry<'guides'>[]> {
  const guides = await entriesFor('guides', locale);
  return guides.sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
}
