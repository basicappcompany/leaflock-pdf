import { decodePDFRawStream, PDFDocument, PDFName, PDFRawStream, StandardFonts } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { rasterizePages } from '../../src/lib/pdf/ops/rasterizePages';
import { noProgress } from '../../src/lib/pdf/types';
import { makePng, pdf, readPages } from './editHelpers';

const SECRET = 'TOP SECRET 4417';

/** Two pages: a secret on page 1, and on page 2 public text plus a link back to page 1. */
async function makeSource(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle('Salary review: Asha Rao');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const secret = doc.addPage([400, 500]);
  secret.drawText(SECRET, { x: 50, y: 400, size: 18, font });
  const open = doc.addPage([400, 500]);
  open.drawText('Public summary', { x: 50, y: 400, size: 18, font });
  const link = doc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [50, 50, 150, 70],
    Dest: [secret.ref, PDFName.of('Fit')],
  });
  open.node.addAnnot(doc.context.register(link));
  return doc.save();
}

/** Every stream in the file, decoded, as text: the secret must not hide anywhere. */
async function allStreamText(bytes: Uint8Array): Promise<string> {
  const doc = await PDFDocument.load(bytes);
  let text = '';
  for (const [, object] of doc.context.enumerateIndirectObjects()) {
    if (object instanceof PDFRawStream) {
      try {
        text += new TextDecoder('latin1').decode(decodePDFRawStream(object).decode());
      } catch {
        text += new TextDecoder('latin1').decode(object.contents);
      }
    }
  }
  return text;
}

const hex = (value: string) => [...value].map((char) => char.charCodeAt(0).toString(16).padStart(2, '0')).join('').toUpperCase();

describe('rasterizePages', () => {
  it('replaces redacted pages with images and leaves nothing of them in the file', async () => {
    const source = await makeSource();
    expect(await allStreamText(source)).toContain(hex(SECRET));

    const [output] = await rasterizePages(
      {
        input: pdf('in.pdf', source),
        outputName: 'redacted.pdf',
        pages: [{ index: 0, image: { bytes: makePng(40, 50, [0, 0, 0, 255]), type: 'png' } }],
      },
      noProgress,
    );

    const pages = await readPages(output!.bytes);
    expect(pages).toHaveLength(2);
    expect(pages[0]!.text).toBe('');
    expect([pages[0]!.width, pages[0]!.height]).toEqual([400, 500]);
    expect(pages[1]!.text).toContain('Public summary');

    const streams = await allStreamText(output!.bytes);
    expect(streams).not.toContain(hex(SECRET));
    expect(streams).not.toContain(SECRET);

    const doc = await PDFDocument.load(output!.bytes);
    expect(doc.getTitle()).toBeUndefined();
    expect(doc.catalog.get(PDFName.of('Metadata'))).toBeUndefined();
  });

  it('keeps the displayed size of rotated pages', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([400, 500]);
    page.setRotation({ type: 'degrees', angle: 90 } as never);
    const [output] = await rasterizePages(
      {
        input: pdf('in.pdf', await doc.save()),
        outputName: 'redacted.pdf',
        pages: [{ index: 0, image: { bytes: makePng(50, 40, [0, 0, 0, 255]), type: 'png' } }],
      },
      noProgress,
    );
    const [only] = await readPages(output!.bytes);
    expect([only!.width, only!.height]).toEqual([500, 400]);
  });
});
