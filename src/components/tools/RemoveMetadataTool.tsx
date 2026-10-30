import { useState } from 'react';
import { plural } from '../../i18n';
import { runPdfJob } from '../../lib/pdf/client';
import type { RemoveMetadataResult } from '../../lib/pdf/ops/removeMetadata';
import { Checkbox } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

export default function RemoveMetadataTool({ locale, common, t }: ToolProps<'removeMetadata'>) {
  const [file, setFile] = useState<File>();
  const [activeContent, setActiveContent] = useState(true);
  const [result, setResult] = useState<RemoveMetadataResult>();
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
      runPdfJob(
        'removeMetadata',
        {
          input: { name: file.name, bytes: await readBytes(file) },
          activeContent,
          outputName: outputName(file, t.outputSuffix),
        },
        onProgress,
      ),
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

      <div className="panel">
        <Checkbox
          label={t.activeContent}
          checked={activeContent}
          disabled={working}
          onChange={(checked) => {
            setActiveContent(checked);
            setResult(undefined);
            task.reset();
          }}
        />
        {activeContent && <p className="hint">{t.activeContentHint}</p>}
      </div>

      <div className="tool__actions">
        <button type="button" className="primary-button" disabled={working} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />
      {result && (
        <ResultFiles files={[result.file]} common={common} locale={locale} onStartOver={startOver}>
          {result.infoFields > 0 && <p>{plural(locale, t.infoFieldsDone, result.infoFields)}</p>}
          {result.xmp && <p>{t.xmpDone}</p>}
          {result.documentId && <p>{t.documentIdDone}</p>}
          {result.pages > 0 && <p>{plural(locale, t.pagesDone, result.pages)}</p>}
          {result.activeItems > 0 && <p>{plural(locale, t.activeItemsDone, result.activeItems)}</p>}
        </ResultFiles>
      )}
    </div>
  );
}
