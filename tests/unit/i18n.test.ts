import { describe, expect, it } from 'vitest';
import { format, plural } from '../../src/i18n/format';

describe('format', () => {
  it('fills placeholders and leaves unknown ones alone', () => {
    expect(format('{name} has {count} pages, {missing}', { name: 'a.pdf', count: 3 })).toBe(
      'a.pdf has 3 pages, {missing}',
    );
  });
});

describe('plural', () => {
  const files = { one: '{count} file', other: '{count} files' };

  it('picks the form for the locale', () => {
    expect(plural('en', files, 1)).toBe('1 file');
    expect(plural('en', files, 2)).toBe('2 files');
  });

  it('formats the number for the locale', () => {
    expect(plural('en', files, 1200)).toBe('1,200 files');
    expect(plural('hi', files, 1200000)).toBe('12,00,000 files');
  });

  it('falls back to "other" when a form is missing', () => {
    expect(plural('en', { other: '{count} items' }, 1)).toBe('1 items');
  });
});
