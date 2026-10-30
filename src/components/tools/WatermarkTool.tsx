import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from '../../i18n';
import { tileCentres } from '../../lib/edit/tiles';
import { parsePageRanges } from '../../lib/pageRanges';
import { runPdfJob } from '../../lib/pdf/client';
import type { OutputFile } from '../../lib/pdf/types';
import type { PDFDocumentProxy } from '../../lib/pdfjs';
import { Field, Options, Segmented } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { PagePreview, type PageSize } from '../ui/PagePreview';
import { PageRangeField } from '../ui/PageRangeField';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import { imageFromFile, type PlacedImage } from './edit/images';
import { useElementSize } from './edit/useElementSize';
import { usePickedPdf } from './edit/usePickedPdf';
import type { ToolProps } from './types';
import '../../styles/edit.css';

type Kind = 'text' | 'image';

interface Look {
  kind: Kind;
  text: string;
  fontSize: number;
  color: string;
  image: PlacedImage | undefined;
  scale: number;
  opacity: number;
  angle: number;
  placement: 'center' | 'tile';
}

export default function WatermarkTool({ locale, common, t }: ToolProps<'watermark'>) {
  const picked = usePickedPdf(common);
  const task = useTask(common.errors, t.errors);
  const [result, setResult] = useState<OutputFile[]>();
  const [look, setLook] = useState<Look>({
    kind: 'text',
    text: t.defaultText,
    fontSize: 60,
    color: '#c62828',
    image: undefined,
    scale: 0.4,
    opacity: 0.3,
    angle: 45,
    placement: 'center',
  });
  const [layer, setLayer] = useState<'over' | 'under'>('over');
  const [pagesMode, setPagesMode] = useState<'all' | 'custom'>('all');
  const [rangeText, setRangeText] = useState('');
  const [imageError, setImageError] = useState<string>();

  const imageUrl = look.image?.url;
  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const pageCount = picked.pageCount ?? 0;
  const pages = useMemo(
    () => (pagesMode === 'all' ? null : parsePageRanges(rangeText, pageCount)),
    [pagesMode, rangeText, pageCount],
  );

  function change(next: Partial<Look>) {
    setLook((current) => ({ ...current, ...next }));
    setResult(undefined);
    task.reset();
  }

  function reset() {
    picked.setFile(undefined);
    setResult(undefined);
    task.reset();
  }

  async function pickImage(file: File) {
    setImageError(undefined);
    try {
      change({ image: await imageFromFile(file) });
    } catch {
      setImageError(t.errors['bad-image']);
    }
  }

  async function run() {
    const file = picked.file;
    if (!file) return;
    const image = look.image;
    const output = await task.run(async (onProgress) =>
      runPdfJob(
        'addWatermark',
        {
          input: { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) },
          outputName: picked.outputName(t.outputSuffix),
          content:
            look.kind === 'text' || !image
              ? { kind: 'text', text: look.text, fontSize: look.fontSize, color: look.color }
              : { kind: 'image', bytes: image.bytes, type: image.type, scale: look.scale },
          opacity: look.opacity,
          angle: look.angle,
          placement: look.placement,
          layer,
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

  const working = task.working;
  const missing = look.kind === 'text' ? (look.text.trim() === '' ? t.needText : undefined) : look.image ? undefined : t.needImage;
  const pagesInvalid = pagesMode === 'custom' && !pages;
  const previewPage = pages?.[0] ?? 0;

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
          <WatermarkPreview doc={picked.pdf.doc} pageIndex={previewPage} look={look} alt={format(t.previewLabel, { number: previewPage + 1 })} />

          <div className="panel">
            <Segmented
              label={t.kindLabel}
              value={look.kind}
              onChange={(kind) => change({ kind })}
              options={[
                { value: 'text', label: t.kinds.text },
                { value: 'image', label: t.kinds.image },
              ]}
            />
            {look.kind === 'text' ? (
              <>
                <Field label={t.textLabel}>
                  {(id) => (
                    <textarea id={id} rows={2} value={look.text} onChange={(event) => change({ text: event.currentTarget.value })} />
                  )}
                </Field>
                <Options>
                  <Field label={t.sizeLabel}>
                    {(id) => (
                      <input
                        id={id}
                        type="number"
                        min={8}
                        max={300}
                        value={look.fontSize}
                        onChange={(event) => {
                          const value = Number(event.currentTarget.value);
                          if (value >= 1) change({ fontSize: Math.min(value, 300) });
                        }}
                      />
                    )}
                  </Field>
                  <Field label={t.colorLabel}>
                    {(id) => <input id={id} type="color" value={look.color} onChange={(event) => change({ color: event.currentTarget.value })} />}
                  </Field>
                </Options>
              </>
            ) : (
              <>
                {look.image ? (
                  <div className="signature-preview">
                    <img src={look.image.url} alt={t.imageLabel} />
                    <button type="button" className="link-button" onClick={() => change({ image: undefined })}>
                      {t.changeImage}
                    </button>
                  </div>
                ) : (
                  <FilePicker common={common} kind="image" onFiles={([file]) => file && void pickImage(file)} />
                )}
                <p className="hint">{t.imageHint}</p>
                {imageError && (
                  <p className="error" role="alert">
                    {imageError}
                  </p>
                )}
                <Slider
                  label={format(t.scaleLabel, { percent: Math.round(look.scale * 100) })}
                  value={look.scale * 100}
                  min={5}
                  max={100}
                  onChange={(value) => change({ scale: value / 100 })}
                />
              </>
            )}
            <Slider
              label={format(t.opacityLabel, { percent: Math.round(look.opacity * 100) })}
              value={look.opacity * 100}
              min={5}
              max={100}
              onChange={(value) => change({ opacity: value / 100 })}
            />
            <Slider
              label={format(t.angleLabel, { degrees: look.angle })}
              value={look.angle}
              min={-90}
              max={90}
              step={15}
              onChange={(angle) => change({ angle })}
            />
            <Segmented
              label={t.placementLabel}
              value={look.placement}
              onChange={(placement) => change({ placement })}
              options={[
                { value: 'center', label: t.placements.center },
                { value: 'tile', label: t.placements.tile },
              ]}
            />
            <Segmented
              label={t.layerLabel}
              value={layer}
              onChange={(value) => {
                setLayer(value);
                setResult(undefined);
              }}
              options={[
                { value: 'over', label: t.layers.over },
                { value: 'under', label: t.layers.under },
              ]}
            />
            {layer === 'under' && <p className="hint">{t.underHint}</p>}
            <Segmented
              label={t.pagesLabel}
              value={pagesMode}
              onChange={(value) => {
                setPagesMode(value);
                setResult(undefined);
              }}
              options={[
                { value: 'all', label: t.pagesMode.all },
                { value: 'custom', label: t.pagesMode.custom },
              ]}
            />
            {pagesMode === 'custom' && (
              <PageRangeField value={rangeText} onChange={setRangeText} pageCount={pageCount} common={common} />
            )}
            {missing && <p className="hint">{missing}</p>}
            <button type="button" className="primary-button" onClick={run} disabled={!!missing || pagesInvalid || working}>
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

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.currentTarget.value))} />
      )}
    </Field>
  );
}

let measureContext: CanvasRenderingContext2D | null | undefined;

/** Approximate size in points of text at `size` pt, as Helvetica draws it. */
function measureText(text: string, size: number): { width: number; height: number } {
  measureContext ??= document.createElement('canvas').getContext('2d');
  const lines = text.split(/\r?\n/);
  let width = 0;
  if (measureContext) {
    measureContext.font = `${size}px Helvetica, Arial, sans-serif`;
    for (const line of lines) width = Math.max(width, measureContext.measureText(line).width);
  }
  return { width, height: lines.length * size * 1.2 };
}

/** The page with the watermark drawn on top as the result will look (approximately). */
function WatermarkPreview({ doc, pageIndex, look, alt }: { doc: PDFDocumentProxy; pageIndex: number; look: Look; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const box = useElementSize(ref);
  const [page, setPage] = useState<PageSize>();
  const scale = page && box.width ? box.width / page.width : 0;

  let marks: { x: number; y: number }[] = [];
  let mark = { width: 0, height: 0 };
  if (page && scale > 0) {
    if (look.kind === 'text') mark = measureText(look.text, look.fontSize);
    else if (look.image) {
      const width = page.width * look.scale;
      mark = { width, height: (width * look.image.height) / look.image.width };
    }
    const centres =
      look.placement === 'tile'
        ? tileCentres(page.width, page.height, mark.width, mark.height, look.angle)
        : [[page.width / 2, page.height / 2] as [number, number]];
    marks = centres.map(([x, y]) => ({ x, y }));
  }

  return (
    <PagePreview doc={doc} pageNumber={pageIndex + 1} alt={alt} onSize={setPage}>
      <div ref={ref} className="stamp-preview">
        {marks.map((centre, index) => {
          const style = {
            left: (centre.x - mark.width / 2) * scale,
            top: (centre.y - mark.height / 2) * scale,
            width: mark.width * scale,
            height: mark.height * scale,
            opacity: look.opacity,
            // CSS rotates clockwise; the angle is counter-clockwise.
            transform: `rotate(${-look.angle}deg)`,
          };
          return look.kind === 'text' ? (
            <span key={index} className="stamp-preview__mark" style={{ ...style, fontSize: look.fontSize * scale, color: look.color, textAlign: 'center' }}>
              {look.text}
            </span>
          ) : look.image ? (
            <img key={index} className="stamp-preview__image" src={look.image.url} alt="" style={style} />
          ) : null;
        })}
      </div>
    </PagePreview>
  );
}
