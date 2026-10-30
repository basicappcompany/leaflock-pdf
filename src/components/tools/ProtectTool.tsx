import { useState } from 'react';
import { runPdfJob } from '../../lib/pdf/client';
import { passwordStrength, type Strength } from '../../lib/secure/passwordStrength';
import type { ProtectPermissions } from '../../lib/pdf/ops/protect';
import type { OutputFile } from '../../lib/pdf/types';
import { Checkbox, Field, Options, Segmented } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';
import '../../styles/secure.css';

const defaultPermissions: ProtectPermissions = {
  printing: 'high',
  copying: true,
  modifying: true,
  annotating: true,
  fillingForms: true,
  documentAssembly: true,
};

const toggles = ['copying', 'modifying', 'annotating', 'fillingForms', 'documentAssembly'] as const;

export default function ProtectTool({ locale, common, t }: ToolProps<'protect'>) {
  const [file, setFile] = useState<File>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [useOwner, setUseOwner] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [result, setResult] = useState<OutputFile[]>();
  const task = useTask(common.errors, t.errors);

  function changed() {
    setResult(undefined);
    task.reset();
  }

  function startOver() {
    setFile(undefined);
    setPassword('');
    setConfirm('');
    setOwnerPassword('');
    changed();
  }

  const mismatch = confirm !== '' && confirm !== password;
  const ownerSame = useOwner && ownerPassword !== '' && ownerPassword === password;
  const strength = password === '' ? undefined : passwordStrength(password);
  const ready =
    !!file && password !== '' && password === confirm && (!useOwner || (ownerPassword !== '' && !ownerSame));

  async function run() {
    if (!file) return;
    const output = await task.run(async (onProgress) =>
      runPdfJob(
        'protect',
        {
          input: { name: file.name, bytes: await readBytes(file) },
          userPassword: password,
          ...(useOwner ? { ownerPassword } : {}),
          permissions,
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

  const inputType = show ? 'text' : 'password';
  const working = task.working;

  return (
    <div className="tool">
      <SelectedFile file={file} common={common} locale={locale} onClear={startOver} disabled={working} />

      <div className="panel">
        <Options>
          <Field label={t.passwordLabel} hint={strength && t.strength[strength]}>
            {(id, describedBy) => (
              <input
                id={id}
                type={inputType}
                autoComplete="new-password"
                value={password}
                disabled={working}
                aria-describedby={describedBy}
                onChange={(event) => {
                  setPassword(event.currentTarget.value);
                  changed();
                }}
              />
            )}
          </Field>
          <Field label={t.confirmLabel} error={mismatch ? t.mismatch : undefined}>
            {(id, describedBy) => (
              <input
                id={id}
                type={inputType}
                autoComplete="new-password"
                value={confirm}
                disabled={working}
                aria-invalid={mismatch}
                aria-describedby={describedBy}
                onChange={(event) => {
                  setConfirm(event.currentTarget.value);
                  changed();
                }}
              />
            )}
          </Field>
        </Options>
        {strength && <StrengthMeter strength={strength} />}
        <Checkbox label={t.show} checked={show} onChange={setShow} />
        <p className="warning">{t.forgetWarning}</p>
      </div>

      <details className="panel secure-details">
        <summary>{t.permissionsHeading}</summary>
        <div className="secure-details__body">
        <Segmented
          label={t.permissions.printing}
          value={permissions.printing}
          disabled={working}
          options={(['high', 'low', 'none'] as const).map((value) => ({ value, label: t.printingOptions[value] }))}
          onChange={(printing) => {
            setPermissions({ ...permissions, printing });
            changed();
          }}
        />
        <div className="secure-checks">
          {toggles.map((key) => (
            <Checkbox
              key={key}
              label={t.permissions[key]}
              checked={permissions[key]}
              disabled={working}
              onChange={(checked) => {
                setPermissions({ ...permissions, [key]: checked });
                changed();
              }}
            />
          ))}
        </div>
        <p className="hint">{t.permissionsNote}</p>
        <Checkbox
          label={t.ownerToggle}
          checked={useOwner}
          disabled={working}
          onChange={(checked) => {
            setUseOwner(checked);
            changed();
          }}
        />
        {useOwner ? (
          <Field label={t.ownerLabel} error={ownerSame ? t.ownerSame : undefined}>
            {(id, describedBy) => (
              <input
                id={id}
                type={inputType}
                autoComplete="new-password"
                value={ownerPassword}
                disabled={working}
                aria-invalid={ownerSame}
                aria-describedby={describedBy}
                onChange={(event) => {
                  setOwnerPassword(event.currentTarget.value);
                  changed();
                }}
              />
            )}
          </Field>
        ) : (
          <p className="hint">{t.ownerHint}</p>
        )}
        </div>
      </details>

      <div className="tool__actions">
        <button type="button" className="primary-button" disabled={!ready || working} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />
      {result && <ResultFiles files={result} common={common} locale={locale} onStartOver={startOver} />}
    </div>
  );
}

function StrengthMeter({ strength }: { strength: Strength }) {
  const level = { weak: 1, fair: 2, strong: 3 }[strength];
  return (
    <div className={`strength strength--${strength}`} aria-hidden="true">
      {[1, 2, 3].map((step) => (
        <span key={step} className={step <= level ? 'strength__bar is-on' : 'strength__bar'} />
      ))}
    </div>
  );
}
