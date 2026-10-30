import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { format } from '../../i18n';
import { parsePageRanges } from '../../lib/pageRanges';
import { runPdfJob } from '../../lib/pdf/client';
import type { NumberPosition } from '../../lib/pdf/ops/addPageNumbers';
import type { OutputFile } from '../../lib/pdf/types';
import type { PDFDocumentProxy } from '../../lib/pdfjs';
import { Checkbox, Field, Options, Segmented } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { PagePreview, type PageSize } from '../ui/PagePreview';
import { PageRangeField } from '../ui/PageRangeField';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import { useElementSize } from './edit/useElementSize';
import { usePickedPdf } from './edit/usePickedPdf';
import type { ToolProps } from './types';
import '../../styles/edit.css';

type Vertical = 'top' | 'bottom';
type Horizontal = 'left' | 'center' | 'right';
type TemplateKey = 'number' | 'page' | 'pageOfTotal' | 'slash' | 'custom';

export default function PageNumbersTool({ locale, common, t }: ToolProps<'pageNumbers'>) {
  const picked = usePickedPdf(common);
  const task = useTask(common.errors, t.errors);
  const [result, setResult] = useState<OutputFile[]>();

  const [vertical, setVertical] = useState<Vertical>('bottom');
  const [horizontal, setHorizontal] = useState<Horizontal>('center');
  const [templateKey, setTemplateKey] = useState<TemplateKey>('number');
  const [custom, setCustom] = useState('');
  const [startAt, setStartAt] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [margin, setMargin] = useState(28);
  const [color, setColor] = useState('#000000');
  const [pagesMode, setPagesMode] = useState<'all' | 'custom'>('all');
  const [rangeText, setRangeText] = useState('');
  const [skipFirst, setSkipFirst] = useState(false);

  const pageCount = picked.pageCount ?? 0;
  const template = templateKey === 'custom' ? custom : t.templates[templateKey];
  const customInvalid = templateKey === 'custom' && !custom.includes('{n}');

  // Which pages get a number, in order (0-based). Null while the range text is invalid.
  const pages = useMemo(() => {
    if (pageCount === 0) return null;
    const base = pagesMode === 'all' ? [...Array(pageCount).keys()] : parsePageRanges(rangeText, pageCount);
    if (!base) return null;
    const sorted = [...base].sort((a, b) => a - b);
    return skipFirst ? sorted.filter((index) => index !== 0) : sorted;
  }, [pageCount, pagesMode, rangeText, skipFirst]);

  function changed() {
    setResult(undefined);
    task.reset();
  }

  function reset() {
    picked.setFile(undefined);
    changed();
  }

  async function run() {
    if (!picked.file || !pages) return;
    const file = picked.file;
    const output = await task.run(async (onProgress) =>
      runPdfJob(
        'addPageNumbers',
        {
          input: { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) },
          outputName: picked.outputName(t.outputSuffix),
          template,
          position: `${vertical}-${horizontal}` as NumberPosition,
          startAt,
          fontSize,
          margin,
          color,
          pages,
        },
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

  const example = (text: string) => text.replaceAll('{n}', String(startAt)).replaceAll('{total}', String(startAt + Math.max((pages?.length ?? 1) - 1, 0)));
  const firstNumbered = pages?.[0] ?? 0;
  const working = task.working;
  const canRun = !!pages && pages.length > 0 && !customInvalid && template.trim() !== '' && !working;

  return (
    <div className="tool">
      <SelectedFile file={picked.file} pageCount={picked.pageCount} common={common} locale={locale} onClear={reset} disabled={working} />
      {picked.loadError && (
        <p className="error" role="alert">
          {picked.loadError}
        </p>
      )}

      {picked.pdf.state === 'ready' && (
        <div className="tool__workspace">
          <NumberPreview
            doc={picked.pdf.doc}
            pageIndex={firstNumbered}
            label={example(template)}
            vertical={vertical}
            horizontal={horizontal}
            fontSize={fontSize}
            margin={margin}
            color={color}
            alt={format(t.previewLabel, { number: firstNumbered + 1 })}
          />

          <div className="panel">
            <Segmented
              label={t.verticalLabel}
              value={vertical}
              onChange={(value) => {
                setVertical(value);
                changed();
              }}
              options={[
                { value: 'top', label: t.vertical.top },
                { value: 'bottom', label: t.vertical.bottom },
              ]}
            />
            <Segmented
              label={t.horizontalLabel}
              value={horizontal}
              onChange={(value) => {
                setHorizontal(value);
                changed();
              }}
              options={[
                { value: 'left', label: t.horizontal.left },
                { value: 'center', label: t.horizontal.center },
                { value: 'right', label: t.horizontal.right },
              ]}
            />
            <Field label={t.styleLabel}>
              {(id) => (
                <select
                  id={id}
                  value={templateKey}
                  onChange={(event) => {
                    setTemplateKey(event.currentTarget.value as TemplateKey);
                    changed();
                  }}
                >
                  {(['number', 'page', 'pageOfTotal', 'slash'] as const).map((key) => (
                    <option key={key} value={key}>
                      {example(t.templates[key])}
                    </option>
                  ))}
                  <option value="custom">{t.customStyle}</option>
                </select>
              )}
            </Field>
            {templateKey === 'custom' && (
              <Field label={t.customLabel} hint={t.customHint} error={customInvalid ? t.customMissing : undefined}>
                {(id, describedBy) => (
                  <input
                    id={id}
                    type="text"
                    value={custom}
                    placeholder={t.templates.pageOfTotal}
                    aria-describedby={describedBy}
                    aria-invalid={customInvalid}
                    onChange={(event) => {
                      setCustom(event.currentTarget.value);
                      changed();
                    }}
                  />
                )}
              </Field>
            )}
            <Options>
              <NumberField label={t.startLabel} value={startAt} min={0} max={99999} onChange={(value) => { setStartAt(value); changed(); }} />
              <NumberField label={t.sizeLabel} value={fontSize} min={6} max={72} onChange={(value) => { setFontSize(value); changed(); }} />
              <NumberField label={t.marginLabel} value={margin} min={0} max={144} onChange={(value) => { setMargin(value); changed(); }} />
              <Field label={t.colorLabel}>
                {(id) => (
                  <input id={id} type="color" value={color} onChange={(event) => { setColor(event.currentTarget.value); changed(); }} />
                )}
              </Field>
            </Options>
            <Segmented
              label={t.pagesLabel}
              value={pagesMode}
              onChange={(value) => {
                setPagesMode(value);
                changed();
              }}
              options={[
                { value: 'all', label: t.pagesMode.all },
                { value: 'custom', label: t.pagesMode.custom },
              ]}
            />
            {pagesMode === 'custom' && (
              <PageRangeField value={rangeText} onChange={(value) => { setRangeText(value); changed(); }} pageCount={pageCount} common={common} />
            )}
            <Checkbox label={t.skipFirst} checked={skipFirst} onChange={(value) => { setSkipFirst(value); changed(); }} />
            {pages && pages.length === 0 && <p className="hint">{t.nothingToNumber}</p>}
            <button type="button" className="primary-button" onClick={run} disabled={!canRun}>
              {working ? common.actions.working : t.action}
            </button>
          </div>
        </div>
      )}

      <TaskStatusView status={task.status} common={common} />
      {result && <ResultFiles files={result} common={common} locale={locale} onStartOver={reset} />}
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

/** The first numbered page with an approximate, live preview of where the number lands. */
function NumberPreview(props: {
  doc: PDFDocumentProxy;
  pageIndex: number;
  label: string;
  vertical: Vertical;
  horizontal: Horizontal;
  fontSize: number;
  margin: number;
  color: string;
  alt: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  const [page, setPage] = useState<PageSize>();
  const scale = page && size.width ? size.width / page.width : 0;

  const position: CSSProperties = {
    fontSize: props.fontSize * scale,
    color: props.color,
    [props.vertical]: props.margin * scale,
    ...(props.horizontal === 'center'
      ? { left: '50%', transform: 'translateX(-50%)' }
      : { [props.horizontal]: props.margin * scale }),
  };

  return (
    <PagePreview doc={props.doc} pageNumber={props.pageIndex + 1} alt={props.alt} onSize={setPage}>
      <div ref={ref} className="stamp-preview">
        {scale > 0 && (
          <span className="stamp-preview__mark" style={position}>
            {props.label}
          </span>
        )}
      </div>
    </PagePreview>
  );
}
