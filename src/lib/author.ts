/**
 * The person named on the about page and on bylined articles.
 *
 * English only, and kept out of the i18n catalogues on purpose: the articles that use it are
 * English only, and a string in `common` is serialised into every tool page. Add a person
 * here only with their agreement and a role that is true today; this is not a place for
 * planned job titles.
 */
export const authors = {
  founder: { name: 'T', role: 'Founder', by: 'By' },
} as const;

export type AuthorId = keyof typeof authors;
