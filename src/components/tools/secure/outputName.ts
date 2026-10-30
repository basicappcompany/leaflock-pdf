import { baseName } from '../../../lib/pdf/types';

/** "report.pdf" + "protected" → "report-protected.pdf" */
export function outputName(file: File, suffix: string): string {
  return `${baseName(file.name)}-${suffix}.pdf`;
}
