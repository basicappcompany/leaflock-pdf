export interface PixelDiff {
  /** RGBA overlay: the original page faded, with changed pixels in the highlight colour. */
  overlay: Uint8ClampedArray;
  width: number;
  height: number;
  /** Share of pixels that differ, 0 to 1. */
  changed: number;
}

export interface Rgba {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** How different two pixels must be (sum of RGB differences) to count as changed; ignores anti-aliasing noise. */
const THRESHOLD = 96;

/**
 * Compares two renders pixel by pixel. They may differ in size: the overlay covers
 * the larger of the two, and area only one of them has counts as changed.
 */
export function diffPixels(before: Rgba, after: Rgba, highlight: [number, number, number]): PixelDiff {
  const width = Math.max(before.width, after.width);
  const height = Math.max(before.height, after.height);
  const overlay = new Uint8ClampedArray(width * height * 4);
  let changed = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const out = (y * width + x) * 4;
      const inBefore = x < before.width && y < before.height;
      const inAfter = x < after.width && y < after.height;
      const b = (y * before.width + x) * 4;
      const a = (y * after.width + x) * 4;

      let differs: boolean;
      if (inBefore && inAfter) {
        const delta =
          Math.abs(before.data[b]! - after.data[a]!) +
          Math.abs(before.data[b + 1]! - after.data[a + 1]!) +
          Math.abs(before.data[b + 2]! - after.data[a + 2]!);
        differs = delta > THRESHOLD;
      } else {
        differs = inBefore || inAfter;
      }

      if (differs) {
        changed++;
        overlay[out] = highlight[0];
        overlay[out + 1] = highlight[1];
        overlay[out + 2] = highlight[2];
      } else {
        // Faded greyscale of the original, so the highlights stand out.
        const source = inBefore ? before.data : after.data;
        const i = inBefore ? b : a;
        const grey = 0.299 * source[i]! + 0.587 * source[i + 1]! + 0.114 * source[i + 2]!;
        const faded = 255 - (255 - grey) * 0.3;
        overlay[out] = faded;
        overlay[out + 1] = faded;
        overlay[out + 2] = faded;
      }
      overlay[out + 3] = 255;
    }
  }

  return { overlay, width, height, changed: changed / (width * height) };
}
