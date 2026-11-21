export type ToolCategory = 'organize' | 'convert' | 'edit' | 'secure';

export interface ToolDefinition {
  /** Stable internal id; also the key for the tool's strings and UI component. */
  id: string;
  /** URL path, without locale prefix. Never change a published slug: it breaks search rankings. */
  slug: string;
  category: ToolCategory;
  /** Pro tools are free during early access; the licence check comes with payments. */
  /**
   * Which plan a tool belongs to. `practice` was added 30 October 2026 (roadmap 4.9):
   * the six professional tools moved out of Pro rather than being re-chosen, because a
   * $24 Pro containing redaction and Bates would leave Practice with nothing to sell.
   * Ranked in src/lib/proAccess.ts — practice includes pro, pro does not include practice.
   */
  tier: 'free' | 'pro' | 'practice';
}

export const categories: readonly ToolCategory[] = ['organize', 'convert', 'edit', 'secure'];

export const tools = [
  { id: 'merge', slug: 'merge-pdf', category: 'organize', tier: 'free' },
  { id: 'split', slug: 'split-pdf', category: 'organize', tier: 'free' },
  { id: 'removePages', slug: 'remove-pages', category: 'organize', tier: 'free' },
  { id: 'extractPages', slug: 'extract-pages', category: 'organize', tier: 'free' },
  { id: 'organize', slug: 'organize-pdf', category: 'organize', tier: 'free' },
  { id: 'rotate', slug: 'rotate-pdf', category: 'organize', tier: 'free' },
  { id: 'crop', slug: 'crop-pdf', category: 'organize', tier: 'free' },
  { id: 'mixPages', slug: 'mix-pdf-pages', category: 'organize', tier: 'free' },
  { id: 'nUp', slug: 'multiple-pages-per-sheet', category: 'organize', tier: 'free' },
  { id: 'booklet', slug: 'booklet-pdf', category: 'organize', tier: 'free' },

  { id: 'wordToPdf', slug: 'word-to-pdf', category: 'convert', tier: 'free' },
  { id: 'excelToPdf', slug: 'excel-to-pdf', category: 'convert', tier: 'free' },
  { id: 'csvToPdf', slug: 'csv-to-pdf', category: 'convert', tier: 'free' },
  { id: 'rtfToPdf', slug: 'rtf-to-pdf', category: 'convert', tier: 'free' },
  { id: 'imagesToPdf', slug: 'jpg-to-pdf', category: 'convert', tier: 'free' },
  { id: 'pdfToImages', slug: 'pdf-to-jpg', category: 'convert', tier: 'free' },
  { id: 'pdfToText', slug: 'pdf-to-text', category: 'convert', tier: 'free' },
  { id: 'extractImages', slug: 'extract-images-from-pdf', category: 'convert', tier: 'free' },
  { id: 'pdfToMarkdown', slug: 'pdf-to-markdown', category: 'convert', tier: 'free' },
  { id: 'pdfToWord', slug: 'pdf-to-word', category: 'convert', tier: 'free' },
  { id: 'pdfToExcel', slug: 'pdf-to-excel', category: 'convert', tier: 'free' },
  { id: 'extractTables', slug: 'extract-tables-from-pdf', category: 'convert', tier: 'practice' },
  { id: 'ocr', slug: 'ocr-pdf', category: 'convert', tier: 'free' },
  { id: 'scan', slug: 'scan-to-pdf', category: 'convert', tier: 'free' },

  { id: 'pageNumbers', slug: 'add-page-numbers', category: 'edit', tier: 'free' },
  { id: 'pageLabels', slug: 'add-page-labels', category: 'edit', tier: 'free' },
  { id: 'batesNumber', slug: 'bates-numbering', category: 'edit', tier: 'practice' },
  { id: 'watermark', slug: 'add-watermark', category: 'edit', tier: 'free' },
  { id: 'sign', slug: 'sign-pdf', category: 'edit', tier: 'free' },
  { id: 'edit', slug: 'edit-pdf', category: 'edit', tier: 'free' },
  { id: 'fillForm', slug: 'fill-pdf-form', category: 'edit', tier: 'free' },
  { id: 'editMetadata', slug: 'edit-metadata', category: 'edit', tier: 'free' },
  { id: 'redact', slug: 'redact-pdf', category: 'edit', tier: 'practice' },

  { id: 'protect', slug: 'protect-pdf', category: 'secure', tier: 'free' },
  { id: 'unlock', slug: 'unlock-pdf', category: 'secure', tier: 'free' },
  { id: 'compress', slug: 'compress-pdf', category: 'secure', tier: 'free' },
  { id: 'repair', slug: 'repair-pdf', category: 'secure', tier: 'free' },
  { id: 'flatten', slug: 'flatten-pdf', category: 'secure', tier: 'free' },
  { id: 'removeMetadata', slug: 'remove-metadata', category: 'secure', tier: 'free' },
  { id: 'removeAnnotations', slug: 'remove-annotations', category: 'secure', tier: 'free' },
  { id: 'pdfToPdfA', slug: 'pdf-to-pdfa', category: 'secure', tier: 'practice' },
  { id: 'compare', slug: 'compare-pdf', category: 'secure', tier: 'practice' },
  { id: 'batch', slug: 'batch-pdf', category: 'secure', tier: 'practice' },
] as const satisfies readonly ToolDefinition[];

export type ToolId = (typeof tools)[number]['id'];

export function toolById(id: ToolId): (typeof tools)[number] {
  return tools.find((tool) => tool.id === id)!;
}

/**
 * Search landing pages: an existing tool under another name, optionally with options preset.
 * Their text lives in src/i18n/<locale>/landings.ts. Keep these few and genuinely distinct.
 */
export const landings = [
  { id: 'pngToPdf', slug: 'png-to-pdf', toolId: 'imagesToPdf' },
  { id: 'webpToPdf', slug: 'webp-to-pdf', toolId: 'imagesToPdf' },
  { id: 'pdfToPng', slug: 'pdf-to-png', toolId: 'pdfToImages', preset: { format: 'png' } },
  { id: 'reversePages', slug: 'reverse-pdf-pages', toolId: 'organize', preset: { apply: 'reverse' } },
  { id: 'addBlankPage', slug: 'add-blank-page-to-pdf', toolId: 'organize' },
  { id: 'combinePdf', slug: 'combine-pdf', toolId: 'merge' },
  { id: 'deletePdfPages', slug: 'delete-pdf-pages', toolId: 'removePages' },
  { id: 'pdfPasswordRemover', slug: 'pdf-password-remover', toolId: 'unlock' },
  { id: 'rearrangePdfPages', slug: 'rearrange-pdf-pages', toolId: 'organize' },
  { id: 'reducePdfSize', slug: 'reduce-pdf-size', toolId: 'compress' },
  { id: 'compressPdfTo200kb', slug: 'compress-pdf-to-200kb', toolId: 'compress', preset: { mode: 'size', size: '200', unit: 'KB' } },
  { id: 'compressPdfTo1mb', slug: 'compress-pdf-to-1mb', toolId: 'compress', preset: { mode: 'size', size: '1', unit: 'MB' } },

  // English-only landings (22 November 2026). Their text is in src/i18n/en/landingsMore.ts, outside the catalogue every
  // locale must mirror, so none needs translating: a non-English URL serves the English page and is noindex.
  // Privacy intent: the query is "without uploading".
  { id: 'mergePdfWithoutUpload', slug: 'merge-pdf-without-upload', toolId: 'merge', enOnly: true },
  { id: 'compressPdfWithoutUpload', slug: 'compress-pdf-without-upload', toolId: 'compress', enOnly: true },
  { id: 'splitPdfWithoutUpload', slug: 'split-pdf-without-upload', toolId: 'split', enOnly: true },
  { id: 'pdfToWordWithoutUpload', slug: 'pdf-to-word-without-upload', toolId: 'pdfToWord', enOnly: true },
  { id: 'signPdfWithoutUpload', slug: 'sign-pdf-without-upload', toolId: 'sign', enOnly: true },
  { id: 'ocrPdfWithoutUpload', slug: 'ocr-pdf-without-upload', toolId: 'ocr', enOnly: true },
  // A size the file has to fit under.
  { id: 'compressPdfTo100kb', slug: 'compress-pdf-to-100kb', toolId: 'compress', preset: { mode: 'size', size: '100', unit: 'KB' }, enOnly: true },
  { id: 'compressPdfTo500kb', slug: 'compress-pdf-to-500kb', toolId: 'compress', preset: { mode: 'size', size: '500', unit: 'KB' }, enOnly: true },
  { id: 'compressPdfTo2mb', slug: 'compress-pdf-to-2mb', toolId: 'compress', preset: { mode: 'size', size: '2', unit: 'MB' }, enOnly: true },
  { id: 'compressPdfTo5mb', slug: 'compress-pdf-to-5mb', toolId: 'compress', preset: { mode: 'size', size: '5', unit: 'MB' }, enOnly: true },
  { id: 'compressPdfForEmail', slug: 'compress-pdf-for-email', toolId: 'compress', preset: { mode: 'size', size: '10', unit: 'MB' }, enOnly: true },
  // The same job under the word people search for.
  { id: 'joinPdf', slug: 'join-pdf', toolId: 'merge', enOnly: true },
  { id: 'shrinkPdf', slug: 'shrink-pdf', toolId: 'compress', enOnly: true },
  { id: 'passwordProtectPdf', slug: 'password-protect-pdf', toolId: 'protect', enOnly: true },
  { id: 'encryptPdf', slug: 'encrypt-pdf', toolId: 'protect', enOnly: true },
  { id: 'separatePdfPages', slug: 'separate-pdf-pages', toolId: 'split', enOnly: true },
  { id: 'fixCorruptedPdf', slug: 'fix-corrupted-pdf', toolId: 'repair', enOnly: true },
  { id: 'cropPdfMargins', slug: 'crop-pdf-margins', toolId: 'crop', enOnly: true },
  { id: 'removePdfComments', slug: 'remove-pdf-comments', toolId: 'removeAnnotations', enOnly: true },
  { id: 'compareTwoPdfs', slug: 'compare-two-pdfs', toolId: 'compare', enOnly: true },
  // A file type named in the query.
  { id: 'imageToPdf', slug: 'image-to-pdf', toolId: 'imagesToPdf', enOnly: true },
  { id: 'gifToPdf', slug: 'gif-to-pdf', toolId: 'imagesToPdf', enOnly: true },
  { id: 'pdfToJpeg', slug: 'pdf-to-jpeg', toolId: 'pdfToImages', enOnly: true },
  { id: 'pdfToDocx', slug: 'pdf-to-docx', toolId: 'pdfToWord', enOnly: true },
  { id: 'docxToPdf', slug: 'docx-to-pdf', toolId: 'wordToPdf', enOnly: true },
  { id: 'xlsxToPdf', slug: 'xlsx-to-pdf', toolId: 'excelToPdf', enOnly: true },
  { id: 'pdfToTxt', slug: 'pdf-to-txt', toolId: 'pdfToText', enOnly: true },
  { id: 'makePdfSearchable', slug: 'make-pdf-searchable', toolId: 'ocr', enOnly: true },
] as const satisfies readonly { id: string; slug: string; toolId: ToolId; preset?: Record<string, string>; enOnly?: boolean }[];

export type LandingId = (typeof landings)[number]['id'];
/** Landings whose text exists in English only: no entry in the locale catalogues, and noindex outside English. */
export type EnglishOnlyLandingId = Extract<(typeof landings)[number], { enOnly: true }>['id'];
/** Landings every translated locale has to carry text for. */
export type TranslatedLandingId = Exclude<LandingId, EnglishOnlyLandingId>;
