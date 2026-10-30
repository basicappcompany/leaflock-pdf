import type { OverlayImage } from '../../../lib/edit/overlays';

/** An image ready to place: bytes for the worker, a URL for the preview, and its pixel size. */
export interface PlacedImage extends OverlayImage {
  url: string;
  width: number;
  height: number;
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error('Canvas export failed'));
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, 'image/png');
  });
}

export async function placedFromCanvas(canvas: HTMLCanvasElement): Promise<PlacedImage> {
  const bytes = await canvasToPng(canvas);
  return {
    bytes,
    type: 'png',
    url: URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'image/png' })),
    width: canvas.width,
    height: canvas.height,
  };
}

/** Makes near-white pixels transparent, fading the edge so strokes stay smooth. */
export function removeWhiteBackground(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = data.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const lightness = Math.min(pixels[i]!, pixels[i + 1]!, pixels[i + 2]!);
    if (lightness > 235) pixels[i + 3] = 0;
    else if (lightness > 180) pixels[i + 3] = Math.round((pixels[i + 3]! * (235 - lightness)) / 55);
  }
  context.putImageData(data, 0, 0);
}

/** Crops away fully transparent margins (plus a little padding). Returns the same canvas if it's empty. */
export function trimTransparent(canvas: HTMLCanvasElement, padding = 4): HTMLCanvasElement {
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  let top = height;
  let left = width;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]! > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return canvas;
  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(width - 1, right + padding);
  bottom = Math.min(height - 1, bottom + padding);
  const trimmed = document.createElement('canvas');
  trimmed.width = right - left + 1;
  trimmed.height = bottom - top + 1;
  trimmed.getContext('2d')!.drawImage(canvas, left, top, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
  return trimmed;
}

/** True when a canvas has no visible pixels. */
export function isBlank(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) if (data[i]! > 8) return false;
  return true;
}

/**
 * Reads a picked image. PNG and JPEG are used as they are; anything else the browser can
 * decode (WebP, GIF, BMP…) is converted to PNG. Optionally clears a white background.
 */
export async function imageFromFile(file: File, options: { removeWhite?: boolean } = {}): Promise<PlacedImage> {
  const bitmap = await createImageBitmap(file);
  const direct = !options.removeWhite && (file.type === 'image/png' || file.type === 'image/jpeg');
  if (direct) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return {
      bytes,
      type: file.type === 'image/png' ? 'png' : 'jpeg',
      url: URL.createObjectURL(file),
      ...size,
    };
  }
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
  bitmap.close();
  if (options.removeWhite) removeWhiteBackground(canvas);
  return placedFromCanvas(options.removeWhite ? trimTransparent(canvas) : canvas);
}
