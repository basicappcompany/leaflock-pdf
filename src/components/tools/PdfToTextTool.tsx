import { useEffect, useId, useMemo, useState } from 'react';
import { format, plural } from '../../i18n';
import { baseName, type OutputFile } from '../../lib/pdf/types';
import { pageText } from '../../lib/pdfjs';
import '../../styles/convert.css';
import { Checkbox } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { usePdfDocument } from '../ui/usePdfDocument';
import { describeFailure, useTask } from '../ui/useTask';
import { CopyButton } from './convert/CopyButton';
import { toolUrl } from './convert/links';
import type { ToolProps } from './types';

export default function PdfToTextTool({ locale, common, t }: ToolProps<'pdfToText'>) {
  const [file, setFile] = useState<File>();
  const [pageTexts, setPageTexts] = useState<string[]>();
  const [separators, setSeparators] = useState(true);
  const [stage, setStage] = useState<string>();
  const pdf = usePdfDocument(file);
  const task = useTask(common.errors, t.errors);
  const { run, reset } = task;
  const textId = useId();

  const doc = pdf.state === 'ready' ? pdf.doc : undefined;
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    (async () => {
      const texts = await run(async (onProgress) => {
        const out: string[] = [];
        for (let number = 1; number <= doc.numPages; number++) {
          if (cancelled) break;
          setStage(format(t.reading, { number, count: doc.numPages }));
          const page = await doc.getPage(number);
          out.push(await pageText(page));
          page.cleanup();
          onProgress(number / doc.numPages);
        }
        return out;
      });
      if (!cancelled && texts) setPageTexts(texts);
      setStage(undefined);
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, run, t.reading]);

  const text = useMemo(() => {
    if (!pageTexts) return '';
    const trimmed = pageTexts.map((page) => page.replace(/[ \t]+\n/g, '\n').trim());
    if (!separators) return trimmed.filter(Boolean).join('\n\n');
    return trimmed.map((page, index) => `${format(t.pageSeparator, { number: index + 1 })}\n${page}`).join('\n\n');
  }, [pageTexts, separators, t.pageSeparator]);

  const hasText = !!pageTexts?.some((page) => page.trim() !== '');
  const output = useMemo<OutputFile[] | undefined>(
    () =>
      file && hasText
        ? [
            {
              name: `${baseName(file.name)}-${t.outputSuffix}.txt`,
              bytes: new TextEncoder().encode(text) as Uint8Array<ArrayBuffer>,
              type: 'text/plain;charset=utf-8',
            },
          ]
        : undefined,
    [file, hasText, text, t.outputSuffix],
  );

  function startOver() {
    setFile(undefined);
    setPageTexts(undefined);
    reset();
  }

  if (!file) {
    return (
      <div className="tool">
        <FilePicker common={common} onFiles={([picked]) => setFile(picked)} />
      </div>
    );
  }

  return (
    <div className="tool">
      <SelectedFile
        file={file}
        pageCount={doc?.numPages}
        common={common}
        locale={locale}
        disabled={task.working}
        onClear={startOver}
      />
      {pdf.state === 'error' && (
        <p className="error" role="alert">
          {describeFailure(pdf.error, common.errors)}
        </p>
      )}
      {task.working && stage && <p className="convert-stage">{stage}</p>}
      <TaskStatusView status={task.status} common={common} />

      {pageTexts && !hasText && (
        <div className="panel">
          <p>{t.noText}</p>
          <p>
            <a href={toolUrl(locale, 'ocr-pdf')}>{t.tryOcr}</a>
          </p>
        </div>
      )}

      {hasText && (
        <>
          <div className="convert-text-header">
            <label htmlFor={textId}>{format(t.textLabel, { name: file.name })}</label>
            <span className="muted">{plural(locale, t.characterCount, text.length)}</span>
          </div>
          <textarea id={textId} className="convert-text" readOnly value={text} spellCheck={false} />
          <div className="toolbar">
            <Checkbox label={t.separators} checked={separators} onChange={setSeparators} />
            <span className="convert-spacer" />
            <CopyButton text={text} labels={t} />
          </div>
          {output && <ResultFiles files={output} common={common} locale={locale} onStartOver={startOver} />}
        </>
      )}
    </div>
  );
}
