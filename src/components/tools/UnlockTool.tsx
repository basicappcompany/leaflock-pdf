import { useState } from 'react';
import { JobError, runPdfJob } from '../../lib/pdf/client';
import type { UnlockResult } from '../../lib/pdf/ops/unlock';
import { Checkbox, Field } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

function needsPassword(error: unknown): boolean {
  return error instanceof JobError && error.failure.kind === 'tool' && error.failure.code === 'needs-password';
}

export default function UnlockTool({ locale, common, t }: ToolProps<'unlock'>) {
  const [file, setFile] = useState<File>();
  const [askPassword, setAskPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [result, setResult] = useState<UnlockResult>();
  const task = useTask(common.errors, t.errors);

  async function attempt(picked: File, typed: string | undefined) {
    setResult(undefined);
    const output = await task.run(async (onProgress) => {
      try {
        return await runPdfJob(
          'unlock',
          {
            input: { name: picked.name, bytes: await readBytes(picked) },
            ...(typed ? { password: typed } : {}),
            outputName: outputName(picked, t.outputSuffix),
          },
          onProgress,
        );
      } catch (error) {
        // Not a failure: the file just needs its password, which we ask for next.
        if (needsPassword(error)) return null;
        throw error;
      }
    });
    if (output === null) {
      setAskPassword(true);
      task.reset();
    } else if (output) {
      setResult(output);
    }
  }

  function pick(picked: File) {
    setFile(picked);
    setAskPassword(false);
    setPassword('');
    // Try straight away: files with only printing/copying limits need no password.
    void attempt(picked, undefined);
  }

  function startOver() {
    setFile(undefined);
    setAskPassword(false);
    setPassword('');
    setResult(undefined);
    task.reset();
  }

  if (!file) {
    return (
      <div className="tool">
        <FilePicker common={common} onFiles={([picked]) => pick(picked!)} />
        <p className="hint">{t.legalNote}</p>
      </div>
    );
  }

  const working = task.working;

  return (
    <div className="tool">
      <SelectedFile file={file} common={common} locale={locale} onClear={startOver} disabled={working} />

      {askPassword && !result && (
        <form
          className="panel"
          onSubmit={(event) => {
            event.preventDefault();
            if (password) void attempt(file, password);
          }}
        >
          <p>{t.needsPassword}</p>
          <Field label={t.passwordLabel} hint={t.passwordHint}>
            {(id, describedBy) => (
              <input
                id={id}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                disabled={working}
                aria-describedby={describedBy}
                onChange={(event) => {
                  setPassword(event.currentTarget.value);
                  if (task.status.state === 'error') task.reset();
                }}
              />
            )}
          </Field>
          <Checkbox label={t.show} checked={show} onChange={setShow} />
          <div className="tool__actions">
            <button type="submit" className="primary-button" disabled={!password || working}>
              {working ? common.actions.working : t.action}
            </button>
          </div>
        </form>
      )}

      {working && !askPassword && <p className="muted">{t.checking}</p>}
      <TaskStatusView status={task.status} common={common} />
      {result && (
        <ResultFiles files={[result.file]} common={common} locale={locale} onStartOver={startOver}>
          <p>{result.restrictionsOnly ? t.restrictionsRemoved : t.unlocked}</p>
        </ResultFiles>
      )}
    </div>
  );
}
