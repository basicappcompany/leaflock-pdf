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
] as const satisfies readonly { id: string; slug: string; toolId: ToolId; preset?: Record<string, string> }[];

export type LandingId = (typeof landings)[number]['id'];
