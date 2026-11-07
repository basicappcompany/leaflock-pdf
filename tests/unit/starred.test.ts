import { describe, expect, it } from 'vitest';
import { mergeStarred } from '../../src/lib/starred';

/**
 * The rules that keep this browser's starred list and the account's in agreement. They are the
 * part most likely to lose someone's stars, so they are tested as plain data in and data out.
 */
describe('mergeStarred', () => {
  const none = { add: [], remove: [] };

  it('first sync on a browser keeps everything starred here and everything in the account', () => {
    // No account recorded yet: whatever was starred before signing in counts as an addition.
    const result = mergeStarred({ local: ['split', 'merge'], remote: ['rotate'], account: 'a1' });
    expect(result.tools).toEqual(['split', 'merge', 'rotate']);
    expect(result.upload).toBe(true);
    expect(result.pending).toEqual({ add: ['split', 'merge'], remove: [] });
  });

  it('first sync with nothing local simply takes the account list, and uploads nothing', () => {
    const result = mergeStarred({ local: [], remote: ['rotate', 'merge'], account: 'a1' });
    expect(result.tools).toEqual(['rotate', 'merge']);
    expect(result.upload).toBe(false);
    expect(result.pending).toEqual(none);
  });

  it('a later sync with nothing pending takes the account list as it is', () => {
    const result = mergeStarred({ local: ['merge'], remote: ['rotate', 'merge', 'split'], account: 'a1', storedAccount: 'a1', pending: none });
    expect(result.tools).toEqual(['rotate', 'merge', 'split']);
    expect(result.upload).toBe(false);
  });

  it('applies a pending star on top of what the account holds, keeping what another device added', () => {
    const result = mergeStarred({ local: ['crop', 'merge'], remote: ['rotate', 'merge'], account: 'a1', storedAccount: 'a1', pending: { add: ['crop'], remove: [] } });
    expect(result.tools).toEqual(['crop', 'rotate', 'merge']);
    expect(result.upload).toBe(true);
  });

  it('a pending unstar is not undone by the account still having the tool', () => {
    const result = mergeStarred({ local: ['rotate'], remote: ['rotate', 'merge'], account: 'a1', storedAccount: 'a1', pending: { add: [], remove: ['merge'] } });
    expect(result.tools).toEqual(['rotate']);
    expect(result.pending).toEqual({ add: [], remove: ['merge'] });
    expect(result.upload).toBe(true);
  });

  it('an unstar and a star of the same tool, in that order, nets out to starred', () => {
    // toggleStarred removes the id from "remove" when it is starred again; the merge trusts that.
    const result = mergeStarred({ local: ['merge'], remote: ['merge'], account: 'a1', storedAccount: 'a1', pending: { add: ['merge'], remove: [] } });
    expect(result.tools).toEqual(['merge']);
    expect(result.upload).toBe(false);
  });

  it("another account's list on this browser is replaced, never merged into the signed-in account", () => {
    const result = mergeStarred({ local: ['split', 'merge'], remote: ['rotate'], account: 'b2', storedAccount: 'a1', pending: { add: ['split'], remove: [] } });
    expect(result.tools).toEqual(['rotate']);
    expect(result.upload).toBe(false);
    expect(result.pending).toEqual(none);
  });

  it('collapses duplicates and never exceeds the cap', () => {
    const many = Array.from({ length: 150 }, (_, i) => `tool${i}`);
    const result = mergeStarred({ local: ['merge', 'merge'], remote: many, account: 'a1' });
    expect(new Set(result.tools).size).toBe(result.tools.length);
    expect(result.tools.length).toBeLessThanOrEqual(100);
    expect(result.tools[0]).toBe('merge');
  });

  it('reports what still differs from the account, so a failed upload can be retried', () => {
    const result = mergeStarred({ local: ['crop', 'rotate'], remote: ['rotate', 'merge'], account: 'a1', storedAccount: 'a1', pending: { add: ['crop'], remove: ['merge'] } });
    expect(result.pending).toEqual({ add: ['crop'], remove: ['merge'] });
  });
});
