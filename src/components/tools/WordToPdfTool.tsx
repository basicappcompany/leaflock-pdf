import { useState } from 'react';
import { plural } from '../../i18n';
import { docxToBlocks } from '../../lib/convert/docxBlocks';
import { runPdfJob } from '../../lib/pdf/client';
import type { BlocksToPdfResult } from '../../lib/pdf/ops/blocksToPdf';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

interface Result {
  pdf: BlocksToPdfResult;
  tablesSkipped: number;
  imagesSkipped: number;
}

export default function WordToPdfTool({ locale, common, t }: ToolProps<'wordToPdf'>) {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<Result>();
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
      // mammoth is a heavy dependency only this tool needs, so parsing happens here on
      // the main thread rather than in the shared job worker (see lib/convert/docxBlocks.ts).
      const { blocks, tablesSkipped, imagesSkipped } = await docxToBlocks(await readBytes(file));
      const pdf = await runPdfJob('blocksToPdf', { blocks, outputName: outputName(file, t.outputSuffix) }, onProgress);
      return { pdf, tablesSkipped, imagesSkipped };
    });

    if (output) setResult(output);
  }

  if (!file) {
    return (
      <div className="tool">
        <FilePicker common={common} kind="docx" onFiles={([picked]) => setFile(picked)} />
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
        <ResultFiles files={[result.pdf.file]} common={common} locale={locale} onStartOver={startOver}>
          <p>{plural(locale, t.pagesDone, result.pdf.pages)}</p>
          {result.tablesSkipped > 0 && <p className="hint">{plural(locale, t.tablesSkipped, result.tablesSkipped)}</p>}
          {result.imagesSkipped > 0 && <p className="hint">{plural(locale, t.imagesSkipped, result.imagesSkipped)}</p>}
        </ResultFiles>
      )}
    </div>
  );
}
