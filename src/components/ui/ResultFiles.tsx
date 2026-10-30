import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { format, plural, type CommonMessages } from '../../i18n';
import { runPdfJob } from '../../lib/pdf/client';
import type { OutputFile } from '../../lib/pdf/types';
import { formatBytes } from './formatBytes';
import { RetentionPicker } from './RetentionPicker';

interface Props {
  files: OutputFile[];
  common: CommonMessages;
  locale: string;
  /** Extra content under the heading, e.g. a size comparison. */
  children?: ReactNode;
  onStartOver?: () => void;
}

/** Download links for a tool's outputs, plus "download all as ZIP" when there are several. */
export function ResultFiles({ files, common, locale, children, onStartOver }: Props) {
  const t = common.actions;
  const urls = useMemo(
    () => files.map((file) => URL.createObjectURL(new Blob([file.bytes], { type: file.type }))),
    [files],
  );
  useEffect(() => () => urls.forEach((url) => URL.revokeObjectURL(url)), [urls]);

  const [zipUrl, setZipUrl] = useState<string>();
  const [zipping, setZipping] = useState(false);
  useEffect(() => {
    setZipUrl(undefined);
  }, [files]);
  useEffect(() => () => {
    if (zipUrl) URL.revokeObjectURL(zipUrl);
  }, [zipUrl]);

  async function downloadAll() {
    setZipping(true);
    try {
      // Not metered: bundling results you already produced isn't another tool run.
      const [archive] = await runPdfJob('zip', { files, outputName: t.zipName }, undefined, { metered: false });
      const url = URL.createObjectURL(new Blob([archive!.bytes], { type: archive!.type }));
      setZipUrl(url);
      // Start the download straight away; the link stays for a second try.
      const link = document.createElement('a');
      link.href = url;
      link.download = t.zipName;
      link.click();
    } finally {
      setZipping(false);
    }
  }

  return (
    <div className="result" aria-live="polite">
      <p className="result__heading">{plural(locale, t.doneMany, files.length)}</p>
      {children}
      <ul className="result__files">
        {files.map((file, index) => (
          <li key={`${file.name}-${index}`}>
            <a className={files.length === 1 ? 'primary-button' : 'secondary-button'} href={urls[index]} download={file.name}>
              {files.length === 1 ? t.download : format(t.downloadFile, { name: file.name })}
            </a>
            <span className="muted">{formatBytes(file.bytes.byteLength, locale)}</span>
          </li>
        ))}
      </ul>
      <RetentionPicker files={files} common={common} locale={locale} />
      <div className="result__actions">
        {files.length > 1 &&
          (zipUrl ? (
            <a className="primary-button" href={zipUrl} download={t.zipName}>
              {t.downloadAll}
            </a>
          ) : (
            <button type="button" className="primary-button" onClick={downloadAll} disabled={zipping}>
              {zipping ? t.working : t.downloadAll}
            </button>
          ))}
        {onStartOver && (
          <button type="button" className="link-button" onClick={onStartOver}>
            {t.startOver}
          </button>
        )}
      </div>
    </div>
  );
}
