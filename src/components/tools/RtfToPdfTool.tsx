import { useState } from 'react';
import { plural } from '../../i18n';
import { parseRtf } from '../../lib/convert/rtfBlocks';
import { runPdfJob } from '../../lib/pdf/client';
import type { BlocksToPdfResult } from '../../lib/pdf/ops/blocksToPdf';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

export default function RtfToPdfTool({ locale, common, t }: ToolProps<'rtfToPdf'>) {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<BlocksToPdfResult>();
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
      // No dependency to keep off the main thread here: RTF parsing is plain string
      // scanning (see lib/convert/rtfBlocks.ts), so this can go straight to the worker.
      const { blocks } = parseRtf(await file.text());
      return runPdfJob('blocksToPdf', { blocks, outputName: outputName(file, t.outputSuffix) }, onProgress);
    });

    if (output) setResult(output);
  }

  if (!file) {
    return (
      <div className="tool">
        <FilePicker common={common} kind="rtf" onFiles={([picked]) => setFile(picked)} />
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
