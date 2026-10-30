import { loadPdf, markProduced, type PdfInput } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface ProtectPermissions {
  printing: 'none' | 'low' | 'high';
  copying: boolean;
  modifying: boolean;
  annotating: boolean;
  fillingForms: boolean;
  documentAssembly: boolean;
}

export interface ProtectArgs {
  input: PdfInput;
  /** Needed to open the file. */
  userPassword: string;
  /**
   * Lifts the restrictions below. When omitted we generate a random one, so the
   * restrictions can't be bypassed by opening the file with the user password.
   */
  ownerPassword?: string;
  permissions: ProtectPermissions;
  outputName: string;
}

/** Encrypts a PDF with AES-256 so it needs a password to open. */
export async function protect(
  { input, userPassword, ownerPassword, permissions, outputName }: ProtectArgs,
  _ctx: OpContext,
): Promise<OutputFile[]> {
  if (userPassword === '') throw new RangeError('protect needs a password');
  // Files that are only restricted (empty user password) open here and get re-encrypted;
  // files that need a password to open are reported as such and must be unlocked first.
  const doc = await loadPdf(input);
  markProduced(doc);
  doc.encrypt({
    userPassword,
    ownerPassword: ownerPassword || randomPassword(),
    algorithm: 'AES-256',
    permissions: {
      printing: permissions.printing === 'none' ? false : permissions.printing === 'low' ? 'lowResolution' : 'highResolution',
      copying: permissions.copying,
      modifying: permissions.modifying,
      annotating: permissions.annotating,
      fillingForms: permissions.fillingForms,
      documentAssembly: permissions.documentAssembly,
      // Screen readers must keep working whatever else is restricted.
      contentAccessibility: true,
    },
  });
  return [pdfFile(outputName, await doc.save())];
}

function randomPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
