import { useState } from 'react';
import { format, plural } from '../../i18n';
import { runPdfJob } from '../../lib/pdf/client';
import type { CompressLevel, CompressResult } from '../../lib/pdf/ops/compress';
import { Field, Segmented } from '../ui/fields';
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

type Mode = 'level' | 'size';
type Unit = 'KB' | 'MB';

/** Decimal, like formatBytes: 1 KB is 1,000 bytes and 1 MB is 1,000,000. */
const UNIT_BYTES: Record<Unit, number> = { KB: 1_000, MB: 1_000_000 };
/** Below this a PDF is rarely achievable and the answer is only ever "missed". */
const MIN_TARGET_BYTES = 10_000;
const PRESETS: readonly { size: number; unit: Unit }[] = [
  { size: 100, unit: 'KB' },
  { size: 200, unit: 'KB' },
  { size: 500, unit: 'KB' },
  { size: 1, unit: 'MB' },
  { size: 2, unit: 'MB' },
];

export default function CompressTool({ locale, common, t, preset }: ToolProps<'compress'>) {
  const [file, setFile] = useState<File>();
  const [level, setLevel] = useState<CompressLevel>('recommended');
  // A landing page can open the tool already set to a size, e.g. { mode: 'size', size: '200', unit: 'KB' }.
  const [mode, setMode] = useState<Mode>(preset?.['mode'] === 'size' ? 'size' : 'level');
  const [sizeText, setSizeText] = useState(preset?.['size'] ?? '200');
  const [unit, setUnit] = useState<Unit>(preset?.['unit'] === 'MB' ? 'MB' : 'KB');
  const [result, setResult] = useState<CompressResult>();
  const task = useTask(common.errors, t.errors);

  const targetBytes = Math.round(Number(sizeText) * UNIT_BYTES[unit]);
  const targetValid = Number.isFinite(targetBytes) && targetBytes >= MIN_TARGET_BYTES;
  const sizeError = mode === 'size' && !targetValid ? format(t.targetInvalid, { min: formatBytes(MIN_TARGET_BYTES, locale) }) : undefined;

  function startOver() {
    setFile(undefined);
    setResult(undefined);
    task.reset();
  }

  function changed() {
    setResult(undefined);
    task.reset();
  }

  async function run() {
    if (!file || (mode === 'size' && !targetValid)) return;
    setResult(undefined);
    const base = { input: { name: file.name, bytes: await readBytes(file) }, outputName: outputName(file, t.outputSuffix) };
    const output = await task.run(async (onProgress) =>
      runPdfJob('compress', mode === 'size' ? { ...base, targetBytes } : { ...base, level }, onProgress),
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
  const targetText = result?.target ? formatBytes(result.target.bytes, locale) : '';

  return (
    <div className="tool">
      <SelectedFile file={file} common={common} locale={locale} onClear={startOver} disabled={working} />

      <div className="panel">
        <Segmented
          label={t.modeLabel}
          value={mode}
          disabled={working}
          options={[
            { value: 'level', label: t.modes.level },
            { value: 'size', label: t.modes.size },
          ]}
          onChange={(value) => {
            setMode(value);
            changed();
          }}
        />

        {mode === 'level' ? (
          <>
            <Segmented
              label={t.levelLabel}
              value={level}
              disabled={working}
              options={levels.map((value) => ({ value, label: t.levels[value] }))}
              onChange={(value) => {
                setLevel(value);
                changed();
              }}
            />
            <p className="hint">{t.levelHints[level]}</p>
          </>
        ) : (
          <>
            <Field label={t.targetLabel} hint={t.targetHint} error={sizeError}>
              {(id, describedBy) => (
                <div className="size-target">
                  <input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={sizeText}
                    disabled={working}
                    aria-describedby={describedBy}
                    aria-invalid={sizeError ? true : undefined}
                    onChange={(event) => {
                      setSizeText(event.currentTarget.value);
                      changed();
                    }}
                  />
                  <Segmented
                    label={t.unitLabel}
                    value={unit}
                    disabled={working}
                    options={[
                      { value: 'KB', label: 'KB' },
                      { value: 'MB', label: 'MB' },
                    ]}
                    onChange={(value) => {
                      setUnit(value);
                      changed();
                    }}
                  />
                </div>
              )}
            </Field>
            <div className="size-target__presets" role="group" aria-label={t.targetPresets}>
              {PRESETS.map((item) => (
                <button
                  key={`${item.size}${item.unit}`}
                  type="button"
                  className="secondary-button secondary-button--small"
                  disabled={working}
                  aria-pressed={Number(sizeText) === item.size && unit === item.unit}
                  onClick={() => {
                    setSizeText(String(item.size));
                    setUnit(item.unit);
                    changed();
                  }}
                >
                  {item.size} {item.unit}
                </button>
              ))}
            </div>
          </>
        )}
        <p className="hint">{t.textNote}</p>
      </div>

      <div className="tool__actions">
        <button type="button" className="primary-button" disabled={working || (mode === 'size' && !targetValid)} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />
      {result?.unchanged && (
        <div className="panel" role="status">
          {result.target?.reached ? (
            <p>{format(t.alreadyUnderTarget, { before: formatBytes(result.before, locale), target: targetText })}</p>
          ) : (
            <>
              <p>{t.alreadySmall}</p>
              {!result.target && level !== 'strong' && <p className="hint">{t.tryStronger}</p>}
            </>
          )}
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
            {result.target && (
              <p className={result.target.reached ? 'size-change__target' : 'size-change__target size-change__target--missed'} role="status">
                {format(result.target.reached ? t.targetReached : t.targetMissed, { after: formatBytes(result.after, locale), target: targetText })}
              </p>
            )}
            {result.images > 0 && <p className="hint">{plural(locale, t.imagesShrunk, result.images)}</p>}
          </div>
        </ResultFiles>
      )}
    </div>
  );
}
