import { unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { zip } from '../../src/lib/pdf/ops/zip';
import { noProgress } from '../../src/lib/pdf/types';

describe('zip', () => {
  it('bundles files and keeps duplicate names apart', async () => {
    const file = (name: string, text: string) => ({
      name,
      bytes: new TextEncoder().encode(text) as Uint8Array<ArrayBuffer>,
      type: 'text/plain',
    });

    const [archive] = await zip(
      { files: [file('a.txt', 'one'), file('a.txt', 'two'), file('b.txt', 'three')], outputName: 'all.zip' },
      noProgress,
    );

    expect(archive!.name).toBe('all.zip');
    const entries = unzipSync(archive!.bytes);
    expect(Object.keys(entries).sort()).toEqual(['a (2).txt', 'a.txt', 'b.txt']);
    expect(new TextDecoder().decode(entries['a (2).txt'])).toBe('two');
  });
});
