import { useState } from 'react';
import '../../styles/organize.css';
import { runPdfJob } from '../../lib/pdf/client';
import { baseName, type OutputFile } from '../../lib/pdf/types';
import { ResultFiles } from '../ui/ResultFiles';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import { PageSelector } from './organize/PageSelector';
import { PdfIntake, useSinglePdf } from './organize/PdfIntake';
import type { ToolProps } from './types';

export default function RemovePagesTool({ locale, common, t }: ToolProps<'removePages'>) {
  const { file, setFile, doc } = useSinglePdf();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<OutputFile[]>();
  const task = useTask(common.errors, t.errors);

  function pick(next: File | undefined) {
    setFile(next);
    setSelected(new Set());
    setResult(undefined);
    task.reset();
  }

  function changeSelection(next: Set<number>) {
    setSelected(next);
    setResult(undefined);
    task.reset();
  }

  const pageCount = doc.state === 'ready' ? doc.doc.numPages : 0;
  const removesAll = pageCount > 0 && selected.size >= pageCount;

  async function remove() {
    if (doc.state !== 'ready' || !file) return;
    const keep = Array.from({ length: pageCount }, (_, index) => index).filter((index) => !selected.has(index));
    const output = await task.run((onProgress) =>
      runPdfJob(
        'assemble',
        {
          inputs: [{ name: file.name, bytes: doc.bytes }],
          pages: keep.map((index) => ({ source: 0, index, rotation: 0 as const })),
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
          <PageSelector
            doc={doc.doc}
            common={common}
            locale={locale}
            selected={selected}
            onChange={changeSelection}
            rangeLabel={t.rangeLabel}
            instructions={t.instructions}
            selectedMeansRemoved
            disabled={task.working}
          />
          <div className="tool__actions">
            {removesAll && <p className="warning">{t.cannotRemoveAll}</p>}
            <button
              type="button"
              className="primary-button"
              disabled={selected.size === 0 || removesAll || task.working}
              onClick={remove}
            >
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
