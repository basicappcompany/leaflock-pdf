import type { Block, Span } from './structure';

export interface DocxBlocksResult {
  blocks: Block[];
  /** Tables in the source — dropped entirely, stated on the tool page. */
  tablesSkipped: number;
  /** Images in the source — dropped entirely, stated on the tool page. */
  imagesSkipped: number;
}

/**
 * Reads a .docx via mammoth's HTML conversion, then maps that HTML onto the exact same
 * `Block`/`Span` shape `structure.ts` infers from a PDF — so Office → PDF and PDF → Word
 * share one rendering step (`src/lib/pdf/ops/blocksToPdf.ts`) instead of each needing its
 * own. Tables and images are dropped, not approximated, for the same reason PDF → Word
 * doesn't invent them: a PDF can't represent either without real layout work, and an
 * honest stated limit beats a silent approximation.
 */
export async function docxToBlocks(bytes: Uint8Array): Promise<DocxBlocksResult> {
  const mammoth = await import('mammoth');
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
  return parseBlocks(html);
}

/** The parsing half, kept separate from the mammoth call above so it can be tested with
 * literal HTML strings rather than real .docx fixtures. */
export function parseBlocks(html: string): DocxBlocksResult {
  const root = parseTree(html);
  const blocks: Block[] = [];
  let tablesSkipped = 0;
  let imagesSkipped = 0;

  const count = (node: Node) => {
    if (node.kind !== 'element') return;
    if (node.tag === 'table') tablesSkipped++;
    else if (node.tag === 'img') imagesSkipped++;
    for (const child of node.children) count(child);
  };

  const walkBlocks = (nodes: Node[], ordered: boolean | undefined = undefined) => {
    for (const node of nodes) {
      if (node.kind === 'text') continue; // stray text outside any block tag
      const tag = node.tag;

      if (/^h[1-6]$/.test(tag)) {
        const spans = inlineSpans(node);
        if (spans.length > 0) blocks.push({ kind: 'heading', level: Math.min(3, Number(tag[1])) as 1 | 2 | 3, spans });
      } else if (tag === 'p') {
        const spans = inlineSpans(node);
        if (spans.length > 0) blocks.push({ kind: 'paragraph', spans });
      } else if (tag === 'ul' || tag === 'ol') {
        for (const item of node.children) {
          if (item.kind === 'element' && item.tag === 'li') {
            const spans = inlineSpans(item);
            if (spans.length > 0) blocks.push({ kind: 'listItem', spans, ordered: tag === 'ol' });
            // A list nested inside this item becomes its own flat run of items.
            walkBlocks(item.children.filter((child) => child.kind === 'element' && (child.tag === 'ul' || child.tag === 'ol')));
          }
        }
      } else if (tag === 'table' || tag === 'img') {
        count(node);
      } else {
        // An unrecognised wrapper (mammoth emits a handful of div-like containers
        // depending on style mappings) — descend into it rather than drop its content.
        walkBlocks(node.children);
      }
    }
    void ordered;
  };

  walkBlocks(root);
  return { blocks, tablesSkipped, imagesSkipped };
}

// --- A minimal HTML tree, enough for mammoth's bounded, well-formed output ---------------

type Node = TextNode | ElementNode;
type TextNode = { kind: 'text'; text: string };
type ElementNode = { kind: 'element'; tag: string; children: Node[] };

const VOID_TAGS = new Set(['img', 'br', 'hr']);
const TAG = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>|<!--[\s\S]*?-->/g;

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) return String.fromCodePoint(parseInt(body.slice(2), 16));
    if (body.startsWith('#')) return String.fromCodePoint(parseInt(body.slice(1), 10));
    return ENTITIES[body] ?? match;
  });
}

/** Builds a tree from `html`, tolerant of the handful of tags mammoth actually emits. */
function parseTree(html: string): Node[] {
  const root: Node = { kind: 'element', tag: '', children: [] };
  const stack: Node[] = [root];

  let lastIndex = 0;
  for (const match of html.matchAll(TAG)) {
    const text = html.slice(lastIndex, match.index);
    if (text) (stack[stack.length - 1] as ElementNode).children.push({ kind: 'text', text: decodeEntities(text) });
    lastIndex = match.index + match[0].length;

    const full = match[0];
    if (full.startsWith('<!--')) continue;

    const closing = full.startsWith('</');
    const tag = match[1]!.toLowerCase();
    const selfClosing = full.endsWith('/>') || VOID_TAGS.has(tag);

    if (closing) {
      // Pop back to the matching opener; a stray close tag is simply ignored.
      const openIndex = stack.findIndex((node) => node.kind === 'element' && node.tag === tag);
      if (openIndex > 0) stack.length = openIndex;
      continue;
    }

    const element: Node = { kind: 'element', tag, children: [] };
    (stack[stack.length - 1] as ElementNode).children.push(element);
    if (!selfClosing) stack.push(element);
  }
  const tail = html.slice(lastIndex);
  if (tail) (stack[stack.length - 1] as ElementNode).children.push({ kind: 'text', text: decodeEntities(tail) });

  return root.children;
}

/** The inline text of one block, as `Span`s — bold/italic tracked through nested tags,
 * `<a>` unwrapped to its text, merging the same way `structure.ts` merges same-styled runs. */
function inlineSpans(node: ElementNode): Span[] {
  const spans: Span[] = [];

  const walk = (n: Node, bold: boolean, italic: boolean) => {
    if (n.kind === 'text') {
      if (!n.text) return;
      const last = spans[spans.length - 1];
      if (last && last.bold === bold && last.italic === italic) last.text += n.text;
      else spans.push({ text: n.text, bold, italic });
      return;
    }
    // A nested list is its own set of blocks (added separately by `walkBlocks`), not
    // part of this item's own text; images and tables are dropped outright.
    if (n.tag === 'img' || n.tag === 'table' || n.tag === 'ul' || n.tag === 'ol') return;
    const nowBold = bold || n.tag === 'strong' || n.tag === 'b';
    const nowItalic = italic || n.tag === 'em' || n.tag === 'i';
    for (const child of n.children) walk(child, nowBold, nowItalic);
  };

  for (const child of node.children) walk(child, false, false);
  // Collapse runs of whitespace the way a browser would display them, without touching
  // the single spaces that separate words.
  for (const span of spans) span.text = span.text.replace(/\s+/g, ' ');
  return spans.filter((span) => span.text.trim() !== '');
}
