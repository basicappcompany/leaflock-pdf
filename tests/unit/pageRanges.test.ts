import { describe, expect, it } from 'vitest';
import { formatPageRanges, parsePageRanges } from '../../src/lib/pageRanges';

describe('parsePageRanges', () => {
  it('reads single pages, ranges and open ends', () => {
    expect(parsePageRanges('1-3, 5, 8-', 10)).toEqual([0, 1, 2, 4, 7, 8, 9]);
    expect(parsePageRanges('-2', 10)).toEqual([0, 1]);
  });

  it('keeps typed order and drops duplicates', () => {
    expect(parsePageRanges('3, 1-3', 5)).toEqual([2, 0, 1]);
    expect(parsePageRanges('5-3', 5)).toEqual([4, 3, 2]);
  });

  it('accepts spaces, semicolons and en dashes', () => {
    expect(parsePageRanges(' 1 – 2 ; 4 ', 5)).toEqual([0, 1, 3]);
  });

  it('rejects pages out of range and junk', () => {
    expect(parsePageRanges('0', 5)).toBeNull();
    expect(parsePageRanges('6', 5)).toBeNull();
    expect(parsePageRanges('1-x', 5)).toBeNull();
    expect(parsePageRanges('', 5)).toBeNull();
  });
});

describe('formatPageRanges', () => {
  it('collapses runs', () => {
    expect(formatPageRanges([0, 1, 2, 4, 7, 8])).toBe('1-3, 5, 8-9');
    expect(formatPageRanges([])).toBe('');
  });
});
