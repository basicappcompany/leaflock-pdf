import { useState } from 'react';
import { format, plural } from '../../i18n';
import { pageTable, type PageTable } from '../../lib/convert/table';
import { toXlsx, type ToXlsxResult } from '../../lib/convert/xlsx';
import { pageTextRuns } from '../../lib/pdfjs';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { usePdfDocument } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

export default function PdfToExcelTool({ locale, common, t }: ToolProps<'pdfToExcel'>) {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<ToXlsxResult>();
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
      // whole conversion runs here: no job worker is involved (see lib/convert/xlsx.ts).
      const pages: PageTable[] = [];
      for (let number = 1; number <= doc.numPages; number++) {
        setStage(format(t.reading, { number, count: doc.numPages }));
        const page = await doc.getPage(number);
        const runs = await pageTextRuns(page);
        const { width } = page.getViewport({ scale: 1 });
        pages.push(pageTable(runs, width));
        page.cleanup();
        onProgress((number / doc.numPages) * 0.8);
      }
      setStage(undefined);

      const output = await toXlsx({ pages, outputName: `${outputName(file, t.outputSuffix).replace(/\.pdf$/i, '')}.xlsx` });
      onProgress(1);
      return output;
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

      <div className="tool__actions">
        <button type="button" className="primary-button" disabled={working || pdf.state !== 'ready'} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      {working && stage && <p className="hint">{stage}</p>}
      <TaskStatusView status={task.status} common={common} />

      {result && (
        <ResultFiles files={[result.file]} common={common} locale={locale} onStartOver={startOver}>
          <p>{plural(locale, t.sheetsDone, result.sheets)}</p>
          {result.tablePages.length > 0 ? (
            <p className="hint">{format(plural(locale, t.tablesFound, result.tablePages.length), { pages: result.tablePages.join(', ') })}</p>
          ) : (
            <p className="hint">{t.noTablesFound}</p>
          )}
        </ResultFiles>
      )}
    </div>
  );
}
