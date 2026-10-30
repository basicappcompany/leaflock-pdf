/**
 * The error a bad input file throws, and nothing else — split out of load.ts so the
 * main thread can classify a failure without pulling in @cantoo/pdf-lib.
 *
 * load.ts (loadPdf, markProduced) only ever runs inside pdf.worker.ts and is rightly
 * ~570KB once pdf-lib is bundled in. But useTask.ts and lib/pdfjs.ts need PdfInputError
 * on the *main* thread purely to tell a locked or corrupt file apart from a bug — and
 * importing it from load.ts dragged the whole library along for that one class, on
 * every tool page, whether or not the tool ever touches pdf-lib itself. See
 * tests/e2e/performance.spec.ts, which is what caught it.
 */

export type PdfInputProblem = 'password-protected' | 'wrong-password' | 'not-a-pdf';

/** A file the user picked that we cannot process. Carries the file name so the UI can say which one. */
export class PdfInputError extends Error {
  readonly fileName: string;
  readonly problem: PdfInputProblem;

  constructor(fileName: string, problem: PdfInputProblem, options?: ErrorOptions) {
    super(`${fileName}: ${problem}`, options);
    this.name = 'PdfInputError';
    this.fileName = fileName;
    this.problem = problem;
  }
}
