import { beforeEach, describe, expect, it } from 'vitest';
import { clearRecent, readRecent, recordRun, setActiveTool } from '../../src/lib/recentActivity';

const KEY = 'leaflock-recent';

/** Enough of the Storage interface for the module under test. */
function fakeStorage(initial: Record<string, string> = {}, throwOnAccess = false) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key: string) {
      if (throwOnAccess) throw new Error('site data blocked');
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (throwOnAccess) throw new Error('site data blocked');
      data.set(key, value);
    },
    removeItem(key: string) {
      if (throwOnAccess) throw new Error('site data blocked');
      data.delete(key);
    },
    read: () => data.get(KEY),
  };
}

function install(storage: ReturnType<typeof fakeStorage>) {
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
}

describe('recentActivity', () => {
  beforeEach(() => {
    install(fakeStorage());
    setActiveTool('merge');
  });

  it('records the active tool and nothing else about the work', () => {
    const storage = fakeStorage();
    install(storage);
    recordRun(1_000);

    expect(readRecent()).toEqual([{ tool: 'merge', at: 1_000 }]);
    // The guarantee that matters: no file name, size or page count can appear here.
    expect(storage.read()).toBe('[{"tool":"merge","at":1000}]');
  });

  it('keeps the newest run first', () => {
    recordRun(1_000);
    setActiveTool('split');
    recordRun(2_000);

    expect(readRecent().map((entry) => entry.tool)).toEqual(['split', 'merge']);
  });

  it('collapses repeat runs of the same tool into one entry', () => {
    recordRun(1_000);
    recordRun(5_000);

    expect(readRecent()).toEqual([{ tool: 'merge', at: 5_000 }]);
  });

  it('starts a new entry once the collapse window has passed', () => {
    recordRun(1_000);
    recordRun(1_000 + 60_001);

    expect(readRecent()).toEqual([{ tool: 'merge', at: 61_001 }]);
  });

  it('moves a tool used again to the front without duplicating it', () => {
    recordRun(1_000);
    setActiveTool('split');
    recordRun(100_000);
    setActiveTool('merge');
    recordRun(200_000);

    expect(readRecent()).toEqual([
      { tool: 'merge', at: 200_000 },
      { tool: 'split', at: 100_000 },
    ]);
  });

  it('caps the list', () => {
    const ids = ['merge', 'split', 'rotate', 'crop', 'compress', 'repair', 'flatten'] as const;
    ids.forEach((id, index) => {
      setActiveTool(id);
      recordRun((index + 1) * 100_000);
    });

    expect(readRecent()).toHaveLength(6);
    expect(readRecent()[0]?.tool).toBe('flatten');
  });

  it('ignores entries for tools that no longer exist', () => {
    install(fakeStorage({ [KEY]: '[{"tool":"a-removed-tool","at":1000},{"tool":"merge","at":2000}]' }));

    expect(readRecent()).toEqual([{ tool: 'merge', at: 2_000 }]);
  });

  it('ignores malformed storage rather than throwing', () => {
    install(fakeStorage({ [KEY]: 'not json' }));
    expect(readRecent()).toEqual([]);

    install(fakeStorage({ [KEY]: '{"tool":"merge"}' }));
    expect(readRecent()).toEqual([]);

    install(fakeStorage({ [KEY]: '[{"tool":"merge","at":"yesterday"}]' }));
    expect(readRecent()).toEqual([]);
  });

  it('survives storage that throws, as in a private window', () => {
    install(fakeStorage({}, true));

    expect(() => recordRun(1_000)).not.toThrow();
    expect(() => clearRecent()).not.toThrow();
    expect(readRecent()).toEqual([]);
  });

  it('records nothing when no tool is active', () => {
    const storage = fakeStorage();
    install(storage);
    setActiveTool(undefined as never);
    recordRun(1_000);

    expect(storage.read()).toBeUndefined();
  });

  it('clears the list', () => {
    recordRun(1_000);
    clearRecent();

    expect(readRecent()).toEqual([]);
  });
});
