import { describe, expect, it } from 'vitest';
import { formatPageLabel, validateRanges, type PageLabelRange } from '../../src/lib/organize/pageLabels';

describe('formatPageLabel', () => {
  it('counts decimal pages from startAt', () => {
    const range: PageLabelRange = { startIndex: 5, style: 'decimal', prefix: '', startAt: 1 };
    expect(formatPageLabel(range, 5)).toBe('1');
    expect(formatPageLabel(range, 7)).toBe('3');
  });

  it('renders lower and upper roman numerals', () => {
    const lower: PageLabelRange = { startIndex: 0, style: 'lowerRoman', prefix: '', startAt: 1 };
    expect([0, 1, 2, 3, 8].map((i) => formatPageLabel(lower, i))).toEqual(['i', 'ii', 'iii', 'iv', 'ix']);
    const upper: PageLabelRange = { ...lower, style: 'upperRoman' };
    expect(formatPageLabel(upper, 2)).toBe('III');
  });

  it('renders letters the PDF way: the 27th value is "aa", not "ab"', () => {
    const range: PageLabelRange = { startIndex: 0, style: 'lowerLetters', prefix: '', startAt: 1 };
    expect([0, 1, 25, 26, 27, 51, 52].map((i) => formatPageLabel(range, i))).toEqual([
      'a', 'b', 'z', 'aa', 'bb', 'zz', 'aaa',
    ]);
    const upper: PageLabelRange = { ...range, style: 'upperLetters' };
    expect(formatPageLabel(upper, 26)).toBe('AA');
  });

  it('applies the prefix before the numeric part', () => {
    const range: PageLabelRange = { startIndex: 0, style: 'decimal', prefix: 'A-', startAt: 1 };
    expect(formatPageLabel(range, 2)).toBe('A-3');
  });

  it('renders just the prefix when style is none', () => {
    const range: PageLabelRange = { startIndex: 0, style: 'none', prefix: 'Appendix', startAt: 1 };
    expect(formatPageLabel(range, 4)).toBe('Appendix');
  });

  it('honours a non-default starting counter', () => {
    const range: PageLabelRange = { startIndex: 10, style: 'decimal', prefix: '', startAt: 100 };
    expect(formatPageLabel(range, 10)).toBe('100');
    expect(formatPageLabel(range, 12)).toBe('102');
  });
});

describe('validateRanges', () => {
  const range = (startIndex: number): PageLabelRange => ({ startIndex, style: 'decimal', prefix: '', startAt: 1 });

  it('rejects an empty list', () => {
    expect(validateRanges([], 10)).toBe('empty');
  });

  it('requires the first range to start at page 1 (index 0)', () => {
    expect(validateRanges([range(1)], 10)).toBe('mustStartAtFirstPage');
  });

  it('rejects a range starting at or past the page count', () => {
    expect(validateRanges([range(0), range(10)], 10)).toBe('outOfRange');
  });

  it('rejects a negative start index on a later range', () => {
    expect(validateRanges([range(0), range(-1)], 10)).toBe('outOfRange');
  });

  it('rejects ranges that are not strictly ascending', () => {
    expect(validateRanges([range(0), range(3), range(3)], 10)).toBe('outOfOrder');
    expect(validateRanges([range(0), range(5), range(2)], 10)).toBe('outOfOrder');
  });

  it('accepts a valid ascending set covering the first page', () => {
    expect(validateRanges([range(0), range(3), range(7)], 10)).toBeNull();
  });

  it('accepts a single range covering the whole document', () => {
    expect(validateRanges([range(0)], 10)).toBeNull();
  });
});
