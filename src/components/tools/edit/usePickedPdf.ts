import { useEffect, useState } from 'react';
import type { CommonMessages } from '../../../i18n';
import { baseName } from '../../../lib/pdf/types';
import { describeFailure } from '../../ui/useTask';
import { usePdfDocument } from '../../ui/usePdfDocument';

/** One picked PDF, opened for previews, plus helpers every single-file edit tool needs. */
export function usePickedPdf(common: CommonMessages) {
  const [file, setFile] = useState<File>();
  const pdf = usePdfDocument(file);
  const [loadError, setLoadError] = useState<string>();

  useEffect(() => {
    setLoadError(pdf.state === 'error' ? describeFailure(pdf.error, common.errors) : undefined);
  }, [pdf, common.errors]);

  return {
    file,
    setFile,
    pdf,
    loadError,
    pageCount: pdf.state === 'ready' ? pdf.doc.numPages : undefined,
    outputName: (suffix: string) => `${baseName(file?.name ?? 'document')}-${suffix}.pdf`,
  };
}
