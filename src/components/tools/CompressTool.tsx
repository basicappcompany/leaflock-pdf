import { useState } from 'react';
import { format, plural } from '../../i18n';
import { runPdfJob } from '../../lib/pdf/client';
import type { CompressLevel, CompressResult } from '../../lib/pdf/ops/compress';
import { Segmented } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { formatBytes } from '../ui/formatBytes';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';
import '../../styles/secure.css';

const levels: readonly CompressLevel[] = ['light', 'recommended', 'strong'];

export default function CompressTool({ locale, common, t }: ToolProps<'compress'>) {
  const [file, setFile] = useState<File>();
  const [level, setLevel] = useState<CompressLevel>('recommended');
  const [result, setResult] = useState<CompressResult>();
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
        'compress',
        { input: { name: file.name, bytes: await readBytes(file) }, level, outputName: outputName(file, t.outputSuffix) },
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
  const percent = result ? Math.round((1 - result.after / result.before) * 100) : 0;

  return (
    <div className="tool">
      <SelectedFile file={file} common={common} locale={locale} onClear={startOver} disabled={working} />

      <div className="panel">
        <Segmented
          label={t.levelLabel}
          value={level}
          disabled={working}
          options={levels.map((value) => ({ value, label: t.levels[value] }))}
          onChange={(value) => {
            setLevel(value);
            setResult(undefined);
            task.reset();
          }}
        />
        <p className="hint">{t.levelHints[level]}</p>
        <p className="hint">{t.textNote}</p>
      </div>

      <div className="tool__actions">
        <button type="button" className="primary-button" disabled={working} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />
      {result?.unchanged && (
        <div className="panel" role="status">
          <p>{t.alreadySmall}</p>
          {level !== 'strong' && <p className="hint">{t.tryStronger}</p>}
        </div>
      )}
      {result && !result.unchanged && (
        <ResultFiles files={[result.file]} common={common} locale={locale} onStartOver={startOver}>
          <div className="size-change">
            <p className="size-change__headline">
              {format(t.saved, {
                before: formatBytes(result.before, locale),
                after: formatBytes(result.after, locale),
                percent,
              })}
            </p>
            <div className="size-change__bar" aria-hidden="true">
              <span style={{ width: `${Math.max(2, 100 - percent)}%` }} />
            </div>
            {result.images > 0 && <p className="hint">{plural(locale, t.imagesShrunk, result.images)}</p>}
          </div>
        </ResultFiles>
      )}
    </div>
  );
}
