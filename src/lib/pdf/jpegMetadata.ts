/**
 * Removes metadata from a JPEG without re-encoding it: EXIF (camera, time, GPS location),
 * XMP, Photoshop/IPTC and comments. Keeps what affects how the image looks: JFIF (APP0),
 * the ICC colour profile (APP2) and Adobe's colour-transform marker (APP14).
 *
 * Read the EXIF orientation first if you need it; it goes with the rest of EXIF.
 * Returns the input unchanged if it doesn't look like a well-formed JPEG.
 */
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;

  const kept: Uint8Array[] = [bytes.subarray(0, 2)];
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return bytes;
    const marker = bytes[offset + 1]!;
    // Padding: 0xFF may repeat before a marker.
    if (marker === 0xff) {
      offset++;
      continue;
    }
    // Start of scan: the compressed image data follows; keep everything from here on.
    if (marker === 0xda) {
      kept.push(bytes.subarray(offset));
      return concat(kept);
    }
    const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
    const end = offset + 2 + length;
    if (length < 2 || end > bytes.length) return bytes;
    if (!isMetadata(marker)) kept.push(bytes.subarray(offset, end));
    offset = end;
  }
  return bytes;
}

/** APP1 (EXIF, XMP), APP3–APP13 and APP15 (vendor and IPTC data), and COM (comments). */
function isMetadata(marker: number): boolean {
  if (marker === 0xfe) return true;
  if (marker < 0xe0 || marker > 0xef) return false;
  return marker !== 0xe0 && marker !== 0xe2 && marker !== 0xee;
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
