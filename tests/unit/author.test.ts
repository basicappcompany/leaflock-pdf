import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authors } from '../../src/lib/author';
import { article } from '../../src/lib/seo';

const site = new URL('https://leaflockpdf.com');
const base = { headline: 'h', description: 'd', url: 'https://leaflockpdf.com/guides/x', locale: 'en', published: new Date('2026-11-23'), site };

describe('article markup names its author truthfully', () => {
  it('uses the organization when no person is named', () => {
    expect(article(base).author).toEqual({ '@id': 'https://leaflockpdf.com/#organization' });
  });

  it('uses a Person, tied to the organization, when one is named', () => {
    const json = article({ ...base, author: { name: authors.founder.name, role: authors.founder.role } });
    expect(json.author).toEqual({
      '@type': 'Person',
      name: authors.founder.name,
      jobTitle: authors.founder.role,
      worksFor: { '@id': 'https://leaflockpdf.com/#organization' },
    });
  });
});

describe('guide authors', () => {
  const dir = 'src/content/guides/en';
  const named = readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .filter((file) => /^author: /m.test(readFileSync(join(dir, file), 'utf8')));

  it('only names someone listed in src/lib/author.ts', () => {
    for (const file of named) {
      const id = /^author: (.+)$/m.exec(readFileSync(join(dir, file), 'utf8'))?.[1]?.trim();
      expect(Object.keys(authors), `${file} names an unknown author`).toContain(id);
    }
  });

  it('the five privacy articles carry the founder byline, and the tool guides stay on the team name', () => {
    expect(named.sort()).toEqual([
      'how-a-website-can-promise-your-files-never-leave-your-device.md',
      'how-to-send-a-sensitive-pdf-by-email.md',
      'seven-questions-to-ask-before-you-upload-a-pdf.md',
      'what-is-hidden-inside-a-pdf.md',
      'working-with-pdfs-offline.md',
    ]);
  });
});
