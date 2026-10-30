/**
 * Centres for a repeated watermark covering a page of `pageWidth` × `pageHeight`,
 * spaced by the mark's rotated footprint and offset brick-style on alternate rows.
 * Shared by the worker and the live preview so both place tiles identically.
 */
export function tileCentres(
  pageWidth: number,
  pageHeight: number,
  markWidth: number,
  markHeight: number,
  angle: number,
): [number, number][] {
  const radians = (angle * Math.PI) / 180;
  const footprintW = Math.abs(markWidth * Math.cos(radians)) + Math.abs(markHeight * Math.sin(radians));
  const footprintH = Math.abs(markWidth * Math.sin(radians)) + Math.abs(markHeight * Math.cos(radians));
  const stepX = Math.max(footprintW * 1.4, 36);
  const stepY = Math.max(footprintH * 2, 36);
  const centres: [number, number][] = [];
  let row = 0;
  for (let y = stepY / 2; y < pageHeight + stepY / 2; y += stepY, row++) {
    const offset = row % 2 === 0 ? 0 : stepX / 2;
    for (let x = stepX / 2 - offset; x < pageWidth + stepX / 2; x += stepX) centres.push([x, y]);
  }
  return centres;
}
