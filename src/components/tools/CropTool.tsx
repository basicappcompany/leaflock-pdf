import { useState } from 'react';
import '../../styles/organize.css';
import { format } from '../../i18n';
import { hasCrop, noMargins, setMargin, type Margins } from '../../lib/organize/cropMath';
import { parsePageRanges } from '../../lib/pageRanges';
import { runPdfJob } from '../../lib/pdf/client';
import { baseName, type OutputFile } from '../../lib/pdf/types';
import { Field, Segmented } from '../ui/fields';
import { PagePreview } from '../ui/PagePreview';
import { PageRangeField } from '../ui/PageRangeField';
import { ResultFiles } from '../ui/ResultFiles';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import { CropOverlay } from './organize/CropOverlay';
import { PdfIntake, useSinglePdf } from './organize/PdfIntake';
import type { ToolProps } from './types';

type ApplyTo = 'all' | 'current' | 'custom';

const sides = ['top', 'right', 'bottom', 'left'] as const;

export default function CropTool({ locale, common, t }: ToolProps<'crop'>) {
  const { file, setFile, doc } = useSinglePdf();
  const [pageNumber, setPageNumber] = useState(1);
  const [margins, setMargins] = useState<Margins>(noMargins);
  const [applyTo, setApplyTo] = useState<ApplyTo>('all');
  const [custom, setCustom] = useState('');
  const [result, setResult] = useState<OutputFile[]>();
  const task = useTask(common.errors, t.errors);

  const pageCount = doc.state === 'ready' ? doc.doc.numPages : 0;

  function changed() {
    setResult(undefined);
    task.reset();
  }

  function pick(next: File | undefined) {
    setFile(next);
    setPageNumber(1);
    setMargins(noMargins);
    setCustom('');
    changed();
  }

  function changeMargins(next: Margins) {
    setMargins(next);
    changed();
  }

  const pages: number[] | null =
    applyTo === 'all'
      ? Array.from({ length: pageCount }, (_, index) => index)
      : applyTo === 'current'
        ? [pageNumber - 1]
        : parsePageRanges(custom, pageCount);

  async function run() {
    if (doc.state !== 'ready' || !file || !pages) return;
    const output = await task.run((onProgress) =>
      runPdfJob(
        'crop',
        {
          input: { name: file.name, bytes: doc.bytes },
          margins,
          pages,
          outputName: `${baseName(file.name)}-${t.outputSuffix}.pdf`,
        },
        onProgress,
      ),
    );
    if (output) setResult(output);
  }

  const working = task.working;
  const ready = hasCrop(margins) && pages !== null && pages.length > 0;

  return (
    <div className="tool">
      <PdfIntake file={file} doc={doc} common={common} locale={locale} onFile={pick} disabled={working} />

      {doc.state === 'ready' && (
        <div className="tool__workspace">
          <div className="tool">
            <p className="muted">{t.instructions}</p>
            <PagePreview doc={doc.doc} pageNumber={pageNumber} alt={format(common.pages.page, { number: pageNumber })}>
              <CropOverlay
                margins={margins}
                onChange={changeMargins}
                labels={{ ...t.handles, area: t.cropArea }}
                disabled={working}
              />
            </PagePreview>
            {pageCount > 1 && (
              <div className="pager">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={common.pages.previous}
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber(pageNumber - 1)}
                >
                  ←
                </button>
                <span>{format(common.pages.of, { number: pageNumber, count: pageCount })}</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={common.pages.next}
                  disabled={pageNumber >= pageCount}
                  onClick={() => setPageNumber(pageNumber + 1)}
                >
                  →
                </button>
              </div>
            )}
          </div>

          <div className="panel">
            <fieldset className="segmented">
              <legend>{t.marginsHeading}</legend>
              <div className="crop-margins">
                {sides.map((side) => (
                  <Field key={side} label={t.margins[side]}>
                    {(id) => (
                      <input
                        id={id}
                        type="number"
                        min={0}
                        max={95}
                        step={0.5}
                        value={Math.round(margins[side] * 1000) / 10}
                        disabled={working}
                        onChange={(event) => changeMargins(setMargin(margins, side, Number(event.currentTarget.value) / 100))}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </fieldset>
            <button
              type="button"
              className="link-button"
              disabled={!hasCrop(margins) || working}
              onClick={() => changeMargins(noMargins)}
            >
              {t.reset}
            </button>

            <Segmented
              label={t.applyLabel}
              value={applyTo}
              options={[
                { value: 'all', label: t.apply.all },
                { value: 'current', label: t.apply.current },
                { value: 'custom', label: t.apply.custom },
              ]}
              onChange={(next) => {
                setApplyTo(next);
                changed();
              }}
              disabled={working}
            />
            {applyTo === 'custom' && (
              <PageRangeField
                value={custom}
                onChange={(value) => {
                  setCustom(value);
                  changed();
                }}
                pageCount={pageCount}
                common={common}
                disabled={working}
              />
            )}

            <p className="muted">{t.note}</p>
            {!hasCrop(margins) && <p className="hint">{t.nothingToCrop}</p>}
            <button type="button" className="primary-button" disabled={!ready || working} onClick={run}>
              {working ? common.actions.working : t.action}
            </button>
          </div>
        </div>
      )}

      <TaskStatusView status={task.status} common={common} />
      {result && <ResultFiles files={result} common={common} locale={locale} onStartOver={() => pick(undefined)} />}
    </div>
  );
}
