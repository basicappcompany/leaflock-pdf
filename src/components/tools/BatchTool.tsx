import { useState } from 'react';
import { plural } from '../../i18n';
import { runBatch, type BatchRowState } from '../../lib/pdf/batch';
import { runPdfJob } from '../../lib/pdf/client';
import { baseName, type OutputFile } from '../../lib/pdf/types';
import { Checkbox, Field, Options, Segmented } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { formatBytes } from '../ui/formatBytes';
import { ResultFiles } from '../ui/ResultFiles';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { describeFailure, useTask } from '../ui/useTask';
import type { ToolProps } from './types';

type Job = 'compress' | 'protect' | 'flatten';
type Level = 'light' | 'recommended' | 'strong';

interface Picked {
  id: string;
  file: File;
}

interface Row {
  state: BatchRowState;
  problem?: string | undefined;
}

/** Every file in a batch gets the same password, and no extra restrictions beyond it. */
const openOnly = {
  printing: 'high',
  copying: true,
  modifying: true,
  annotating: true,
  fillingForms: true,
  documentAssembly: true,
} as const;

export default function BatchTool({ locale, common, t }: ToolProps<'batch'>) {
  const [files, setFiles] = useState<Picked[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [job, setJob] = useState<Job>('compress');
  const [level, setLevel] = useState<Level>('recommended');
  const [password, setPassword] = useState('');
  const [annotations, setAnnotations] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [failed, setFailed] = useState(0);
  const [blocked, setBlocked] = useState<string>();
  const [result, setResult] = useState<OutputFile[]>();
  const task = useTask(common.errors);

  function changeFiles(next: Picked[]) {
    setFiles(next);
    setRows([]);
    setResult(undefined);
    setBlocked(undefined);
    setFailed(0);
    task.reset();
  }

  /** One file's worth of work, already counted against the allowance by runBatch. */
  async function processOne(picked: Picked, onProgress: (fraction: number) => void): Promise<OutputFile> {
    const input = { name: picked.file.name, bytes: await readBytes(picked.file) };
    const outputName = `${baseName(picked.file.name)}${t.suffix[job]}.pdf`;
    const unmetered = { metered: false } as const;

    if (job === 'compress') {
      const { file } = await runPdfJob('compress', { input, level, outputName }, onProgress, unmetered);
      return file;
    }
    if (job === 'protect') {
      const [output] = await runPdfJob(
        'protect',
        { input, userPassword: password, permissions: openOnly, outputName },
        onProgress,
        unmetered,
      );
      return output!;
    }
    const flattened = await runPdfJob('flatten', { input, annotations, outputName }, onProgress, unmetered);
    return flattened.file;
  }

  async function runAll() {
    if (files.length < 2) return setBlocked(t.needFiles);
    if (job === 'protect' && !password) return setBlocked(t.needPassword);
    setBlocked(undefined);
    setResult(undefined);
    setFailed(0);
    setRows(files.map(() => ({ state: 'waiting' })));

    const outputs = await task.run(async (onProgress) => {
      const batch = await runBatch(
        files,
        processOne,
        (update) =>
          setRows((previous) =>
            previous.map((row, index) =>
              index === update.index
                ? {
                    state: update.state,
                    // t.errors carries the codes the batched operations raise, so a row
                    // that fails for an ordinary reason explains itself rather than
                    // falling through to "something went wrong" and being reported as a bug.
                    problem: update.error ? describeFailure(update.error, common.errors, t.errors) : undefined,
                  }
                : row,
            ),
          ),
        onProgress,
      );
      setFailed(batch.failed);
      return batch.outputs;
    });

    if (outputs && outputs.length > 0) setResult(outputs);
  }

  const working = task.working;

  return (
    <div className="tool">
      <FilePicker
        common={common}
        multiple
        compact={files.length > 0}
        onFiles={(picked) =>
          changeFiles([...files, ...picked.map((file) => ({ id: crypto.randomUUID(), file }))])
        }
        onSkipped={setNotices}
      />

      {notices.map((notice) => (
        <p key={notice} className="notice" role="status">
          {notice}
        </p>
      ))}

      <Options>
        <Segmented
          label={t.jobLabel}
          value={job}
          disabled={working}
          onChange={(next: Job) => {
            setJob(next);
            setBlocked(undefined);
          }}
          options={[
            { value: 'compress', label: t.jobs.compress },
            { value: 'protect', label: t.jobs.protect },
            { value: 'flatten', label: t.jobs.flatten },
          ]}
        />

        {job === 'compress' && (
          <Segmented
            label={t.levelLabel}
            value={level}
            disabled={working}
            onChange={setLevel}
            options={[
              { value: 'light', label: t.levels.light },
              { value: 'recommended', label: t.levels.recommended },
              { value: 'strong', label: t.levels.strong },
            ]}
          />
        )}

        {job === 'protect' && (
          <Field label={t.passwordLabel} hint={t.passwordHint}>
            {(id, describedBy) => (
              <input
                id={id}
                aria-describedby={describedBy}
                type="password"
                autoComplete="new-password"
                value={password}
                disabled={working}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setBlocked(undefined);
                }}
              />
            )}
          </Field>
        )}

        {job === 'flatten' && (
          <Checkbox label={t.annotationsLabel} checked={annotations} disabled={working} onChange={setAnnotations} />
        )}
      </Options>

      {files.length > 0 && (
        <ol className="batch-rows" aria-label={plural(locale, common.files.count, files.length)}>
          {files.map((picked, index) => {
            const state = rows[index]?.state ?? 'waiting';
            return (
              <li key={picked.id} className="batch-rows__row">
                <span className="batch-rows__name">{picked.file.name}</span>
                <span className="muted">{formatBytes(picked.file.size, locale)}</span>
                <span className={`batch-rows__state batch-rows__state--${state}`}>{t.status[state]}</span>
                {rows[index]?.problem && <span className="batch-rows__problem">{rows[index].problem}</span>}
              </li>
            );
          })}
        </ol>
      )}

      <div className="tool__actions">
        {blocked && <p className="hint">{blocked}</p>}
        <button type="button" className="primary-button" disabled={working || files.length < 2} onClick={runAll}>
          {working ? t.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />

      {result && (
        <ResultFiles files={result} common={common} locale={locale} onStartOver={() => changeFiles([])}>
          {failed > 0 && <p className="warning">{plural(locale, t.someFailed, failed)}</p>}
        </ResultFiles>
      )}
    </div>
  );
}
