import { useState } from 'react';
import { plural } from '../../i18n';
import { xlsxToTable } from '../../lib/convert/xlsxTable';
import { runPdfJob } from '../../lib/pdf/client';
import type { TableToPdfResult } from '../../lib/pdf/ops/tableToPdf';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

export default function ExcelToPdfTool({ locale, common, t }: ToolProps<'excelToPdf'>) {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<TableToPdfResult>();
  const task = useTask(common.errors, t.errors);

  function startOver() {
    setFile(undefined);
    setResult(undefined);
    task.reset();
  }

  async function run() {
    if (!file) return;
    setResult(undefined);

    const output = await task.run(async (onProgress) => {
      // read-excel-file is a dependency only this tool needs, so parsing happens here on
      // the main thread rather than in the shared job worker (see lib/convert/xlsxTable.ts).
      const sheets = await xlsxToTable(await readBytes(file));
      return runPdfJob('tableToPdf', { sheets, outputName: outputName(file, t.outputSuffix) }, onProgress);
    });

    if (output) setResult(output);
  }

  if (!file) {
    return (
      <div className="tool">
        <FilePicker common={common} kind="xlsx" onFiles={([picked]) => setFile(picked)} />
      </div>
    );
  }

  const working = task.working;

  return (
    <div className="tool">
      <SelectedFile file={file} common={common} locale={locale} onClear={startOver} disabled={working} />

      <div className="tool__actions">
        <button type="button" className="primary-button" disabled={working} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />
      {result && (
        <ResultFiles files={[result.file]} common={common} locale={locale} onStartOver={startOver}>
          <p>{plural(locale, t.pagesDone, result.pages)}</p>
        </ResultFiles>
      )}
    </div>
  );
}
