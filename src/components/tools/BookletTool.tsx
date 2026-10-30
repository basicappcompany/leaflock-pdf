import { useState } from 'react';
import { plural } from '../../i18n';
import {
  bookletGrid,
  bookletPadding,
  bookletSheets,
  sheetSizes,
  type SheetSizeName,
} from '../../lib/organize/imposition';
import { runPdfJob } from '../../lib/pdf/client';
import type { ImposeResult } from '../../lib/pdf/ops/imposePages';
import { Checkbox, Field, Segmented } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { usePdfDocument } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

const sizeOrder = ['a4Landscape', 'letterLandscape', 'a3Landscape'] as const satisfies readonly SheetSizeName[];

export default function BookletTool({ locale, common, t }: ToolProps<'booklet'>) {
  const [file, setFile] = useState<File>();
  const [size, setSize] = useState<SheetSizeName>('a4Landscape');
  const [margin, setMargin] = useState(20);
  const [gutter, setGutter] = useState(20);
  const [border, setBorder] = useState(false);
  const [result, setResult] = useState<ImposeResult>();
  const task = useTask(common.errors, t.errors);
  const document = usePdfDocument(file);

  const pageCount = document.state === 'ready' ? document.doc.numPages : 0;
  const padding = bookletPadding(pageCount);

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
    if (!file || document.state !== 'ready') return;
    setResult(undefined);
    const output = await task.run(async (onProgress) =>
      runPdfJob(
        'imposePages',
        {
          input: { name: file.name, bytes: document.bytes },
          sheets: bookletSheets(document.doc.numPages),
          grid: bookletGrid,
          sheet: sheetSizes[size],
          margin,
          gutter,
          border,
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
        <Segmented
          label={t.sheetSize}
          value={size}
          options={sizeOrder.map((value) => ({ value, label: t.sheetSizes[value] }))}
          disabled={working}
          onChange={(value) => {
            setSize(value);
            changed();
          }}
        />

        <Field label={t.margin}>
          {(id) => (
            <input
              id={id}
              type="number"
              min={0}
              max={100}
              value={margin}
              disabled={working}
              onChange={(event) => {
                setMargin(Math.max(0, Math.min(100, Number(event.target.value) || 0)));
                changed();
              }}
            />
          )}
        </Field>

        <Field label={t.gutter}>
          {(id) => (
            <input
              id={id}
              type="number"
              min={0}
              max={100}
              value={gutter}
              disabled={working}
              onChange={(event) => {
                setGutter(Math.max(0, Math.min(100, Number(event.target.value) || 0)));
                changed();
              }}
            />
          )}
        </Field>

        <Checkbox
          label={t.border}
          checked={border}
          disabled={working}
          onChange={(checked) => {
            setBorder(checked);
            changed();
          }}
        />

        {padding > 0 && <p className="hint">{plural(locale, t.padded, padding)}</p>}
      </div>

      <div className="tool__actions">
        <button type="button" className="primary-button" disabled={working || document.state !== 'ready'} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />
      {result && (
        <ResultFiles files={[result.file]} common={common} locale={locale} onStartOver={startOver}>
          <p>{plural(locale, t.sheetsDone, result.sheets)}</p>
        </ResultFiles>
      )}
    </div>
  );
}
