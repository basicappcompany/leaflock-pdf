import { PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { ToolError } from '../../src/lib/pdf/errors';
import { loadPdf, PdfInputError } from '../../src/lib/pdf/load';
import { protect, type ProtectPermissions } from '../../src/lib/pdf/ops/protect';
import { unlock } from '../../src/lib/pdf/ops/unlock';
import { noProgress } from '../../src/lib/pdf/types';
import { makePdf } from '../fixtures/pdfs';

const allowAll: ProtectPermissions = {
  printing: 'high',
  copying: true,
  modifying: true,
  annotating: true,
  fillingForms: true,
  documentAssembly: true,
};

async function protectBytes(bytes: Uint8Array, userPassword: string, ownerPassword?: string) {
  const [file] = await protect(
    { input: { name: 'in.pdf', bytes }, userPassword, ...(ownerPassword ? { ownerPassword } : {}), permissions: allowAll, outputName: 'out.pdf' },
    noProgress,
  );
  return file!.bytes;
}

/** Text of every content stream, decoded, so tests can look for drawn text. */
async function contentText(bytes: Uint8Array): Promise<string> {
  const doc = await PDFDocument.load(bytes);
  let text = '';
  for (const page of doc.getPages()) {
    const contents = page.node.Contents();
    const streams = contents && 'size' in contents ? contents.asArray() : [contents];
    for (const ref of streams) {
      const stream = ref && doc.context.lookup(ref as never);
      if (stream instanceof PDFRawStream) text += new TextDecoder('latin1').decode(decodePDFRawStream(stream).decode());
    }
  }
  return text;
}

function hasEncryptDictionary(bytes: Uint8Array): boolean {
  return new TextDecoder('latin1').decode(bytes).includes('/Encrypt');
}

describe('protect', () => {
  it('produces a file that needs the password to open', async () => {
    const original = await makePdf([[200, 300], [300, 400]]);
    const locked = await protectBytes(original, 'open sesame');

    await expect(loadPdf({ name: 'out.pdf', bytes: locked })).rejects.toMatchObject({ problem: 'password-protected' });
    const opened = await loadPdf({ name: 'out.pdf', bytes: locked }, { password: 'open sesame' });
    expect(opened.getPageCount()).toBe(2);
    expect(hasEncryptDictionary(locked)).toBe(true);
  });

  it('re-protects a file that was only restricted', async () => {
    const restricted = await makePdf([[200, 300]], { ownerPassword: 'owner' });
    const locked = await protectBytes(restricted, 'new password');
    await expect(loadPdf({ name: 'out.pdf', bytes: locked }, { password: 'new password' })).resolves.toBeDefined();
  });

  it('refuses a file that already needs a password', async () => {
    const locked = await makePdf([[200, 300]], { userPassword: 'a', ownerPassword: 'b' });
    await expect(protectBytes(locked, 'c')).rejects.toBeInstanceOf(PdfInputError);
  });
});

describe('unlock', () => {
  it('removes the password and the encryption with it', async () => {
    const original = await makePdf([[200, 300], [300, 400]]);
    const locked = await protectBytes(original, 'secret', 'owner-secret');

    const { file, restrictionsOnly } = await unlock({ input: { name: 'l.pdf', bytes: locked }, password: 'secret', outputName: 'u.pdf' }, noProgress);

    expect(restrictionsOnly).toBe(false);
    expect(hasEncryptDictionary(file.bytes)).toBe(false);
    const reopened = await PDFDocument.load(file.bytes);
    expect(reopened.getPageCount()).toBe(2);
    expect(reopened.context.lookup(reopened.context.trailerInfo.Encrypt)).toBeUndefined();
    // The page content must be decrypted, not copied across still encrypted.
    expect(await contentText(file.bytes)).toContain(await contentText(original));
  });

  it('works with the owner password too', async () => {
    const locked = await protectBytes(await makePdf([[200, 300]]), 'secret', 'owner-secret');
    const { file } = await unlock({ input: { name: 'l.pdf', bytes: locked }, password: 'owner-secret', outputName: 'u.pdf' }, noProgress);
    expect(hasEncryptDictionary(file.bytes)).toBe(false);
  });

  it('lifts restrictions without asking for a password', async () => {
    const restricted = await makePdf([[200, 300]], { ownerPassword: 'owner' });
    const { file, restrictionsOnly } = await unlock({ input: { name: 'r.pdf', bytes: restricted }, outputName: 'u.pdf' }, noProgress);
    expect(restrictionsOnly).toBe(true);
    expect(hasEncryptDictionary(file.bytes)).toBe(false);
  });

  it('asks for the password when one is needed', async () => {
    const locked = await protectBytes(await makePdf([[200, 300]]), 'secret');
    const result = unlock({ input: { name: 'l.pdf', bytes: locked }, outputName: 'u.pdf' }, noProgress);
    await expect(result).rejects.toBeInstanceOf(ToolError);
    await expect(result).rejects.toMatchObject({ code: 'needs-password' });
  });

  it('says when the password is wrong', async () => {
    const locked = await protectBytes(await makePdf([[200, 300]]), 'secret');
    await expect(
      unlock({ input: { name: 'l.pdf', bytes: locked }, password: 'nope', outputName: 'u.pdf' }, noProgress),
    ).rejects.toMatchObject({ problem: 'wrong-password', fileName: 'l.pdf' });
  });

  it('says when there is nothing to unlock', async () => {
    const plain = await makePdf([[200, 300]]);
    await expect(unlock({ input: { name: 'p.pdf', bytes: plain }, outputName: 'u.pdf' }, noProgress)).rejects.toMatchObject({
      code: 'not-encrypted',
    });
  });

  it('rejects files that are not PDFs', async () => {
    const fake = new TextEncoder().encode('nope');
    await expect(unlock({ input: { name: 'x.pdf', bytes: fake }, outputName: 'u.pdf' }, noProgress)).rejects.toMatchObject({
      problem: 'not-a-pdf',
    });
  });
});

// Keep the PDFName import meaningful for readers: /Encrypt is the dictionary we check for.
void PDFName.of('Encrypt');
