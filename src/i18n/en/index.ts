import type { EnglishOnlyLandingId, ToolId, TranslatedLandingId } from '../../tools/registry';
import { auth } from './auth';
import { common } from './common';
import { landings } from './landings';
import { landingsMore } from './landingsMore';
import { pricing } from './pricing';
import { verify } from './verify';
import batch from './tools/batch';
import batesNumber from './tools/batesNumber';
import booklet from './tools/booklet';
import compare from './tools/compare';
import compress from './tools/compress';
import crop from './tools/crop';
import csvToPdf from './tools/csvToPdf';
import edit from './tools/edit';
import editMetadata from './tools/editMetadata';
import excelToPdf from './tools/excelToPdf';
import extractImages from './tools/extractImages';
import extractPages from './tools/extractPages';
import extractTables from './tools/extractTables';
import fillForm from './tools/fillForm';
import flatten from './tools/flatten';
import imagesToPdf from './tools/imagesToPdf';
import merge from './tools/merge';
import mixPages from './tools/mixPages';
import nUp from './tools/nUp';
import ocr from './tools/ocr';
import organize from './tools/organize';
import pageLabels from './tools/pageLabels';
import pageNumbers from './tools/pageNumbers';
import pdfToImages from './tools/pdfToImages';
import pdfToMarkdown from './tools/pdfToMarkdown';
import pdfToPdfA from './tools/pdfToPdfA';
import pdfToText from './tools/pdfToText';
import pdfToExcel from './tools/pdfToExcel';
import pdfToWord from './tools/pdfToWord';
import protect from './tools/protect';
import redact from './tools/redact';
import removeAnnotations from './tools/removeAnnotations';
import removeMetadata from './tools/removeMetadata';
import removePages from './tools/removePages';
import repair from './tools/repair';
import rotate from './tools/rotate';
import rtfToPdf from './tools/rtfToPdf';
import scan from './tools/scan';
import sign from './tools/sign';
import split from './tools/split';
import unlock from './tools/unlock';
import watermark from './tools/watermark';
import wordToPdf from './tools/wordToPdf';

/** What every tool's strings must contain, so tool pages can be generated. */
export interface ToolMessagesBase {
  title: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
  howTo: readonly string[];
  /** Shown on the tool page and as FAQPage structured data. */
  faq?: readonly { q: string; a: string }[];
}

const tools = {
  merge,
  split,
  removePages,
  extractPages,
  organize,
  rotate,
  crop,
  mixPages,
  nUp,
  booklet,
  wordToPdf,
  excelToPdf,
  csvToPdf,
  rtfToPdf,
  imagesToPdf,
  pdfToImages,
  pdfToText,
  extractImages,
  pdfToMarkdown,
  pdfToWord,
  pdfToExcel,
  extractTables,
  ocr,
  scan,
  pageNumbers,
  pageLabels,
  batesNumber,
  watermark,
  sign,
  edit,
  fillForm,
  editMetadata,
  redact,
  protect,
  unlock,
  compress,
  repair,
  flatten,
  removeMetadata,
  removeAnnotations,
  pdfToPdfA,
  compare,
  batch,
} satisfies Record<ToolId, ToolMessagesBase>;

/** English strings. This object defines the shape every other language must match. */
landings satisfies Record<TranslatedLandingId, ToolMessagesBase>;
/** The English-only landings are checked here too, but are not part of `en`: locales do not mirror them. */
landingsMore satisfies Record<EnglishOnlyLandingId, ToolMessagesBase>;

export const en = { common, tools, pricing, landings, auth, verify };
