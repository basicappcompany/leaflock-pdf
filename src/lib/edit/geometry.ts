import type { PDFPage } from '@cantoo/pdf-lib';

/**
 * The page as a viewer shows it: its CropBox, turned by the page's /Rotate.
 * "Display" coordinates are in points with the origin at the top-left of what the
 * viewer shows, x to the right and y down, so UI positions map straight onto it.
 */
export interface PageFrame {
  /** Displayed width and height in points. */
  width: number;
  height: number;
  /** The page's /Rotate, normalised to 0, 90, 180 or 270 (clockwise, as viewers apply it). */
  rotation: 0 | 90 | 180 | 270;
  /** Display point → PDF user-space point. */
  toUser(u: number, v: number): { x: number; y: number };
}

export function pageFrame(page: PDFPage): PageFrame {
  const crop = page.getCropBox();
  const rotation = ((((page.getRotation().angle % 360) + 360) % 360) as 0 | 90 | 180 | 270);
  const { x: cx, y: cy, width: W, height: H } = crop;
  const sideways = rotation === 90 || rotation === 270;

  return {
    width: sideways ? H : W,
    height: sideways ? W : H,
    rotation,
    toUser(u, v) {
      // Undo the viewer's clockwise rotation to get top-left based coordinates on the unrotated crop box.
      let u0: number;
      let v0: number;
      switch (rotation) {
        case 0:
          [u0, v0] = [u, v];
          break;
        case 90:
          [u0, v0] = [v, H - u];
          break;
        case 180:
          [u0, v0] = [W - u, H - v];
          break;
        case 270:
          [u0, v0] = [W - v, u];
          break;
      }
      return { x: cx + u0, y: cy + H - v0 };
    },
  };
}

/** A box placed on the displayed page: centre point, size, and an extra counter-clockwise angle. */
export interface DisplayBox {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  /** Degrees, counter-clockwise as the reader sees it. */
  angle?: number;
}

/**
 * Where to draw something so it appears in `box`, upright to the reader.
 * Returns the user-space position of a point given in the box's own coordinates
 * (origin bottom-left, y up), and the rotation to pass to pdf-lib's draw calls.
 */
export function placeInBox(frame: PageFrame, box: DisplayBox, localX = 0, localY = 0): { x: number; y: number; rotate: number } {
  const center = frame.toUser(box.centerX, box.centerY);
  // Content drawn rotated counter-clockwise by the page's rotation appears upright after the viewer turns it back.
  const rotate = frame.rotation + (box.angle ?? 0);
  const radians = (rotate * Math.PI) / 180;
  const dx = localX - box.width / 2;
  const dy = localY - box.height / 2;
  return {
    x: center.x + dx * Math.cos(radians) - dy * Math.sin(radians),
    y: center.y + dx * Math.sin(radians) + dy * Math.cos(radians),
    rotate,
  };
}

/** A box given by its top-left corner in display coordinates. */
export function boxFromTopLeft(left: number, top: number, width: number, height: number, angle = 0): DisplayBox {
  return { centerX: left + width / 2, centerY: top + height / 2, width, height, angle };
}

/** "#1a2b3c" → { r, g, b } in 0–1, for pdf-lib's rgb(). Invalid input gives black. */
export function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return { r: 0, g: 0, b: 0 };
  const value = parseInt(match[1]!, 16);
  return { r: ((value >> 16) & 255) / 255, g: ((value >> 8) & 255) / 255, b: (value & 255) / 255 };
}
