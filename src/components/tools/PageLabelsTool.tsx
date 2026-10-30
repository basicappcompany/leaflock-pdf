import { useState } from 'react';
import { format } from '../../i18n';
import { formatPageLabel, validateRanges, type PageLabelRange, type PageLabelStyle } from '../../lib/organize/pageLabels';
import { runPdfJob } from '../../lib/pdf/client';
import type { OutputFile } from '../../lib/pdf/types';
import { Field } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import { usePickedPdf } from './edit/usePickedPdf';
import type { ToolProps } from './types';

const STYLES: PageLabelStyle[] = ['decimal', 'upperRoman', 'lowerRoman', 'upperLetters', 'lowerLetters', 'none'];

let nextId = 0;
interface Row {
  id: number;
  range: PageLabelRange;
}
const newRow = (startIndex: number): Row => ({ id: nextId++, range: { startIndex, style: 'decimal', prefix: '', startAt: 1 } });

export default function PageLabelsTool({ locale, common, t }: ToolProps<'pageLabels'>) {
  const picked = usePickedPdf(common);
  const task = useTask(common.errors, t.errors);
  const [result, setResult] = useState<OutputFile[]>();
  const [rows, setRows] = useState<Row[]>([newRow(0)]);

  const pageCount = picked.pageCount ?? 0;
  const ranges = rows.map((row) => row.range);
  const problem = pageCount > 0 ? validateRanges(ranges, pageCount) : 'empty';

  function changed() {
    setResult(undefined);
    task.reset();
  }

  function updateRow(id: number, patch: Partial<PageLabelRange>) {
    setRows(rows.map((row) => (row.id === id ? { ...row, range: { ...row.range, ...patch } } : row)));
    changed();
  }

  function addRow() {
    const last = rows[rows.length - 1]!.range.startIndex;
    setRows([...rows, newRow(Math.min(last + 1, Math.max(pageCount - 1, 0)))]);
    changed();
  }

  function removeRow(id: number) {
    setRows(rows.filter((row) => row.id !== id));
    changed();
  }

  async function run() {
    if (!picked.file || problem) return;
    const file = picked.file;
    const output = await task.run(async (onProgress) =>
      runPdfJob(
        'addPageLabels',
        { input: { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) }, outputName: picked.outputName(t.outputSuffix), ranges },
        onProgress,
      ),
    );
    if (output) setResult(output);
  }

  if (!picked.file) {
    return (
      <div className="tool">
        <FilePicker common={common} onFiles={([file]) => picked.setFile(file)} />
      </div>
    );
  }

  const working = task.working;
  const canRun = !problem && !working;

  return (
    <div className="tool">
      <SelectedFile file={picked.file} pageCount={picked.pageCount} common={common} locale={locale} onClear={() => { picked.setFile(undefined); changed(); }} disabled={working} />
      {picked.loadError && (
        <p className="error" role="alert">
          {picked.loadError}
        </p>
      )}

      {picked.pdf.state === 'ready' && (
        <div className="panel">
          {rows.map((row, index) => {
            const preview = formatPageLabel(row.range, row.range.startIndex);
            return (
              <div key={row.id} className="options" style={{ borderTop: index > 0 ? '1px solid var(--color-border)' : undefined, paddingTop: index > 0 ? '0.75rem' : undefined }}>
                <Field label={t.fromPageLabel}>
                  {(id) => (
                    <input
                      id={id}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={pageCount}
                      value={row.range.startIndex + 1}
                      disabled={index === 0}
                      onChange={(event) => {
                        const next = Number(event.currentTarget.value);
                        if (Number.isFinite(next)) updateRow(row.id, { startIndex: Math.min(Math.max(Math.round(next) - 1, 0), pageCount - 1) });
                      }}
                    />
                  )}
                </Field>
                <Field label={t.styleLabel}>
                  {(id) => (
                    <select id={id} value={row.range.style} onChange={(event) => updateRow(row.id, { style: event.currentTarget.value as PageLabelStyle })}>
                      {STYLES.map((style) => (
                        <option key={style} value={style}>
                          {t.style[style]}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label={t.prefixLabel}>
                  {(id) => <input id={id} type="text" value={row.range.prefix} onChange={(event) => updateRow(row.id, { prefix: event.currentTarget.value })} />}
                </Field>
                <Field label={t.startAtLabel}>
                  {(id) => (
                    <input
                      id={id}
                      type="number"
                      inputMode="numeric"
                      value={row.range.startAt}
                      onChange={(event) => {
                        const next = Number(event.currentTarget.value);
                        if (Number.isFinite(next)) updateRow(row.id, { startAt: Math.round(next) });
                      }}
                    />
                  )}
                </Field>
                <p className="hint">{format(t.previewLabel, { page: row.range.startIndex + 1, label: preview || '—' })}</p>
                {rows.length > 1 && (
                  <button type="button" className="link-button" onClick={() => removeRow(row.id)}>
                    {t.removeRange}
                  </button>
                )}
              </div>
            );
          })}
          <button type="button" className="link-button" onClick={addRow} disabled={rows[rows.length - 1]!.range.startIndex >= pageCount - 1}>
            {t.addRange}
          </button>
          {problem && <p className="hint">{t.problems[problem]}</p>}
        </div>
      )}

      <div className="tool__actions">
        <button type="button" className="primary-button" onClick={run} disabled={!canRun}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />
      {result && <ResultFiles files={result} common={common} locale={locale} onStartOver={() => { picked.setFile(undefined); changed(); }} />}
    </div>
  );
}
