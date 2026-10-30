import type { OpContext } from '../types';
import { addPageLabels } from './addPageLabels';
import { addPageNumbers } from './addPageNumbers';
import { addTextLayer } from './addTextLayer';
import { addWatermark } from './addWatermark';
import { assemble } from './assemble';
import { batesNumber } from './batesNumber';
import { blocksToPdf } from './blocksToPdf';
import { compress } from './compress';
import { crop } from './crop';
import { editMetadata } from './editMetadata';
import { extractImages } from './extractImages';
import { fillForm } from './fillForm';
import { flatten } from './flatten';
import { imagesToPdf } from './imagesToPdf';
import { imposePages } from './imposePages';
import { merge } from './merge';
import { pdfToPdfA } from './pdfToPdfA';
import { placeOverlays } from './placeOverlays';
import { protect } from './protect';
import { rasterizePages } from './rasterizePages';
import { readFormFields } from './readFormFields';
import { readMetadata } from './readMetadata';
import { removeAnnotations } from './removeAnnotations';
import { removeMetadata } from './removeMetadata';
import { repair } from './repair';
import { split } from './split';
import { tableToPdf } from './tableToPdf';
import { unlock } from './unlock';
import { zip } from './zip';

/**
 * Every operation the PDF worker can run, by name. Each takes one serialisable
 * args object and returns a serialisable result (usually `OutputFile[]`).
 */
export const ops = {
  addPageLabels,
  addPageNumbers,
  addTextLayer,
  addWatermark,
  assemble,
  batesNumber,
  blocksToPdf,
  compress,
  crop,
  editMetadata,
  extractImages,
  fillForm,
  flatten,
  imagesToPdf,
  imposePages,
  merge,
  pdfToPdfA,
  placeOverlays,
  protect,
  rasterizePages,
  readFormFields,
  readMetadata,
  removeAnnotations,
  removeMetadata,
  repair,
  split,
  tableToPdf,
  unlock,
  zip,
} satisfies Record<string, (args: never, ctx: OpContext) => Promise<unknown>>;

export type Ops = typeof ops;
export type OpName = keyof Ops;
export type OpArgs<K extends OpName> = Parameters<Ops[K]>[0];
export type OpResult<K extends OpName> = Awaited<ReturnType<Ops[K]>>;
