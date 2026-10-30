import type { ToolCategory, ToolId } from '../tools/registry';

/**
 * Line art for each tool, as the inside of a 24×24 `<svg>`.
 *
 * Drawn rather than imported: a handful of paths weigh a few hundred bytes, need no
 * request, carry no licence, and take their colour from `currentColor`, so light and
 * dark themes come for free. See src/components/ToolIcon.astro for the wrapper that
 * sets the shared stroke attributes.
 */

/** The document outline most of these are built on, with its folded corner. */
const page = '<path d="M6 3h7l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M13 3v5h5"/>';

export const toolIcons = {
  merge:
    '<rect x="3" y="3" width="9" height="11" rx="1.5"/><path d="M12 7h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-5"/>',
  split:
    '<path d="M11 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h5"/><path d="M15 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3"/><path d="M13 2v20"/>',
  removePages: `${page}<path d="M8.5 15h7"/>`,
  extractPages: `${page}<path d="M9 15h6m0 0-2.5-2.5M15 15l-2.5 2.5"/>`,
  organize:
    '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  rotate:
    '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
  crop: '<path d="M7 2v15a1 1 0 0 0 1 1h14"/><path d="M2 7h15a1 1 0 0 1 1 1v14"/>',
  // A sheet with four pages laid on it — deliberately not four bare squares, which is
  // what `organize` already uses.
  nUp:
    '<rect x="2.5" y="3" width="19" height="18" rx="1.5"/><rect x="5" y="5.5" width="6" height="5.5" rx="0.5"/><rect x="13" y="5.5" width="6" height="5.5" rx="0.5"/><rect x="5" y="13" width="6" height="5.5" rx="0.5"/><rect x="13" y="13" width="6" height="5.5" rx="0.5"/>',
  booklet:
    '<path d="M12 5v15"/><path d="M12 5C9.5 3.5 6 3.5 3 4.5V18c3-1 6.5-1 9 .5"/><path d="M12 5c2.5-1.5 6-1.5 9-.5V18c-3-1-6.5-1-9 .5"/>',
  mixPages:
    '<path d="M3 6h7m0 0L7.5 3.5M10 6 7.5 8.5"/><path d="M21 12h-7m0 0 2.5-2.5M14 12l2.5 2.5"/><path d="M3 18h7m0 0-2.5-2.5M10 18l-2.5 2.5"/>',

  // All four: a source-plus-arrow composition (imagesToPdf's pattern), each source rect
  // suggesting its own format — plain lines for Word, a grid for Excel, a smaller grid
  // for CSV, a bold+italic mark for rich text — so no two of these read as the same icon
  // at a glance, nor as the folded-corner `page` glyph pdfToWord/pdfToExcel use for the
  // opposite direction.
  wordToPdf:
    '<rect x="2" y="3" width="10" height="13" rx="1.5"/><path d="M5 7h4M5 10h4M5 13h2"/><path d="M15 12h7m0 0-2.5-2.5M22 12l-2.5 2.5"/>',
  excelToPdf: '<rect x="2" y="3" width="10" height="13" rx="1.5"/><path d="M4 7h6M4 10h6M4 13h6"/><path d="M15 12h7m0 0-2.5-2.5M22 12l-2.5 2.5"/>',
  csvToPdf: '<rect x="2" y="6" width="10" height="7" rx="1"/><path d="M2 9.5h10M5.3 6v7M8.7 6v7"/><path d="M15 12h7m0 0-2.5-2.5M22 12l-2.5 2.5"/>',
  // A thick bar (bold) beside a slanted one (italic) — abstract rather than literal
  // letterforms, which get illegible at this size.
  rtfToPdf:
    '<rect x="2" y="3" width="10" height="13" rx="1.5"/><path d="M5 7v6" stroke-width="2.5"/><path d="M8.5 7.5 7 12.5"/><path d="M15 12h7m0 0-2.5-2.5M22 12l-2.5 2.5"/>',
  imagesToPdf:
    '<rect x="2" y="4" width="10" height="9" rx="1.5"/><path d="m4 11 2.5-2.5L9 11"/><path d="M14 16h7m0 0-2.5-2.5M21 16l-2.5 2.5"/>',
  pdfToImages:
    '<path d="M4 3h6l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M10 3v4h4"/><rect x="13" y="13" width="9" height="8" rx="1.5"/>',
  pdfToWord: `${page}<path d="m7.5 12 1.5 6 2-4 2 4 1.5-6"/>`,
  pdfToExcel: `${page}<path d="M8 11.5h8M8 15h8M11 11.5v7M14 11.5v7"/>`,
  // A bordered 2x2 grid (not pdfToExcel's plain crossing lines) with a corner pulling
  // free of the page, for "take just the tables out" rather than "convert the page".
  extractTables: `${page}<rect x="8" y="12" width="6" height="5" rx="0.5"/><path d="M11 12v5M8 14.5h6"/><path d="m16.5 20 3-3m-3 0h3v3"/>`,
  pdfToText: `${page}<path d="M8.5 12h7M8.5 15.5h7M8.5 19h4"/>`,
  // A small photo frame (mountain + sun) coming free of the page's corner — distinct
  // from extractTables' grid-with-corner and from pdfToImages' plain rasterized page.
  extractImages: `${page}<rect x="8" y="12.5" width="7" height="5.5" rx="1"/><circle cx="10.2" cy="14.3" r="0.7" fill="currentColor" stroke="none"/><path d="m9 17 2-2 1.5 1.5L15 14l0 3"/>`,
  // A "#" heading mark over a dash — Markdown's own two most recognisable glyphs,
  // distinct from pdfToWord's "W" and pdfToText's plain lines.
  pdfToMarkdown: `${page}<path d="M8.5 12.5h5M8.5 14.5h5M10 11v5.5M12.5 11v5.5"/><path d="M8.5 18.5h4"/>`,
  ocr: `${page}<circle cx="13" cy="14" r="3.5"/><path d="m16 17 2.5 2.5"/>`,
  scan:
    '<path d="M3 8V5.5A1.5 1.5 0 0 1 4.5 4H7M17 4h2.5A1.5 1.5 0 0 1 21 5.5V8M21 16v2.5a1.5 1.5 0 0 1-1.5 1.5H17M7 20H4.5A1.5 1.5 0 0 1 3 18.5V16"/><path d="M3 12h18"/>',

  pageNumbers: `${page}<path d="M9.5 18.5h5"/><path d="M11 13v5.5"/><path d="m9.8 14 1.2-1v5.5"/>`,
  // A rounded tag holding "ii" (roman numerals, not digits) — a reader-UI label rather
  // than pageNumbers' drawn digit, and visually distinct from it for exactly that reason.
  pageLabels: `${page}<rect x="8" y="12.5" width="7" height="5" rx="1.5"/><path d="M10.3 13.7v2.6M12.2 13.7v2.6"/>`,
  // Two stacked pages (a set, not a single document) with a corner stamp, distinguishing
  // it from pageNumbers' single folded-corner page with a centered digit.
  batesNumber:
    '<rect x="5" y="2" width="13" height="16" rx="1.5"/><path d="M3 7v12a1 1 0 0 0 1 1h11" /><rect x="8" y="14" width="8" height="5" rx="0.5" fill="currentColor" stroke="none"/>',
  watermark: `${page}<path d="m8 18 8-8"/><path d="M8 13.5 11.5 10"/><path d="m12.5 18 3.5-3.5"/>`,
  sign: '<path d="M3 17c3.5 0 4-10 7-10s2 9 5 9c2 0 3-2 3-2"/><path d="M3 21h18"/>',
  edit: '<path d="M11 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L13 14l-4 1 1-4Z"/>',
  fillForm: `${page}<path d="m8 13.5 1.5 1.5 3-3"/><path d="M8 19h8"/>`,
  editMetadata: `${page}<path d="M8 13h4M8 16h6"/><path d="M15.5 19.5 20 15l1.5 1.5-4.5 4.5h-1.5Z"/>`,
  redact: `${page}<rect x="8" y="12.5" width="8" height="3.5" rx="0.5" fill="currentColor" stroke="none"/>`,

  protect:
    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2.5"/>',
  unlock:
    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/><path d="M12 14.5v2.5"/>',
  compress:
    '<path d="M4 4h4v4"/><path d="m3 3 5 5"/><path d="M20 4h-4v4"/><path d="m21 3-5 5"/><path d="M4 20h4v-4"/><path d="m3 21 5-5"/><path d="M20 20h-4v-4"/><path d="m21 21-5-5"/>',
  repair:
    '<path d="M14.5 5.5a4.5 4.5 0 0 0 5.8 5.8l-8.3 8.3a2.5 2.5 0 0 1-3.5-3.5Z"/><path d="m16 4 4 4"/>',
  flatten:
    '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
  removeMetadata: `${page}<circle cx="12" cy="15" r="3.5"/><path d="m9.5 17.5 5-5"/>`,
  removeAnnotations:
    '<path d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1Z"/><path d="m9.5 7.5 6 6M15.5 7.5l-6 6"/>',
  // The page with a small circled "A" badge for the archival format — distinct from
  // every other `page`-based icon, none of which has a circle on the page itself.
  pdfToPdfA: `${page}<circle cx="8" cy="15.5" r="4.5"/><path d="M6.6 17.3 8 13.5l1.4 3.8M6.9 16.3h2.2"/>`,
  compare:
    '<rect x="2.5" y="4" width="8" height="16" rx="1.5"/><rect x="13.5" y="4" width="8" height="16" rx="1.5"/><path d="M5 9h3M5 12h3"/><path d="M16 9h3M16 12h3M16 15h3"/>',
  batch:
    '<path d="M7 7V5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-2"/><rect x="4" y="7" width="12" height="13" rx="1.5"/><path d="m7.5 13.5 2 2 3.5-3.5"/>',
} satisfies Record<ToolId, string>;

export const categoryIcons = {
  organize: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  convert: '<path d="M4 8h13m0 0-3.5-3.5M17 8l-3.5 3.5"/><path d="M20 16H7m0 0 3.5-3.5M7 16l3.5 3.5"/>',
  edit: '<path d="M11 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L13 14l-4 1 1-4Z"/>',
  secure: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
} satisfies Record<ToolCategory, string>;
