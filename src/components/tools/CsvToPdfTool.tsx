import { useState } from 'react';
import { plural } from '../../i18n';
import { parseCsv } from '../../lib/convert/csv';
import { runPdfJob } from '../../lib/pdf/client';
import type { TableToPdfResult } from '../../lib/pdf/ops/tableToPdf';
import { baseName } from '../../lib/pdf/types';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

export default function CsvToPdfTool({ locale, common, t }: ToolProps<'csvToPdf'>) {
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
      const rows = parseCsv(await file.text());
      const sheets = [{ name: baseName(file.name), rows }];
      return runPdfJob('tableToPdf', { sheets, outputName: outputName(file, t.outputSuffix) }, onProgress);
    });

    if (output) setResult(output);
  }

  if (!file) {
    return (
      <div className="tool">
        <FilePicker common={common} kind="csv" onFiles={([picked]) => setFile(picked)} />
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
