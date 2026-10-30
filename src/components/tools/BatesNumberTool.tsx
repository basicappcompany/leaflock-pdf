import { useMemo, useState } from 'react';
import { format, plural } from '../../i18n';
import { runPdfJob } from '../../lib/pdf/client';
import type { NumberPosition } from '../../lib/pdf/ops/addPageNumbers';
import type { OutputFile } from '../../lib/pdf/types';
import { Field, Options, Segmented } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { formatBytes } from '../ui/formatBytes';
import { ResultFiles } from '../ui/ResultFiles';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import type { ToolProps } from './types';

type Vertical = 'top' | 'bottom';
type Horizontal = 'left' | 'center' | 'right';

interface PickedFile {
  id: string;
  file: File;
}

export default function BatesNumberTool({ locale, common, t }: ToolProps<'batesNumber'>) {
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [result, setResult] = useState<OutputFile[]>();
  const task = useTask(common.errors, t.errors);

  const [prefix, setPrefix] = useState('ABC');
  const [suffix, setSuffix] = useState('');
  const [digits, setDigits] = useState(6);
  const [startAt, setStartAt] = useState(1);
  const [vertical, setVertical] = useState<Vertical>('bottom');
  const [horizontal, setHorizontal] = useState<Horizontal>('right');
  const [fontSize, setFontSize] = useState(10);
  const [margin, setMargin] = useState(20);
  const [color, setColor] = useState('#000000');

  const firstLabel = useMemo(
    () => `${prefix}${String(startAt).padStart(digits, '0')}${suffix}`,
    [prefix, suffix, digits, startAt],
  );

  function changeFiles(next: PickedFile[]) {
    setFiles(next);
    setResult(undefined);
    task.reset();
  }

  function move(index: number, offset: -1 | 1) {
    const next = [...files];
    const [item] = next.splice(index, 1);
    if (item) next.splice(index + offset, 0, item);
    changeFiles(next);
  }

  function changed() {
    setResult(undefined);
    task.reset();
  }

  async function run() {
    if (files.length === 0) return;
    const output = await task.run(async (onProgress) => {
      const inputs = await Promise.all(files.map(async ({ file }) => ({ name: file.name, bytes: await readBytes(file) })));
      return runPdfJob(
        'batesNumber',
        {
          inputs,
          outputSuffix: t.outputSuffix,
          prefix,
          suffix,
          digits,
          startAt,
          position: `${vertical}-${horizontal}` as NumberPosition,
          fontSize,
          margin,
          color,
        },
        onProgress,
      );
    });
    if (output) setResult(output);
  }

  const working = task.working;
  const count = plural(locale, common.files.count, files.length);

  return (
    <div className="tool">
      <FilePicker
        common={common}
        multiple
        compact={files.length > 0}
        onFiles={(picked) => changeFiles([...files, ...picked.map((file) => ({ id: crypto.randomUUID(), file }))])}
        onSkipped={setNotices}
      />

      {notices.map((notice) => (
        <p key={notice} className="notice" role="status">
          {notice}
        </p>
      ))}

      {files.length > 0 && (
        <div className="tool__workspace">
          <section aria-label={count}>
            <div className="list-header">
              <span>{count}</span>
              <button type="button" className="link-button" onClick={() => changeFiles([])} disabled={working}>
                {common.files.clear}
              </button>
            </div>
            <ol className="file-list">
              {files.map(({ id, file }, index) => (
                <li key={id} className="file-list__item">
                  <span className="file-list__name">{file.name}</span>
                  <span className="muted">{formatBytes(file.size, locale)}</span>
                  <span className="icon-buttons">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={format(common.files.moveUp, { name: file.name })}
                      disabled={working || index === 0}
                      onClick={() => move(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={format(common.files.moveDown, { name: file.name })}
                      disabled={working || index === files.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={format(common.files.remove, { name: file.name })}
                      disabled={working}
                      onClick={() => changeFiles(files.filter((item) => item.id !== id))}
                    >
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <div className="panel">
            <p className="hint">{format(t.preview, { label: firstLabel })}</p>
            <Options>
              <Field label={t.prefixLabel}>
                {(id) => (
                  <input
                    id={id}
                    type="text"
                    value={prefix}
                    onChange={(event) => {
                      setPrefix(event.currentTarget.value);
                      changed();
                    }}
                  />
                )}
              </Field>
              <Field label={t.suffixLabel}>
                {(id) => (
                  <input
                    id={id}
                    type="text"
                    value={suffix}
                    onChange={(event) => {
                      setSuffix(event.currentTarget.value);
                      changed();
                    }}
                  />
                )}
              </Field>
              <NumberField label={t.digitsLabel} value={digits} min={1} max={12} onChange={(value) => { setDigits(value); changed(); }} />
              <NumberField label={t.startLabel} value={startAt} min={0} max={9999999} onChange={(value) => { setStartAt(value); changed(); }} />
              <NumberField label={t.sizeLabel} value={fontSize} min={6} max={72} onChange={(value) => { setFontSize(value); changed(); }} />
              <NumberField label={t.marginLabel} value={margin} min={0} max={144} onChange={(value) => { setMargin(value); changed(); }} />
              <Field label={t.colorLabel}>
                {(id) => (
                  <input id={id} type="color" value={color} onChange={(event) => { setColor(event.currentTarget.value); changed(); }} />
                )}
              </Field>
            </Options>
            <Segmented
              label={t.verticalLabel}
              value={vertical}
              onChange={(value) => { setVertical(value); changed(); }}
              options={[
                { value: 'top', label: t.vertical.top },
                { value: 'bottom', label: t.vertical.bottom },
              ]}
            />
            <Segmented
              label={t.horizontalLabel}
              value={horizontal}
              onChange={(value) => { setHorizontal(value); changed(); }}
              options={[
                { value: 'left', label: t.horizontal.left },
                { value: 'center', label: t.horizontal.center },
                { value: 'right', label: t.horizontal.right },
              ]}
            />
          </div>
        </div>
      )}

      <div className="tool__actions">
        {files.length === 0 && <p className="hint">{t.needOne}</p>}
        <button type="button" className="primary-button" disabled={files.length === 0 || working} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />
      {result && <ResultFiles files={result} common={common} locale={locale} onStartOver={() => changeFiles([])} />}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            const next = Number(event.currentTarget.value);
            if (Number.isFinite(next)) onChange(Math.min(Math.max(Math.round(next), min), max));
          }}
        />
      )}
    </Field>
  );
}
