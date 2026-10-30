import { describe, expect, it } from 'vitest';
import { buildSrgbIccProfile } from '../../src/lib/pdf/pdfa/srgbIcc';

const ascii = (bytes: Uint8Array, at: number, length: number) =>
  new TextDecoder().decode(bytes.subarray(at, at + length));

/** Reads one tag table entry (signature, offset, size), 1-indexed like the spec's own `n`. */
function tagEntry(bytes: Uint8Array, index: number) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const at = 128 + 4 + index * 12;
  return { signature: ascii(bytes, at, 4), offset: view.getUint32(at + 4, false), size: view.getUint32(at + 8, false) };
}

describe('buildSrgbIccProfile', () => {
  it('declares its own total size correctly', () => {
    const profile = buildSrgbIccProfile();
    const view = new DataView(profile.buffer);
    expect(view.getUint32(0, false)).toBe(profile.length);
  });

  it('has the header fields a reader checks before trusting anything else', () => {
    const profile = buildSrgbIccProfile();
    expect(ascii(profile, 12, 4)).toBe('mntr');
    expect(ascii(profile, 16, 4)).toBe('RGB ');
    expect(ascii(profile, 20, 4)).toBe('XYZ ');
    expect(ascii(profile, 36, 4)).toBe('acsp');
  });

  it('carries every tag a monitor-class RGB profile needs, each within bounds', () => {
    const profile = buildSrgbIccProfile();
    const view = new DataView(profile.buffer);
    const tagCount = view.getUint32(128, false);

    const required = ['desc', 'wtpt', 'rXYZ', 'gXYZ', 'bXYZ', 'rTRC', 'gTRC', 'bTRC', 'cprt'];
    const found = Array.from({ length: tagCount }, (_, index) => tagEntry(profile, index));
    expect(found.map((entry) => entry.signature).sort()).toEqual([...required].sort());

    const expectedType = (signature: string) =>
      signature === 'desc' ? 'desc' : signature === 'cprt' ? 'text' : signature.endsWith('TRC') ? 'curv' : 'XYZ ';
    for (const entry of found) {
      expect(entry.offset + entry.size).toBeLessThanOrEqual(profile.length);
      expect(ascii(profile, entry.offset, 4)).toBe(expectedType(entry.signature));
    }
  });

  it('samples the sRGB curve monotonically from 0 to full scale', () => {
    const profile = buildSrgbIccProfile();
    const view = new DataView(profile.buffer);
    const tagCount = view.getUint32(128, false);
    const rtrc = Array.from({ length: tagCount }, (_, index) => tagEntry(profile, index)).find((entry) => entry.signature === 'rTRC')!;

    const count = view.getUint32(rtrc.offset + 8, false);
    expect(count).toBeGreaterThan(1);
    const samples = Array.from({ length: count }, (_, index) => view.getUint16(rtrc.offset + 12 + index * 2, false));
    expect(samples[0]).toBe(0);
    expect(samples.at(-1)).toBe(65535);
    for (let index = 1; index < samples.length; index++) expect(samples[index]!).toBeGreaterThanOrEqual(samples[index - 1]!);
  });

  it('declares a white point close to D50, matching the PCS illuminant it declares', () => {
    const profile = buildSrgbIccProfile();
    const view = new DataView(profile.buffer);
    const tagCount = view.getUint32(128, false);
    const wtpt = Array.from({ length: tagCount }, (_, index) => tagEntry(profile, index)).find((entry) => entry.signature === 'wtpt')!;

    const x = view.getInt32(wtpt.offset + 8, false) / 65536;
    const y = view.getInt32(wtpt.offset + 12, false) / 65536;
    const z = view.getInt32(wtpt.offset + 16, false) / 65536;
    expect(x).toBeCloseTo(0.9642, 3);
    expect(y).toBeCloseTo(1, 3);
    expect(z).toBeCloseTo(0.8249, 3);

    const illuminantX = view.getInt32(68, false) / 65536;
    expect(illuminantX).toBeCloseTo(x, 4);
  });

  it('sums its three colorant primaries back to the white point, within rounding', () => {
    const profile = buildSrgbIccProfile();
    const view = new DataView(profile.buffer);
    const tagCount = view.getUint32(128, false);
    const entries = Array.from({ length: tagCount }, (_, index) => tagEntry(profile, index));
    const xyzOf = (signature: string) => {
      const entry = entries.find((candidate) => candidate.signature === signature)!;
      return [0, 1, 2].map((component) => view.getInt32(entry.offset + 8 + component * 4, false) / 65536);
    };

    const [r, g, b] = [xyzOf('rXYZ'), xyzOf('gXYZ'), xyzOf('bXYZ')];
    for (let component = 0; component < 3; component++) {
      const sum = r[component]! + g[component]! + b[component]!;
      expect(sum).toBeCloseTo([0.9642, 1, 0.8249][component]!, 2);
    }
  });
});
