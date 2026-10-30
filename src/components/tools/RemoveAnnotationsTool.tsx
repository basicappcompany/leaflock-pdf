import { useState } from 'react';
import { plural } from '../../i18n';
import { runPdfJob } from '../../lib/pdf/client';
import type { RemoveAnnotationsResult } from '../../lib/pdf/ops/removeAnnotations';
import { Checkbox } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

export default function RemoveAnnotationsTool({ locale, common, t }: ToolProps<'removeAnnotations'>) {
  const [file, setFile] = useState<File>();
  const [links, setLinks] = useState(false);
  const [result, setResult] = useState<RemoveAnnotationsResult>();
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
        'removeAnnotations',
        {
          input: { name: file.name, bytes: await readBytes(file) },
          links,
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
          label={t.links}
          checked={links}
          disabled={working}
          onChange={(checked) => {
            setLinks(checked);
            setResult(undefined);
            task.reset();
          }}
        />
        {!links && <p className="hint">{t.linksHint}</p>}
      </div>

      <div className="tool__actions">
        <button type="button" className="primary-button" disabled={working} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />
      {result && (
        <ResultFiles files={[result.file]} common={common} locale={locale} onStartOver={startOver}>
          {result.annotations > 0 && <p>{plural(locale, t.annotationsDone, result.annotations)}</p>}
          {result.links > 0 && <p>{plural(locale, t.linksDone, result.links)}</p>}
          {result.pages > 0 && <p>{plural(locale, t.pagesDone, result.pages)}</p>}
        </ResultFiles>
      )}
    </div>
  );
}
