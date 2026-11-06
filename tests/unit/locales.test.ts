import { describe, expect, it } from 'vitest';
import { directionOf, isTranslated, localeInfo, localeRegistry } from '../../src/i18n/config';
import { astroFallback, astroLocales } from '../../src/i18n/locales.mjs';
import { mergeMessages } from '../../src/i18n';
import { plural } from '../../src/i18n/format';

describe('locale registry', () => {
  it('lists 20 languages with English as the only reviewed one at the start', () => {
    expect(localeRegistry).toHaveLength(20);
    expect(localeRegistry.filter((locale) => locale.status === 'reviewed').map((locale) => locale.code)).toEqual(['en']);
  });

  it('has unique codes and unique URL paths', () => {
    expect(new Set(localeRegistry.map((locale) => locale.code)).size).toBe(localeRegistry.length);
    expect(new Set(localeRegistry.map((locale) => locale.path)).size).toBe(localeRegistry.length);
  });

  it('uses lowercase URL paths', () => {
    for (const locale of localeRegistry) expect(locale.path).toBe(locale.path.toLowerCase());
  });

  it('gives every non-default locale an English fallback and none to English', () => {
    expect(Object.keys(astroFallback)).toHaveLength(19);
    expect(astroFallback).not.toHaveProperty('en');
    expect(new Set(Object.values(astroFallback))).toEqual(new Set(['en']));
  });

  it('maps codes whose path differs into Astro { path, codes } entries', () => {
    expect(astroLocales).toContainEqual({ path: 'pt-br', codes: ['pt-BR'] });
    expect(astroLocales).toContain('de');
  });

  it('marks Arabic right-to-left and everything else left-to-right', () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(localeRegistry.filter((locale) => locale.dir === 'rtl').map((locale) => locale.code)).toEqual(['ar']);
    expect(directionOf('unknown')).toBe('ltr');
  });

  it('indexes only locales that have a translation', () => {
    expect(isTranslated('en')).toBe(true);
    expect(isTranslated('th')).toBe(false);
    expect(isTranslated('nope')).toBe(false);
    expect(localeInfo('pt-BR')?.path).toBe('pt-br');
  });

  it('has a plural rule the runtime understands for every locale', () => {
    for (const locale of localeRegistry) {
      expect(() => plural(locale.code, { other: '{count}' }, 2)).not.toThrow();
    }
  });
});

describe('mergeMessages', () => {
  const base = { a: 'one', nested: { b: 'two', c: 'three' }, list: ['x', 'y'] };

  it('keeps English for anything the locale lacks', () => {
    expect(mergeMessages(base, { nested: { b: 'dos' } })).toEqual({ a: 'one', nested: { b: 'dos', c: 'three' }, list: ['x', 'y'] });
  });

  it('replaces arrays whole instead of mixing languages inside a list', () => {
    expect(mergeMessages(base, { list: ['z'] }).list).toEqual(['z']);
  });

  it('returns the base when there are no overrides', () => {
    expect(mergeMessages(base, undefined)).toEqual(base);
  });
});
