import { describe, expect, it } from 'vitest';
import { interleavePages } from '../../src/lib/organize/pages';

/** "0:2" means page index 2 of the first file. */
const shorthand = (order: { source: number; index: number }[]) => order.map(({ source, index }) => `${source}:${index}`);

const mix = (first: number, second: number, step = 1, reverseSecond = false) =>
  shorthand(interleavePages(first, second, { step, reverseSecond }));

describe('interleavePages', () => {
  it('alternates one page at a time', () => {
    expect(mix(3, 3)).toEqual(['0:0', '1:0', '0:1', '1:1', '0:2', '1:2']);
  });

  it('takes the second file from the end when its pages are reversed', () => {
    // The usual two-pass scan: fronts 1,2,3 and backs scanned as 6,5,4.
    expect(mix(3, 3, 1, true)).toEqual(['0:0', '1:2', '0:1', '1:1', '0:2', '1:0']);
  });

  it('puts the leftovers of the longer file on the end', () => {
    expect(mix(4, 2)).toEqual(['0:0', '1:0', '0:1', '1:1', '0:2', '0:3']);
    expect(mix(1, 3)).toEqual(['0:0', '1:0', '1:1', '1:2']);
  });

  it('takes several pages at a time', () => {
    expect(mix(4, 4, 2)).toEqual(['0:0', '0:1', '1:0', '1:1', '0:2', '0:3', '1:2', '1:3']);
  });

  it('treats a step below one as one', () => {
    expect(mix(2, 2, 0)).toEqual(mix(2, 2, 1));
    expect(mix(2, 2, -5)).toEqual(mix(2, 2, 1));
  });

  it('handles an empty second file', () => {
    expect(mix(2, 0)).toEqual(['0:0', '0:1']);
    expect(mix(0, 0)).toEqual([]);
  });

  it('uses every page exactly once', () => {
    const order = interleavePages(7, 5, { step: 2, reverseSecond: true });
    expect(order).toHaveLength(12);
    expect(new Set(shorthand(order)).size).toBe(12);
  });
});
