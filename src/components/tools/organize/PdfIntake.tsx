import { useState } from 'react';
import type { CommonMessages } from '../../../i18n';
import { FilePicker } from '../../ui/FilePicker';
import { SelectedFile } from '../../ui/SelectedFile';
import { usePdfDocument, type PdfDocumentState } from '../../ui/usePdfDocument';
import { describeFailure } from '../../ui/useTask';

/** State for tools that work on one PDF: the picked file and its pdf.js document. */
export function useSinglePdf() {
  const [file, setFile] = useState<File>();
  const doc = usePdfDocument(file);
  return { file, setFile, doc };
}

/**
 * The top of every single-PDF tool: a picker until a file is chosen, then the file's
 * name with a "choose a different file" link, and any problem opening it.
 */
export function PdfIntake({
  file,
  doc,
  common,
  locale,
  onFile,
  disabled,
}: {
  file: File | undefined;
  doc: PdfDocumentState;
  common: CommonMessages;
  locale: string;
  onFile: (file: File | undefined) => void;
  disabled?: boolean;
}) {
  const [notices, setNotices] = useState<string[]>([]);

  if (!file) {
    return (
      <>
        <FilePicker common={common} onFiles={([picked]) => onFile(picked)} onSkipped={setNotices} />
        {notices.map((notice) => (
          <p key={notice} className="notice" role="status">
            {notice}
          </p>
        ))}
      </>
    );
  }

  return (
    <>
      <SelectedFile
        file={file}
        pageCount={doc.state === 'ready' ? doc.doc.numPages : undefined}
        common={common}
        locale={locale}
        onClear={() => onFile(undefined)}
        disabled={disabled ?? false}
      />
      {doc.state === 'loading' && <p className="muted">{common.toolPage.loading}</p>}
      {doc.state === 'error' && (
        <p className="error" role="alert">
          {describeFailure(doc.error, common.errors)}
        </p>
      )}
    </>
  );
}
