import type { Block, PageStructure } from './structure';
import { ToolError } from '../pdf/errors';
import type { OutputFile } from '../pdf/types';

export interface ToDocxArgs {
  /** One entry per PDF page, as inferred by `src/lib/convert/structure.ts`. */
  pages: PageStructure[];
  outputName: string;
  /** Start each PDF page on a new Word page, rather than letting text reflow. */
  pageBreaks: boolean;
}

export interface ToDocxResult {
  file: OutputFile;
  paragraphs: number;
  headings: number;
  listItems: number;
  /** Pages whose reading order is probably wrong because they are laid out in columns. */
  columnPages: number[];
}

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Writes an inferred document outline out as a .docx.
 *
 * **Not a worker operation, deliberately.** It began as one, and `docx` landed inside the
 * shared job-worker chunk anyway: Vite bundles workers as `iife` by default, a format
 * that cannot code-split, so the dynamic import below was inlined and the worker went
 * from 489KB to 770KB — past the 750KB ceiling in `performance.spec.ts`. Reconfiguring
 * the worker build to split was the wrong trade (see `docs/design.md` §4c for what
 * happened the last time this worker's build config was touched), and nothing here needs
 * a worker: reading the PDF already happens on the main thread through pdf.js, and this
 * step is XML and deflate, not PDF parsing.
 *
 * The import stays dynamic for the main-thread budget instead: at 280KB minified, a
 * static import would land in the tool page's own chunk and blow the 380KB per-page
 * budget. Loaded this way it arrives when somebody converts, and never otherwise.
 *
 * `onProgress` is called per page rather than taking an `OpContext`, since there is no
 * worker boundary to report across.
 */
export async function toDocx(
  { pages, outputName, pageBreaks }: ToDocxArgs,
  onProgress: (fraction: number) => void = () => {},
): Promise<ToDocxResult> {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx');

  const counts = { paragraphs: 0, headings: 0, listItems: 0 };
  const columnPages: number[] = [];
  const children: InstanceType<typeof Paragraph>[] = [];

  const headingLevels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3];

  pages.forEach((page, index) => {
    if (page.columnsSuspected) columnPages.push(index + 1);

    page.blocks.forEach((block: Block) => {
      const runs = block.spans.map((span) => new TextRun({ text: span.text, bold: span.bold, italics: span.italic }));

      if (block.kind === 'heading') {
        counts.headings++;
        children.push(new Paragraph({ children: runs, heading: headingLevels[block.level - 1]! }));
      } else if (block.kind === 'listItem') {
        counts.listItems++;
        children.push(
          new Paragraph({
            children: runs,
            // Word's own list styles, so the numbering and bullets are real list
            // formatting a reader can continue typing into, not typed-in characters.
            ...(block.ordered ? { numbering: { reference: 'ordered', level: 0 } } : { bullet: { level: 0 } }),
          }),
        );
      } else {
        counts.paragraphs++;
        children.push(new Paragraph({ children: runs }));
      }
    });

    const isLast = index === pages.length - 1;
    if (pageBreaks && !isLast && page.blocks.length > 0) {
      children.push(new Paragraph({ children: [], pageBreakBefore: true }));
    }
    onProgress((index + 1) / pages.length);
  });

  if (children.length === 0) throw new ToolError('no-text');

  const document = new Document({
    numbering: {
      config: [
        {
          reference: 'ordered',
          levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: 'start' }],
        },
      ],
    },
    sections: [{ children }],
  });

  // toArrayBuffer, not toBuffer: the latter asks the zip layer for a Node Buffer and
  // throws "nodebuffer is not supported by this platform" in a browser.
  const bytes = new Uint8Array(await Packer.toArrayBuffer(document)) as Uint8Array<ArrayBuffer>;
  return {
    file: { name: outputName, bytes, type: DOCX_TYPE },
    ...counts,
    columnPages,
  };
}
