import { useMemo, useState } from 'react';
import '../../styles/organize.css';
import { format } from '../../i18n';
import { runPdfJob } from '../../lib/pdf/client';
import { normaliseRotation, type QuarterTurn } from '../../lib/organize/pages';
import { baseName, type OutputFile } from '../../lib/pdf/types';
import { PageGrid } from '../ui/PageGrid';
import { ResultFiles } from '../ui/ResultFiles';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import { PdfIntake, useSinglePdf } from './organize/PdfIntake';
import type { ToolProps } from './types';

export default function RotateTool({ locale, common, t }: ToolProps<'rotate'>) {
  const { file, setFile, doc } = useSinglePdf();
  // Extra rotation per page, on top of each page's own.
  const [rotations, setRotations] = useState<QuarterTurn[]>([]);
  const [result, setResult] = useState<OutputFile[]>();
  const task = useTask(common.errors, t.errors);

  const pageCount = doc.state === 'ready' ? doc.doc.numPages : 0;
  const turns = rotations.length === pageCount ? rotations : Array<QuarterTurn>(pageCount).fill(0);

  function update(next: QuarterTurn[]) {
    setRotations(next);
    setResult(undefined);
    task.reset();
  }

  function pick(next: File | undefined) {
    setFile(next);
    update([]);
  }

  const rotateAll = (by: number) => update(turns.map((turn) => normaliseRotation(turn + by)));
  const rotateOne = (index: number, by: number) =>
    update(turns.map((turn, i) => (i === index ? normaliseRotation(turn + by) : turn)));

  const pages = useMemo(
    () =>
      doc.state === 'ready'
        ? turns.map((rotation, index) => ({ key: String(index), doc: doc.doc, index, rotation, selected: rotation !== 0 }))
        : [],
    [doc, turns],
  );

  const changed = turns.some((turn) => turn !== 0);

  async function save() {
    if (doc.state !== 'ready' || !file) return;
    const output = await task.run((onProgress) =>
      runPdfJob(
        'assemble',
        {
          inputs: [{ name: file.name, bytes: doc.bytes }],
          pages: turns.map((rotation, index) => ({ source: 0, index, rotation })),
          outputName: `${baseName(file.name)}-${t.outputSuffix}.pdf`,
        },
        onProgress,
      ),
    );
    if (output) setResult(output);
  }

  return (
    <div className="tool">
      <PdfIntake file={file} doc={doc} common={common} locale={locale} onFile={pick} disabled={task.working} />

      {doc.state === 'ready' && (
        <>
          <div className="toolbar">
            <button type="button" className="secondary-button" onClick={() => rotateAll(-90)} disabled={task.working}>
              ↺ {t.rotateAllLeft}
            </button>
            <button type="button" className="secondary-button" onClick={() => rotateAll(90)} disabled={task.working}>
              ↻ {t.rotateAllRight}
            </button>
            <button type="button" className="link-button" onClick={() => update([])} disabled={!changed || task.working}>
              {t.reset}
            </button>
          </div>
          <PageGrid
            pages={pages}
            common={common}
            controls={(page) => (
              <>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={format(common.pages.rotateLeft, { number: page.index + 1 })}
                  disabled={task.working}
                  onClick={() => rotateOne(page.index, -90)}
                >
                  ↺
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={format(common.pages.rotateRight, { number: page.index + 1 })}
                  disabled={task.working}
                  onClick={() => rotateOne(page.index, 90)}
                >
                  ↻
                </button>
              </>
            )}
          />
          <div className="tool__actions">
            {!changed && <p className="hint">{t.noChanges}</p>}
            <button type="button" className="primary-button" disabled={!changed || task.working} onClick={save}>
              {task.working ? common.actions.working : t.action}
            </button>
          </div>
        </>
      )}

      <TaskStatusView status={task.status} common={common} />
      {result && <ResultFiles files={result} common={common} locale={locale} onStartOver={() => pick(undefined)} />}
    </div>
  );
}
