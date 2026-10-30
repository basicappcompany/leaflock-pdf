import { useState } from 'react';
import { format, plural } from '../../i18n';
import { extractTables, type ExtractTablesResult, type TableFormat } from '../../lib/convert/extractTables';
import { pageTable, type PageTable } from '../../lib/convert/table';
import { baseName } from '../../lib/pdf/types';
import { pageTextRuns } from '../../lib/pdfjs';
import { Segmented } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { usePdfDocument } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import type { ToolProps } from './types';

export default function ExtractTablesTool({ locale, common, t }: ToolProps<'extractTables'>) {
  const [file, setFile] = useState<File>();
  const [tableFormat, setTableFormat] = useState<TableFormat>('csv');
  const [result, setResult] = useState<ExtractTablesResult>();
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
      // Reading needs pdf.js, which lives on the main thread (see CLAUDE.md); writing
      // CSV is a few lines of text and write-excel-file is the same main-thread writer
      // PDF to Excel already uses, so this whole conversion stays off the job worker.
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

      const output = await extractTables({ pages, format: tableFormat, outputBaseName: baseName(file.name) });
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

      <Segmented
        label={t.formatLabel}
        value={tableFormat}
        onChange={(value) => {
          setTableFormat(value);
          setResult(undefined);
          task.reset();
        }}
        disabled={working}
        options={[
          { value: 'csv', label: t.format.csv },
          { value: 'xlsx', label: t.format.xlsx },
        ]}
      />

      <div className="tool__actions">
        <button type="button" className="primary-button" disabled={working || pdf.state !== 'ready'} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      {working && stage && <p className="hint">{stage}</p>}
      <TaskStatusView status={task.status} common={common} />

      {result && (
        <ResultFiles files={result.files} common={common} locale={locale} onStartOver={startOver}>
          <p>{plural(locale, t.tablesFoundDone, result.tablePages.length)}</p>
        </ResultFiles>
      )}
    </div>
  );
}
