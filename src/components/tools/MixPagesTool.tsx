import { useState } from 'react';
import { interleavePages } from '../../lib/organize/pages';
import { runPdfJob } from '../../lib/pdf/client';
import type { OutputFile } from '../../lib/pdf/types';
import { Checkbox, Field } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { usePdfDocument } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import type { ToolProps } from './types';

export default function MixPagesTool({ locale, common, t }: ToolProps<'mixPages'>) {
  const [first, setFirst] = useState<File>();
  const [second, setSecond] = useState<File>();
  const [reverseSecond, setReverseSecond] = useState(true);
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<OutputFile[]>();
  const task = useTask(common.errors, t.errors);

  const firstDoc = usePdfDocument(first);
  const secondDoc = usePdfDocument(second);

  function startOver() {
    setFirst(undefined);
    setSecond(undefined);
    setResult(undefined);
    task.reset();
  }

  function changed() {
    setResult(undefined);
    task.reset();
  }

  async function run() {
    if (!first || !second || firstDoc.state !== 'ready' || secondDoc.state !== 'ready') return;
    setResult(undefined);

    // Both files are already in memory from the previews, so they are not read twice.
    const order = interleavePages(firstDoc.doc.numPages, secondDoc.doc.numPages, { step, reverseSecond });
    const output = await task.run(async (onProgress) =>
      runPdfJob(
        'assemble',
        {
          inputs: [
            { name: first.name, bytes: firstDoc.bytes },
            { name: second.name, bytes: secondDoc.bytes },
          ],
          pages: order.map(({ source, index }) => ({ source, index, rotation: 0 as const })),
          outputName: t.outputName,
        },
        onProgress,
      ),
    );
    if (output) setResult(output);
  }

  const working = task.working;
  const ready = firstDoc.state === 'ready' && secondDoc.state === 'ready';

  return (
    <div className="tool">
      <section>
        <h2 className="tool__slot-title">{t.firstFile}</h2>
        {first ? (
          <SelectedFile
            file={first}
            common={common}
            locale={locale}
            onClear={() => {
              setFirst(undefined);
              changed();
            }}
            disabled={working}
          />
        ) : (
          <>
            <p className="hint">{t.firstFileHint}</p>
            <FilePicker common={common} onFiles={([picked]) => setFirst(picked)} />
          </>
        )}
      </section>

      <section>
        <h2 className="tool__slot-title">{t.secondFile}</h2>
        {second ? (
          <SelectedFile
            file={second}
            common={common}
            locale={locale}
            onClear={() => {
              setSecond(undefined);
              changed();
            }}
            disabled={working}
          />
        ) : (
          <>
            <p className="hint">{t.secondFileHint}</p>
            <FilePicker common={common} onFiles={([picked]) => setSecond(picked)} />
          </>
        )}
      </section>

      {first && second && (
        <>
          <div className="panel">
            <Checkbox
              label={t.reverseSecond}
              checked={reverseSecond}
              disabled={working}
              onChange={(checked) => {
                setReverseSecond(checked);
                changed();
              }}
            />
            {reverseSecond && <p className="hint">{t.reverseSecondHint}</p>}

            <Field label={t.step}>
              {(id) => (
                <input
                  id={id}
                  type="number"
                  min={1}
                  max={50}
                  value={step}
                  disabled={working}
                  onChange={(event) => {
                    setStep(Math.max(1, Math.min(50, Number(event.target.value) || 1)));
                    changed();
                  }}
                />
              )}
            </Field>
          </div>

          <div className="tool__actions">
            <button type="button" className="primary-button" disabled={working || !ready} onClick={run}>
              {working ? common.actions.working : t.action}
            </button>
          </div>
        </>
      )}

      <TaskStatusView status={task.status} common={common} />
      {result && <ResultFiles files={result} common={common} locale={locale} onStartOver={startOver} />}
    </div>
  );
}
