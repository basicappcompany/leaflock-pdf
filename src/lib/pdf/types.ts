/** A file produced by a tool, ready to download. */
export interface OutputFile {
  name: string;
  bytes: Uint8Array<ArrayBuffer>;
  /** MIME type, e.g. "application/pdf". */
  type: string;
}

/** Passed to every operation so long jobs can report progress (0 to 1). */
export interface OpContext {
  progress(fraction: number): void;
}

export const noProgress: OpContext = { progress() {} };

/** pdf-lib always saves into a plain ArrayBuffer; its typings just don't say so. */
export function pdfFile(name: string, bytes: Uint8Array): OutputFile {
  return { name, bytes: bytes as Uint8Array<ArrayBuffer>, type: 'application/pdf' };
}

/** "report.pdf" → "report", for building output names like "report-page-1.pdf". */
export function baseName(fileName: string): string {
  return fileName.replace(/\.[^./\\]+$/, '') || 'document';
}
