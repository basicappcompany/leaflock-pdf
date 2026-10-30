import { useId, useRef, useState, type DragEvent } from 'react';
import { format, type CommonMessages } from '../../i18n';

export type FileKind = 'pdf' | 'image' | 'docx' | 'xlsx' | 'csv' | 'rtf';

const accepts: Record<FileKind, string> = {
  pdf: 'application/pdf,.pdf',
  // Explicit extensions alongside the wildcard: Windows has no built-in HEIC codec, so
  // its file-open dialog can hide .heic/.heif entirely under an `image/*` filter,
  // before isKind() below ever gets a say.
  image: 'image/*,.heic,.heif',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx',
  csv: 'text/csv,.csv',
  rtf: 'application/rtf,text/rtf,.rtf',
};

export function isKind(file: File, kind: FileKind): boolean {
  if (kind === 'pdf') return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (kind === 'docx') {
    return (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx')
    );
  }
  if (kind === 'xlsx') {
    return (
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.name.toLowerCase().endsWith('.xlsx')
    );
  }
  if (kind === 'csv') {
    // Spreadsheet apps commonly export CSV with no MIME type at all, or with
    // application/vnd.ms-excel — extension is the reliable signal here.
    return file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
  }
  if (kind === 'rtf') {
    return file.type === 'application/rtf' || file.type === 'text/rtf' || file.name.toLowerCase().endsWith('.rtf');
  }
  if (file.type.startsWith('image/')) return true;
  // Windows has no built-in HEIC codec, so it often reports no MIME type at all for
  // one (unlike a browser lacking codec support, which still reports `image/heic` and
  // is caught above). Matched by extension only — not a blanket type-less bypass — so
  // this can't accept an unrelated file the browser also failed to recognise. The
  // actual decode attempt in imagesToPdf.ts gives the honest answer either way: it
  // works on Safari/iOS (the OS has the codec) and fails with a clear "this browser
  // can't open it" message everywhere else (see unsupportedImage in i18n).
  return /\.hei[cf]$/i.test(file.name);
}

interface Props {
  common: CommonMessages;
  kind?: FileKind;
  multiple?: boolean;
  /** Smaller variant, for "add more files" once some are picked. */
  compact?: boolean;
  /** Called with the accepted files; skipped ones are reported through `onSkipped`. */
  onFiles: (files: File[]) => void;
  onSkipped?: (messages: string[]) => void;
}

/** Drop zone plus a "choose files" button. Files stay in memory; nothing is sent anywhere. */
export function FilePicker({ common, kind = 'pdf', multiple = false, compact = false, onFiles, onSkipped }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const t = common.picker;

  function accept(picked: File[]) {
    const ok = picked.filter((file) => isKind(file, kind));
    const skipped = picked.filter((file) => !isKind(file, kind));
    onSkipped?.(skipped.map((file) => format(t.skippedWrongType, { name: file.name })));
    const chosen = multiple ? ok : ok.slice(0, 1);
    if (chosen.length > 0) onFiles(chosen);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    accept(Array.from(event.dataTransfer.files));
  }

  const prompt = kind === 'image' ? t.dropImages : multiple ? t.dropMany : t.dropOne;
  const browse = compact ? t.addMore : multiple || kind === 'image' ? t.browseMany : t.browseOne;
  const classes = ['dropzone', compact && 'dropzone--compact', dragging && 'dropzone--active'].filter(Boolean);

  return (
    <div
      className={classes.join(' ')}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <p>
        {!compact && <>{prompt} </>}
        <label htmlFor={inputId} className="link-button">
          {browse}
        </label>
      </p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accepts[kind]}
        multiple={multiple}
        className="visually-hidden"
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          // Reset so picking the same file again still fires a change event.
          if (inputRef.current) inputRef.current.value = '';
          accept(files);
        }}
      />
    </div>
  );
}
