import { useState } from 'react';
import { format, plural } from '../../i18n';
import { bodyTextSize, pageStructure, type PageStructure, type TextRun } from '../../lib/convert/structure';
import { toDocx, type ToDocxResult } from '../../lib/convert/docx';
import { pageTextRuns } from '../../lib/pdfjs';
import { Checkbox } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { usePdfDocument } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

export default function PdfToWordTool({ locale, common, t }: ToolProps<'pdfToWord'>) {
  const [file, setFile] = useState<File>();
  const [pageBreaks, setPageBreaks] = useState(true);
  const [result, setResult] = useState<ToDocxResult>();
  const [stage, setStage] = useState<string>();
  const pdf = usePdfDocument(file);
  const task = useTask(common.errors, t.errors);

  function startOver() {
    setFile(undefined);
    setResult(undefined);
    setStage(undefined);
    task.reset();
  }

  async function run() {
    if (!file || pdf.state !== 'ready') return;
    setResult(undefined);
    const doc = pdf.doc;

    const output = await task.run(async (onProgress) => {
      // Reading needs pdf.js, which lives on the main thread (see CLAUDE.md), so the
      // whole conversion runs here: no job worker is involved (see lib/convert/docx.ts).
      const perPage: TextRun[][] = [];
      for (let number = 1; number <= doc.numPages; number++) {
        setStage(format(t.reading, { number, count: doc.numPages }));
        const page = await doc.getPage(number);
        perPage.push(await pageTextRuns(page));
        page.cleanup();
        // Reading is most of the wait, so it owns most of the progress bar.
        onProgress((number / doc.numPages) * 0.8);
      }
      setStage(undefined);

      const bodySize = bodyTextSize(perPage);
      const pages: PageStructure[] = await Promise.all(
        perPage.map(async (runs, index) => {
          const { width } = (await doc.getPage(index + 1)).getViewport({ scale: 1 });
          return pageStructure(runs, width, bodySize);
        }),
      );

      return toDocx(
        { pages, outputName: `${outputName(file, t.outputSuffix).replace(/\.pdf$/i, '')}.docx`, pageBreaks },
        (fraction) => onProgress(0.8 + fraction * 0.2),
      );
    });

    setStage(undefined);
    if (output) setResult(output);
  }

  if (!file) {
    return (
      <div className="tool">
        <FilePicker common={common} onFiles={([picked]) => setFile(picked)} />
      </div>
    );
  }

  const working = task.working;

  return (
    <div className="tool">
      <SelectedFile file={file} common={common} locale={locale} onClear={startOver} disabled={working} />

      <div className="panel">
        <Checkbox
          label={t.pageBreaks}
          checked={pageBreaks}
          disabled={working}
          onChange={(checked) => {
            setPageBreaks(checked);
            setResult(undefined);
            task.reset();
          }}
        />
        {!pageBreaks && <p className="hint">{t.pageBreaksHint}</p>}
      </div>

      <div className="tool__actions">
        <button type="button" className="primary-button" disabled={working || pdf.state !== 'ready'} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      {working && stage && <p className="hint">{stage}</p>}
      <TaskStatusView status={task.status} common={common} />

      {result && (
        <ResultFiles files={[result.file]} common={common} locale={locale} onStartOver={startOver}>
          <p>{plural(locale, t.blocksDone, result.paragraphs)}</p>
          {result.headings > 0 && <p>{plural(locale, t.headingsDone, result.headings)}</p>}
          {result.listItems > 0 && <p>{plural(locale, t.listItemsDone, result.listItems)}</p>}
          {result.columnPages.length > 0 && (
            <p role="alert" className="hint">
              {format(plural(locale, t.columnsWarning, result.columnPages.length), {
                pages: result.columnPages.join(', '),
              })}
            </p>
          )}
        </ResultFiles>
      )}
    </div>
  );
}
