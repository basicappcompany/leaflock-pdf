import type { Block, PageStructure, Span } from './structure';
import { ToolError } from '../pdf/errors';
import type { OutputFile } from '../pdf/types';

export interface ToMarkdownArgs {
  /** One entry per PDF page, as inferred by `src/lib/convert/structure.ts`. */
  pages: PageStructure[];
  outputName: string;
}

export interface ToMarkdownResult {
  file: OutputFile;
  paragraphs: number;
  headings: number;
  listItems: number;
  /** Pages whose reading order is probably wrong because they are laid out in columns. */
  columnPages: number[];
}

const MARKDOWN_TYPE = 'text/markdown';

/** Characters CommonMark would otherwise read as formatting, escaped so PDF text that
 * happens to contain them (an asterisked footnote, a bracketed citation) stays literal. */
function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_[\]]/g, (char) => `\\${char}`);
}

/** Adjacent spans with the same bold/italic combination render as one wrapped run,
 * rather than one `**`-pair per run pdf.js happened to split the text into. */
function mergeSpans(spans: Span[]): Span[] {
  const merged: Span[] = [];
  for (const span of spans) {
    const last = merged[merged.length - 1];
    if (last && last.bold === span.bold && last.italic === span.italic) last.text += span.text;
    else merged.push({ ...span });
  }
  return merged;
}

function renderSpans(spans: Span[]): string {
  return mergeSpans(spans)
    .map((span) => {
      const text = escapeMarkdown(span.text);
      if (span.bold && span.italic) return `***${text}***`;
      if (span.bold) return `**${text}**`;
      if (span.italic) return `*${text}*`;
      return text;
    })
    .join('');
}

/**
 * Writes an inferred document outline out as Markdown (CommonMark). The same
 * `Block`/`Span` shape `docx.ts` writes, so this is purely a different renderer for
 * work `structure.ts` already does — no new inference, no new dependency, and nothing
 * to place on a worker boundary at all, since it is a few lines of string-building.
 *
 * Markdown has no notion of a page, so unlike `toDocx` there is no page-break option
 * here — there is nothing honest to offer for it.
 */
export function toMarkdown({ pages, outputName }: ToMarkdownArgs): ToMarkdownResult {
  const counts = { paragraphs: 0, headings: 0, listItems: 0 };
  const columnPages: number[] = [];
  const lines: string[] = [];

  /** Markdown auto-numbers an ordered list regardless of the literal text, so the
   * counter only needs to reset when a run of ordered items ends. */
  let orderedCounter = 0;

  function render(block: Block) {
    const text = renderSpans(block.spans);
    if (block.kind === 'heading') {
      counts.headings++;
      orderedCounter = 0;
      lines.push(`${'#'.repeat(block.level)} ${text}`, '');
    } else if (block.kind === 'listItem') {
      counts.listItems++;
      if (block.ordered) {
        orderedCounter++;
        lines.push(`${orderedCounter}. ${text}`);
      } else {
        orderedCounter = 0;
        lines.push(`- ${text}`);
      }
    } else {
      counts.paragraphs++;
      orderedCounter = 0;
      lines.push(text, '');
    }
  }

  pages.forEach((page, index) => {
    if (page.columnsSuspected) columnPages.push(index + 1);

    let previousWasListItem = false;
    for (const block of page.blocks) {
      // A blank line after a finished list, so CommonMark doesn't fuse it with a
      // following paragraph that happens to start with a character it could read as
      // another list marker.
      if (previousWasListItem && block.kind !== 'listItem') lines.push('');
      render(block);
      previousWasListItem = block.kind === 'listItem';
    }
  });

  if (counts.paragraphs + counts.headings + counts.listItems === 0) throw new ToolError('no-text');

  // Collapse the incidental run of blank lines a heading/paragraph leaves behind into
  // at most one, so the file isn't full of double gaps.
  const text = lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    file: { name: outputName, bytes: new TextEncoder().encode(`${text}\n`) as Uint8Array<ArrayBuffer>, type: MARKDOWN_TYPE },
    ...counts,
    columnPages,
  };
}
