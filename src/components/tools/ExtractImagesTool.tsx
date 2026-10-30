import { useState } from 'react';
import { plural } from '../../i18n';
import { runPdfJob } from '../../lib/pdf/client';
import type { ExtractImagesResult } from '../../lib/pdf/ops/extractImages';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import type { ToolProps } from './types';

export default function ExtractImagesTool({ locale, common, t }: ToolProps<'extractImages'>) {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<ExtractImagesResult>();
  const task = useTask(common.errors, t.errors);

  function startOver() {
    setFile(undefined);
    setResult(undefined);
    task.reset();
  }

  async function run() {
    if (!file) return;
    setResult(undefined);
    const output = await task.run(async (onProgress) =>
      runPdfJob('extractImages', { input: { name: file.name, bytes: await readBytes(file) } }, onProgress),
    );
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
        <button type="button" className="primary-button" disabled={working} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />
      {result && result.files.length > 0 && (
        <ResultFiles files={result.files} common={common} locale={locale} onStartOver={startOver}>
          <p>{plural(locale, t.extractedDone, result.extracted)}</p>
          {result.skipped > 0 && <p className="hint">{plural(locale, t.skippedDone, result.skipped)}</p>}
        </ResultFiles>
      )}
      {result && result.files.length === 0 && (
        <p className="hint" role="status">
          {plural(locale, t.skippedDone, result.skipped)}
        </p>
      )}
    </div>
  );
}
