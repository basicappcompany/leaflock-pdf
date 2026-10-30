import { describe, expect, it } from 'vitest';
import { diffPixels } from '../../src/lib/secure/imageDiff';
import { diffWords, summarize } from '../../src/lib/secure/textDiff';

describe('diffWords', () => {
  it('marks inserted and deleted words', () => {
    const parts = diffWords('The quick brown fox jumps', 'The quick red fox leaps high');
    expect(parts).toEqual([
      { type: 'equal', words: ['The', 'quick'] },
      { type: 'delete', words: ['brown'] },
      { type: 'insert', words: ['red'] },
      { type: 'equal', words: ['fox'] },
      { type: 'delete', words: ['jumps'] },
      { type: 'insert', words: ['leaps', 'high'] },
    ]);
    expect(summarize(parts)).toEqual({ inserted: 3, deleted: 2 });
  });

  it('ignores differences in spacing and line breaks', () => {
    expect(diffWords('one  two\nthree', 'one two three')).toEqual([{ type: 'equal', words: ['one', 'two', 'three'] }]);
  });

  it('handles empty sides', () => {
    expect(diffWords('', 'new text')).toEqual([{ type: 'insert', words: ['new', 'text'] }]);
    expect(diffWords('old text', '')).toEqual([{ type: 'delete', words: ['old', 'text'] }]);
    expect(diffWords('', '')).toEqual([]);
  });

  it('keeps each word exactly once, in order', () => {
    const before = 'a b c d e f g h';
    const after = 'a x c d y f h z';
    const parts = diffWords(before, after);
    const rebuiltBefore = parts.filter((p) => p.type !== 'insert').flatMap((p) => p.words).join(' ');
    const rebuiltAfter = parts.filter((p) => p.type !== 'delete').flatMap((p) => p.words).join(' ');
    expect(rebuiltBefore).toBe(before);
    expect(rebuiltAfter).toBe(after);
  });
});

describe('diffPixels', () => {
  const image = (width: number, height: number, fill: number) => ({
    data: new Uint8ClampedArray(width * height * 4).fill(fill),
    width,
    height,
  });

  it('finds no change between identical images', () => {
    const result = diffPixels(image(4, 4, 200), image(4, 4, 200), [255, 0, 255]);
    expect(result.changed).toBe(0);
    expect(result.overlay.length).toBe(4 * 4 * 4);
  });

  it('highlights changed pixels', () => {
    const before = image(2, 1, 255);
    const after = image(2, 1, 255);
    after.data.set([0, 0, 0, 255], 4); // second pixel turns black
    const result = diffPixels(before, after, [255, 0, 255]);
    expect(result.changed).toBe(0.5);
    expect(Array.from(result.overlay.slice(4, 8))).toEqual([255, 0, 255, 255]);
    expect(result.overlay[0]).toBe(255); // unchanged white stays white
  });

  it('ignores small anti-aliasing differences', () => {
    const before = image(1, 1, 120);
    const after = image(1, 1, 140);
    expect(diffPixels(before, after, [255, 0, 255]).changed).toBe(0);
  });

  it('counts area only one image has as changed', () => {
    const result = diffPixels(image(2, 2, 255), image(2, 1, 255), [255, 0, 255]);
    expect(result).toMatchObject({ width: 2, height: 2, changed: 0.5 });
  });
});
