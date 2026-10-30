/**
 * Reads the EXIF orientation (1-8) of a JPEG, or 1 if it has none.
 * Phones store photos sideways and set this tag instead of rotating the pixels.
 */
export function jpegOrientation(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1;

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00) return 1;
    const length = view.getUint16(offset + 2);
    // APP1 segment starting with "Exif\0\0".
    if (marker === 0xffe1 && offset + 10 <= view.byteLength && view.getUint32(offset + 4) === 0x45786966) {
      return readTiffOrientation(view, offset + 10, offset + 2 + length);
    }
    // Start of scan: image data follows, no more metadata.
    if (marker === 0xffda) return 1;
    offset += 2 + length;
  }
  return 1;
}

function readTiffOrientation(view: DataView, tiff: number, end: number): number {
  if (tiff + 8 > end || end > view.byteLength) return 1;
  const order = view.getUint16(tiff);
  if (order !== 0x4949 && order !== 0x4d4d) return 1;
  const little = order === 0x4949;
  const ifd = tiff + view.getUint32(tiff + 4, little);
  if (ifd + 2 > end) return 1;
  const entries = view.getUint16(ifd, little);
  for (let i = 0; i < entries; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > end) return 1;
    if (view.getUint16(entry, little) === 0x0112) {
      const value = view.getUint16(entry + 8, little);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}
