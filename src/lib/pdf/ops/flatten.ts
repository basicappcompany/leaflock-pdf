import {
  concatTransformationMatrix,
  drawObject,
  PDFArray,
  PDFDict,
  PDFName,
  PDFNumber,
  PDFRef,
  PDFStream,
  popGraphicsState,
  pushGraphicsState,
  type PDFDocument,
  type PDFPage,
} from '@cantoo/pdf-lib';
import { pruneUnreachableObjects } from '../../secure/prune';
import { ToolError } from '../errors';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface FlattenArgs {
  input: PdfInput;
  /** Also flatten comments, highlights, stamps and drawings, not just form fields. */
  annotations: boolean;
  outputName: string;
}

export interface FlattenResult {
  file: OutputFile;
  fields: number;
  annotations: number;
}

/** Annotation types that are interactive rather than visible marks, so flattening leaves them alone. */
const keepTypes = new Set(['Link', 'Widget', 'Popup']);

/** Annotation flag bits (PDF 32000-1, table 165). */
const HIDDEN = 1 << 1;
const NO_VIEW = 1 << 5;

/**
 * Turns form fields (and optionally annotations) into ordinary page content.
 * ToolError 'nothing-to-flatten' when there's neither.
 */
export async function flatten({ input, annotations, outputName }: FlattenArgs, ctx: OpContext): Promise<FlattenResult> {
  const doc = await loadPdf(input);

  const form = doc.getForm();
  const fields = form.getFields().length;
  if (fields > 0) {
    try {
      form.flatten({ updateFieldAppearances: true });
    } catch {
      // Some fields use fonts or settings pdf-lib can't regenerate; keep their existing look.
      form.flatten({ updateFieldAppearances: false });
    }
  }

  let flattenedAnnotations = 0;
  if (annotations) {
    const pages = doc.getPages();
    for (const [index, page] of pages.entries()) {
      flattenedAnnotations += flattenPageAnnotations(doc, page);
      ctx.progress((index + 1) / pages.length);
    }
  }

  if (fields === 0 && flattenedAnnotations === 0) {
    throw new ToolError('nothing-to-flatten', { name: input.name });
  }

  pruneUnreachableObjects(doc);
  markProduced(doc);
  return {
    file: pdfFile(outputName, await doc.save({ rewrite: true })),
    fields,
    annotations: flattenedAnnotations,
  };
}

function flattenPageAnnotations(doc: PDFDocument, page: PDFPage): number {
  const annots = page.node.Annots();
  if (!annots) return 0;

  const toRemove: number[] = [];
  let flattened = 0;
  for (let i = 0; i < annots.size(); i++) {
    const entry = annots.get(i);
    const annot = entry instanceof PDFRef ? doc.context.lookup(entry) : entry;
    if (!(annot instanceof PDFDict)) continue;
    const subtype = annot.get(PDFName.of('Subtype'));
    const type = subtype instanceof PDFName ? subtype.decodeText() : '';
    if (type === 'Popup') {
      // Popups only show a comment's text; once the comment is flattened they have nothing to attach to.
      toRemove.push(i);
      continue;
    }
    if (keepTypes.has(type)) continue;

    const flags = annot.get(PDFName.of('F'));
    const hidden = flags instanceof PDFNumber && (flags.asNumber() & (HIDDEN | NO_VIEW)) !== 0;
    const appearance = hidden ? undefined : normalAppearance(doc, annot);
    if (appearance) {
      drawAppearance(doc, page, annot, appearance);
      flattened++;
    }
    // Invisible annotations, and ones without an appearance, would vanish on flattening anyway.
    toRemove.push(i);
  }

  for (const i of toRemove.reverse()) annots.remove(i);
  return flattened;
}

/** The annotation's normal appearance stream (for its current state, if it has several). */
function normalAppearance(doc: PDFDocument, annot: PDFDict): PDFRef | undefined {
  const ap = doc.context.lookup(annot.get(PDFName.of('AP')));
  if (!(ap instanceof PDFDict)) return undefined;
  let normal = ap.get(PDFName.of('N'));
  const resolved = doc.context.lookup(normal);
  if (resolved instanceof PDFDict && !(resolved instanceof PDFStream)) {
    const state = annot.get(PDFName.of('AS'));
    normal = state instanceof PDFName ? resolved.get(state) : undefined;
  }
  if (normal instanceof PDFStream) normal = doc.context.register(normal);
  if (!(normal instanceof PDFRef)) return undefined;
  const stream = doc.context.lookup(normal);
  if (!(stream instanceof PDFStream)) return undefined;
  stream.dict.set(PDFName.of('Type'), PDFName.of('XObject'));
  stream.dict.set(PDFName.of('Subtype'), PDFName.of('Form'));
  return normal;
}

/**
 * Paints an appearance stream into the annotation's rectangle, the way viewers do:
 * the form's BBox, transformed by its Matrix, is fitted to /Rect (PDF 32000-1, 12.5.5).
 */
function drawAppearance(doc: PDFDocument, page: PDFPage, annot: PDFDict, appearanceRef: PDFRef) {
  const stream = doc.context.lookup(appearanceRef, PDFStream);
  const rect = numbers(doc.context.lookup(annot.get(PDFName.of('Rect'))), [0, 0, 0, 0]);
  const bbox = numbers(doc.context.lookup(stream.dict.get(PDFName.of('BBox'))), [0, 0, 1, 1]);
  const matrix = numbers(doc.context.lookup(stream.dict.get(PDFName.of('Matrix'))), [1, 0, 0, 1, 0, 0]);

  const [a, b, c, d, e, f] = matrix as [number, number, number, number, number, number];
  const corners = [
    [bbox[0]!, bbox[1]!],
    [bbox[2]!, bbox[1]!],
    [bbox[0]!, bbox[3]!],
    [bbox[2]!, bbox[3]!],
  ].map(([x, y]) => [a * x! + c * y! + e, b * x! + d * y! + f] as const);
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  const box = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };

  const target = {
    x: Math.min(rect[0]!, rect[2]!),
    y: Math.min(rect[1]!, rect[3]!),
    width: Math.abs(rect[2]! - rect[0]!),
    height: Math.abs(rect[3]! - rect[1]!),
  };
  if (box.width === 0 || box.height === 0 || target.width === 0 || target.height === 0) return;

  const sx = target.width / box.width;
  const sy = target.height / box.height;
  const name = page.node.newXObject('FlatAnnot', appearanceRef);
  page.pushOperators(
    pushGraphicsState(),
    concatTransformationMatrix(sx, 0, 0, sy, target.x - box.x * sx, target.y - box.y * sy),
    drawObject(name),
    popGraphicsState(),
  );
}

function numbers(value: unknown, fallback: number[]): number[] {
  if (!(value instanceof PDFArray)) return fallback;
  const result = value.asArray().map((item) => (item instanceof PDFNumber ? item.asNumber() : NaN));
  return result.length === fallback.length && result.every(Number.isFinite) ? result : fallback;
}
