import { describe, expect, it } from 'vitest';
import { en } from '../../src/i18n/en';
import { locales } from '../../src/i18n';
import { localeRegistry } from '../../src/i18n/config';

type Leaf = { trail: string; text: string };

function leaves(value: unknown, trail: string[] = [], out: Leaf[] = []): Leaf[] {
  if (typeof value === 'string') out.push({ trail: trail.join('.'), text: value });
  else if (Array.isArray(value)) value.forEach((item, index) => leaves(item, [...trail, String(index)], out));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) leaves(item, [...trail, key], out);
  return out;
}

/** What a translation must carry over: placeholders, URLs, tags and numbers. */
function mustKeep(text: string): string[] {
  const tokens = new Set<string>();
  for (const match of text.matchAll(/\{\w+\}/g)) tokens.add(match[0]);
  for (const match of text.matchAll(/https?:\/\/[^\s)"']+/g)) tokens.add(match[0]);
  for (const match of text.matchAll(/<\/?[a-zA-Z][^>]*>/g)) tokens.add(match[0]);
  for (const match of text.matchAll(/\d[\d.,]*/g)) tokens.add(match[0].replace(/[.,]$/, ''));
  return [...tokens];
}

const english = leaves(en);
const translated = Object.keys(locales).filter((code) => code !== 'en');

describe('locale catalogues', () => {
  it('only publishes locales the registry knows, and none still marked planned', () => {
    for (const code of Object.keys(locales)) {
      const info = localeRegistry.find((locale) => locale.code === code);
      expect(info, `${code} has a catalogue but is not in the registry`).toBeDefined();
      expect(info?.status, `${code} has a catalogue but its status is still 'planned'`).not.toBe('planned');
    }
    for (const info of localeRegistry) {
      if (info.status !== 'planned') expect(Object.keys(locales), `${info.code} is ${info.status} but has no catalogue`).toContain(info.code);
    }
  });

  if (translated.length === 0) {
    it('has no translated locales yet', () => expect(translated).toEqual([]));
    return;
  }

  describe.each(translated)('%s', (code) => {
    const catalogue = new Map(leaves(locales[code]).map((leaf) => [leaf.trail, leaf.text]));

    it('has the same strings as English, no more and no fewer', () => {
      expect([...catalogue.keys()].sort()).toEqual(english.map((leaf) => leaf.trail).sort());
    });

    it('keeps every placeholder, number, URL and tag the English string has', () => {
      const lost: string[] = [];
      for (const leaf of english) {
        const text = catalogue.get(leaf.trail) ?? '';
        for (const token of mustKeep(leaf.text)) if (!text.includes(token)) lost.push(`${leaf.trail}: lost ${token}`);
      }
      expect(lost.slice(0, 20)).toEqual([]);
    });

    it('does not invent placeholders the English string lacks', () => {
      const invented: string[] = [];
      for (const leaf of english) {
        const allowed = new Set(leaf.text.match(/\{\w+\}/g) ?? []);
        for (const token of catalogue.get(leaf.trail)?.match(/\{\w+\}/g) ?? []) if (!allowed.has(token)) invented.push(`${leaf.trail}: ${token}`);
      }
      expect(invented.slice(0, 20)).toEqual([]);
    });
  });
});
