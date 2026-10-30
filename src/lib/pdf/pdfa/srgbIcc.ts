/**
 * A minimal ICC v2.1 RGB profile for sRGB (IEC 61966-2-1), built byte-for-byte from the
 * public ICC profile format and the published sRGB transfer function and primaries —
 * not a copy of any shipped profile file. PDF/A requires an embedded output-intent ICC
 * profile, and the common ones (the sRGB profile Chrome, Ghostscript and most PDF
 * libraries ship) each carry their own distribution terms; generating the bytes here
 * from the open specification sidesteps that question entirely, the same way
 * `docs/design.md` §13 avoids Ghostscript itself for PDF/A.
 *
 * Layout reference: ICC.1:2001-12 (the stable v2 structure every reader still accepts).
 */

const HEADER_SIZE = 128;

function ascii(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function pad4(bytes: Uint8Array): Uint8Array {
  const remainder = bytes.length % 4;
  if (remainder === 0) return bytes;
  const padded = new Uint8Array(bytes.length + (4 - remainder));
  padded.set(bytes);
  return padded;
}

/** ICC's fixed-point representation for colour values: a 16.16 big-endian integer. */
function s15Fixed16(value: number): number {
  return Math.round(value * 65536);
}

/** `XYZ ` tag type: one CIE XYZ triplet. Used for the white point and the three colorants. */
function xyzTag(x: number, y: number, z: number): Uint8Array {
  const buf = new Uint8Array(20);
  const view = new DataView(buf.buffer);
  buf.set(ascii('XYZ '), 0);
  view.setInt32(8, s15Fixed16(x), false);
  view.setInt32(12, s15Fixed16(y), false);
  view.setInt32(16, s15Fixed16(z), false);
  return buf;
}

/** `curv` tag type: a sampled tone curve, as a plain lookup table of 16-bit values. */
function curveTag(samples: Uint16Array): Uint8Array {
  const buf = new Uint8Array(12 + samples.length * 2);
  const view = new DataView(buf.buffer);
  buf.set(ascii('curv'), 0);
  view.setUint32(8, samples.length, false);
  for (const [index, sample] of samples.entries()) view.setUint16(12 + index * 2, sample, false);
  return buf;
}

/** `text` tag type: one NUL-terminated ASCII string. */
function textTag(text: string): Uint8Array {
  const body = ascii(`${text}\0`);
  const buf = new Uint8Array(8 + body.length);
  buf.set(ascii('text'), 0);
  buf.set(body, 8);
  return buf;
}

/** `desc` tag type (textDescriptionType): ASCII description plus the legacy empty
 * Unicode/Macintosh fields every reader still expects at a fixed size. */
function descTag(text: string): Uint8Array {
  const body = ascii(`${text}\0`);
  const buf = new Uint8Array(12 + body.length + 8 + 2 + 1 + 67);
  const view = new DataView(buf.buffer);
  buf.set(ascii('desc'), 0);
  view.setUint32(8, body.length, false);
  buf.set(body, 12);
  // Unicode language code + count, both zero: no Unicode description follows.
  // ScriptCode code and Macintosh count, both zero, plus the 67-byte Macintosh buffer:
  // already zero from the Uint8Array's initial fill.
  return buf;
}

/**
 * The sRGB (IEC 61966-2-1) *decoding* transfer function (device value → linear light),
 * sampled as a lookup table. An ICC matrix/TRC profile's `curv` tag has to be this
 * direction, not its inverse: the matrix that follows multiplies linear-light values by
 * the colorant primaries to get PCS XYZ, so the curve must already have removed the
 * gamma before that multiply — encoding the other way round leaves every non-endpoint
 * colour wrong while black, white and the pure primaries still happen to round-trip,
 * which is exactly the failure a quick black/white check would miss.
 */
function sampleSrgbCurve(count: number): Uint16Array {
  const samples = new Uint16Array(count);
  for (let index = 0; index < count; index++) {
    const encoded = index / (count - 1);
    const linear = encoded <= 0.04045 ? encoded / 12.92 : ((encoded + 0.055) / 1.055) ** 2.4;
    samples[index] = Math.round(Math.min(Math.max(linear, 0), 1) * 65535);
  }
  return samples;
}

/** D50, the ICC profile connection space's fixed white point. */
const D50: readonly [number, number, number] = [0.9642, 1, 0.8249];

/** sRGB's primaries, Bradford-adapted from D65 to D50 — the standard matrix published
 * alongside the sRGB spec; each column sums to {@link D50} by construction. */
const PRIMARIES = {
  r: [0.4360747, 0.2225045, 0.0139322] as const,
  g: [0.3850649, 0.7168786, 0.0971045] as const,
  b: [0.1430804, 0.0606169, 0.7141733] as const,
};

export function buildSrgbIccProfile(): Uint8Array {
  const trc = sampleSrgbCurve(1024);
  const tags: readonly [string, Uint8Array][] = [
    ['desc', descTag('sRGB IEC61966-2-1')],
    ['wtpt', xyzTag(...D50)],
    ['rXYZ', xyzTag(...PRIMARIES.r)],
    ['gXYZ', xyzTag(...PRIMARIES.g)],
    ['bXYZ', xyzTag(...PRIMARIES.b)],
    ['rTRC', curveTag(trc)],
    ['gTRC', curveTag(trc)],
    ['bTRC', curveTag(trc)],
    ['cprt', textTag('No copyright: generated from the published sRGB transfer function and primaries.')],
  ];

  const tableSize = 4 + tags.length * 12;
  let offset = HEADER_SIZE + tableSize;
  const entries: { signature: string; offset: number; size: number }[] = [];
  const blobs: Uint8Array[] = [];
  for (const [signature, data] of tags) {
    entries.push({ signature, offset, size: data.length });
    const padded = pad4(data);
    blobs.push(padded);
    offset += padded.length;
  }
  const totalSize = offset;

  const profile = new Uint8Array(totalSize);
  const view = new DataView(profile.buffer);

  // Header (128 bytes). Fields left at zero (CMM type, platform, flags, manufacturer,
  // model, attributes, creator, profile ID) are all legitimately optional/unknown here.
  view.setUint32(0, totalSize, false);
  profile.set([0x02, 0x10, 0x00, 0x00], 8); // profile version 2.1.0
  profile.set(ascii('mntr'), 12); // device class: display
  profile.set(ascii('RGB '), 16); // colour space
  profile.set(ascii('XYZ '), 20); // profile connection space
  view.setUint16(24, 2026, false); // creation date, otherwise unused by any reader
  view.setUint16(26, 1, false);
  view.setUint16(28, 1, false);
  profile.set(ascii('acsp'), 36); // profile file signature
  view.setInt32(68, s15Fixed16(D50[0]), false); // PCS illuminant
  view.setInt32(72, s15Fixed16(D50[1]), false);
  view.setInt32(76, s15Fixed16(D50[2]), false);

  // Tag table.
  view.setUint32(HEADER_SIZE, tags.length, false);
  for (const [index, entry] of entries.entries()) {
    const at = HEADER_SIZE + 4 + index * 12;
    profile.set(ascii(entry.signature), at);
    view.setUint32(at + 4, entry.offset, false);
    view.setUint32(at + 8, entry.size, false);
  }

  // Tag data.
  let at = HEADER_SIZE + tableSize;
  for (const blob of blobs) {
    profile.set(blob, at);
    at += blob.length;
  }

  return profile;
}
