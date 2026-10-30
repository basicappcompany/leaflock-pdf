import { useState } from 'react';
import { plural } from '../../i18n';
import { runPdfJob } from '../../lib/pdf/client';
import type { FlattenResult } from '../../lib/pdf/ops/flatten';
import { Checkbox } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

export default function FlattenTool({ locale, common, t }: ToolProps<'flatten'>) {
  const [file, setFile] = useState<File>();
  const [annotations, setAnnotations] = useState(true);
  const [result, setResult] = useState<FlattenResult>();
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
        'flatten',
        { input: { name: file.name, bytes: await readBytes(file) }, annotations, outputName: outputName(file, t.outputSuffix) },
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
          label={t.annotations}
          checked={annotations}
          disabled={working}
          onChange={(checked) => {
            setAnnotations(checked);
            setResult(undefined);
            task.reset();
          }}
        />
        {annotations && <p className="hint">{t.annotationsHint}</p>}
      </div>

      <div className="tool__actions">
        <button type="button" className="primary-button" disabled={working} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />
      {result && (
        <ResultFiles files={[result.file]} common={common} locale={locale} onStartOver={startOver}>
          {result.fields > 0 && <p>{plural(locale, t.fieldsDone, result.fields)}</p>}
          {result.annotations > 0 && <p>{plural(locale, t.annotationsDone, result.annotations)}</p>}
        </ResultFiles>
      )}
    </div>
  );
}
