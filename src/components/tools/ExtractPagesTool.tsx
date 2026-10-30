import { useState } from 'react';
import '../../styles/organize.css';
import { runPdfJob } from '../../lib/pdf/client';
import { baseName, type OutputFile } from '../../lib/pdf/types';
import { Segmented } from '../ui/fields';
import { ResultFiles } from '../ui/ResultFiles';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import { PageSelector } from './organize/PageSelector';
import { PdfIntake, useSinglePdf } from './organize/PdfIntake';
import type { ToolProps } from './types';

type OutputMode = 'one' | 'separate';

export default function ExtractPagesTool({ locale, common, t }: ToolProps<'extractPages'>) {
  const { file, setFile, doc } = useSinglePdf();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<OutputMode>('one');
  const [result, setResult] = useState<OutputFile[]>();
  const task = useTask(common.errors, t.errors);

  function reset() {
    setResult(undefined);
    task.reset();
  }

  function pick(next: File | undefined) {
    setFile(next);
    setSelected(new Set());
    reset();
  }

  async function extract() {
    if (doc.state !== 'ready' || !file) return;
    // Keep document order; the selection set remembers click order.
    const pages = [...selected].sort((a, b) => a - b);
    const input = { name: file.name, bytes: doc.bytes };
    const output = await task.run((onProgress) =>
      mode === 'one'
        ? runPdfJob(
            'assemble',
            {
              inputs: [input],
              pages: pages.map((index) => ({ source: 0, index, rotation: 0 as const })),
              outputName: `${baseName(file.name)}-${t.outputSuffix}.pdf`,
            },
            onProgress,
          )
        : runPdfJob('split', { input, mode: { kind: 'ranges', groups: pages.map((index) => [index]) } }, onProgress),
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
            onChange={(next) => {
              setSelected(next);
              reset();
            }}
            rangeLabel={t.rangeLabel}
            instructions={t.instructions}
            disabled={task.working}
          />
          <div className="tool__actions">
            <Segmented
              label={t.outputLabel}
              value={mode}
              options={[
                { value: 'one', label: t.outputs.one },
                { value: 'separate', label: t.outputs.separate },
              ]}
              onChange={(next) => {
                setMode(next);
                reset();
              }}
              disabled={task.working}
            />
            <button type="button" className="primary-button" disabled={selected.size === 0 || task.working} onClick={extract}>
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
