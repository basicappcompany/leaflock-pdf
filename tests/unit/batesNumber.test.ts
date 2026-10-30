import { describe, expect, it } from 'vitest';
import { batesNumber, type BatesNumberArgs } from '../../src/lib/pdf/ops/batesNumber';
import { noProgress } from '../../src/lib/pdf/types';
import { makePdf } from '../fixtures/pdfs';
import { readPages } from './editHelpers';

const base: Omit<BatesNumberArgs, 'inputs'> = {
  outputSuffix: 'bates',
  prefix: 'ABC',
  suffix: '',
  digits: 6,
  startAt: 1,
  position: 'bottom-right',
  fontSize: 10,
  margin: 20,
  color: '#000000',
};

/** The fixture's own "Page N" label sits alongside the stamp, so pull out just the
 * text item that looks like a Bates label rather than the page's full text. */
async function stampsOf(inputs: { name: string; bytes: Uint8Array }[], options: Partial<BatesNumberArgs> = {}) {
  const outputs = await batesNumber({ ...base, inputs, ...options }, noProgress);
  const stamps: string[][] = [];
  for (const output of outputs) {
    const pages = await readPages(output.bytes);
    stamps.push(pages.map((page) => page.items.find((item) => !item.text.startsWith('Page'))?.text ?? ''));
  }
  return { outputs, stamps };
}

describe('batesNumber', () => {
  it('stamps a continuous, zero-padded sequence across every page of every file', async () => {
    const a = await makePdf([[300, 400], [300, 400]]);
    const b = await makePdf([[300, 400]]);

    const { stamps } = await stampsOf([
      { name: 'a.pdf', bytes: a },
      { name: 'b.pdf', bytes: b },
    ]);

    expect(stamps).toEqual([
      ['ABC000001', 'ABC000002'],
      ['ABC000003'],
    ]);
  });

  it('names each output after its own input, with the suffix appended', async () => {
    const a = await makePdf([[300, 400]]);
    const { outputs } = await stampsOf([{ name: 'case-file.pdf', bytes: a }]);
    expect(outputs[0]!.name).toBe('case-file-bates.pdf');
  });

  it('respects a custom starting number, digit width, and a suffix', async () => {
    const a = await makePdf([[300, 400], [300, 400]]);
    const { stamps } = await stampsOf([{ name: 'a.pdf', bytes: a }], {
      startAt: 99,
      digits: 3,
      suffix: '-CONF',
    });
    expect(stamps[0]).toEqual(['ABC099-CONF', 'ABC100-CONF']);
  });

  it('pads with leading zeros past the digit width rather than truncating', async () => {
    const a = await makePdf([[300, 400]]);
    const { stamps } = await stampsOf([{ name: 'a.pdf', bytes: a }], { startAt: 1234567, digits: 3 });
    expect(stamps[0]).toEqual(['ABC1234567']);
  });

  it('rejects an empty file list', async () => {
    await expect(batesNumber({ ...base, inputs: [] }, noProgress)).rejects.toThrow(RangeError);
  });
});
