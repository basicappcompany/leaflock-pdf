import { useEffect, useId, useRef, useState } from 'react';
import { format, plural } from '../../i18n';
import { clampBox, type OverlayItem } from '../../lib/edit/overlays';
import { runPdfJob } from '../../lib/pdf/client';
import type { OutputFile } from '../../lib/pdf/types';
import { Field, Options, Segmented } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import type { PageSize } from '../ui/PagePreview';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import { imageFromFile, type PlacedImage } from './edit/images';
import { OverlayEditor, type Box } from './edit/OverlayEditor';
import { usePickedPdf } from './edit/usePickedPdf';
import type { ToolProps } from './types';
import '../../styles/edit.css';

type EditItem = Exclude<OverlayItem, { kind: 'redaction' }>;
type Mode = 'select' | 'text' | 'image' | 'rect' | 'highlight' | 'whiteout';

const HIGHLIGHTS = { yellow: '#ffeb3b', green: '#9be15d', pink: '#ff8ac6', blue: '#7cc8ff' } as const;

/** Box size for text, so it can be selected and dragged; the PDF text starts at its top-left. */
function textBox(item: Extract<EditItem, { kind: 'text' }>, page: PageSize): Extract<EditItem, { kind: 'text' }> {
  const lines = item.text.split('\n');
  const longest = Math.max(1, ...lines.map((line) => line.length));
  return clampBox({
    ...item,
    w: (longest * item.fontSize * 0.56) / page.width,
    h: (lines.length * item.fontSize * 1.2) / page.height,
  });
}

export default function EditTool({ locale, common, t }: ToolProps<'edit'>) {
  const picked = usePickedPdf(common);
  const task = useTask(common.errors, t.errors);
  const [result, setResult] = useState<OutputFile[]>();
  const [mode, setMode] = useState<Mode>('select');
  const [items, setItems] = useState<EditItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [page, setPage] = useState(0);
  const [images, setImages] = useState<Record<string, PlacedImage>>({});
  const [style, setStyle] = useState({ fontSize: 14, color: '#000000', stroke: '#d32f2f', fill: null as string | null, strokeWidth: 2, highlight: HIGHLIGHTS.yellow as string });
  const pageSize = useRef<PageSize>({ width: 612, height: 792 });
  const imageInput = useRef<HTMLInputElement>(null);
  const imageInputId = useId();
  const [imageError, setImageError] = useState<string>();

  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => () => Object.values(imagesRef.current).forEach((image) => URL.revokeObjectURL(image.url)), []);

  const selected = items.find((item) => item.id === selectedId);

  function edited(next: EditItem[]) {
    setItems(next);
    setResult(undefined);
    task.reset();
  }

  function updateSelected(change: Partial<EditItem>) {
    if (!selected) return;
    let next = { ...selected, ...change } as EditItem;
    if (next.kind === 'text') next = textBox(next, pageSize.current);
    edited(items.map((item) => (item.id === selected.id ? next : item)));
  }

  function add(item: EditItem) {
    edited([...items, item]);
    setSelectedId(item.id);
  }

  function reset() {
    picked.setFile(undefined);
    setItems([]);
    setPage(0);
    setSelectedId(undefined);
    setResult(undefined);
    task.reset();
  }

  function onPageClick(pageIndex: number, x: number, y: number) {
    if (mode !== 'text') return setSelectedId(undefined);
    add(
      textBox(
        { id: crypto.randomUUID(), page: pageIndex, kind: 'text', text: t.defaultText, fontSize: style.fontSize, color: style.color, x, y, w: 0.1, h: 0.03 },
        pageSize.current,
      ),
    );
    setMode('select');
  }

  function onDraw(pageIndex: number, box: Box) {
    const base = { id: crypto.randomUUID(), page: pageIndex, ...box };
    if (mode === 'rect') add({ ...base, kind: 'rect', stroke: style.stroke, fill: style.fill, strokeWidth: style.strokeWidth });
    else if (mode === 'highlight') add({ ...base, kind: 'highlight', color: style.highlight });
    else if (mode === 'whiteout') add({ ...base, kind: 'whiteout' });
  }

  async function addImage(file: File) {
    setImageError(undefined);
    try {
      const image = await imageFromFile(file);
      const imageId = crypto.randomUUID();
      setImages((all) => ({ ...all, [imageId]: image }));
      const { width: pageW, height: pageH } = pageSize.current;
      const w = 0.3;
      const h = Math.min((w * pageW * (image.height / image.width)) / pageH, 0.6);
      add({ id: crypto.randomUUID(), page, kind: 'image', imageId, x: 0.35, y: 0.3, w, h });
      setMode('select');
    } catch {
      setImageError(t.errors['bad-image']);
    }
  }

  async function run() {
    const file = picked.file;
    if (!file) return;
    const used = new Set(items.flatMap((item) => (item.kind === 'image' ? [item.imageId] : [])));
    const payload = Object.fromEntries([...used].map((id) => [id, { bytes: images[id]!.bytes, type: images[id]!.type }]));
    const output = await task.run(async (onProgress) =>
      runPdfJob(
        'placeOverlays',
        {
          input: { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) },
          outputName: picked.outputName(t.outputSuffix),
          items,
          images: payload,
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
  const drawing = mode === 'rect' || mode === 'highlight' || mode === 'whiteout';
  const label = (item: EditItem) =>
    format(t.itemLabel[item.kind], { page: item.page + 1, text: item.kind === 'text' ? item.text.slice(0, 40) : '' });

  return (
    <div className="tool">
      <SelectedFile file={picked.file} pageCount={picked.pageCount} common={common} locale={locale} onClear={reset} disabled={working} />
      {picked.loadError && (
        <p className="error" role="alert">
          {picked.loadError}
        </p>
      )}
      <p className="notice">{t.honesty}</p>

      {picked.pdf.state === 'ready' && (
        <div className="tool__workspace">
          <OverlayEditor
            doc={picked.pdf.doc}
            pageCount={picked.pdf.doc.numPages}
            page={page}
            onPageChange={setPage}
            items={items}
            onChange={edited}
            selectedId={selectedId}
            onSelect={setSelectedId}
            itemLabel={label}
            keepAspect={(item) => item.kind === 'image'}
            onDraw={drawing ? onDraw : undefined}
            onPageClick={onPageClick}
            onPageSize={(size) => {
              pageSize.current = size;
            }}
            previewLabel={format(common.pages.page, { number: page + 1 })}
            common={common}
            disabled={working}
            renderItem={(item, scale) => {
              switch (item.kind) {
                case 'text':
                  return (
                    <p className="overlay-item__text" style={{ fontSize: item.fontSize * scale, color: item.color }}>
                      {item.text}
                    </p>
                  );
                case 'image':
                  return <img className="overlay-item__image" src={images[item.imageId]?.url} alt="" draggable={false} />;
                case 'rect':
                  return (
                    <div
                      className="overlay-item__fill"
                      style={{
                        background: item.fill ?? 'transparent',
                        boxShadow: item.stroke ? `inset 0 0 0 ${Math.max(item.strokeWidth * scale, 1)}px ${item.stroke}` : 'none',
                      }}
                    />
                  );
                case 'highlight':
                  return <div className="overlay-item__fill" style={{ background: item.color }} />;
                case 'whiteout':
                  return <div className="overlay-item__fill" />;
              }
            }}
          />

          <div className="panel">
            <Segmented
              label={t.toolLabel}
              value={mode}
              onChange={(next) => {
                setMode(next);
                if (next === 'image') imageInput.current?.click();
              }}
              options={(['select', 'text', 'image', 'rect', 'highlight', 'whiteout'] as const).map((value) => ({
                value,
                label: t.tools[value],
              }))}
              disabled={working}
            />
            <p className="hint">{t.toolHints[mode]}</p>
            {mode === 'image' && (
              <label htmlFor={imageInputId} className="secondary-button">
                {t.chooseImage}
              </label>
            )}
            {imageError && (
              <p className="error" role="alert">
                {imageError}
              </p>
            )}
            <input
              ref={imageInput}
              id={imageInputId}
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                if (file) void addImage(file);
              }}
            />

            {selected && (
              <div className="panel__section">
                <h2 className="panel__heading">{t.propertiesHeading}</h2>
                {selected.kind === 'text' && (
                  <>
                    <Field label={t.textLabel}>
                      {(id) => (
                        <textarea id={id} rows={3} value={selected.text} onChange={(event) => updateSelected({ text: event.currentTarget.value })} />
                      )}
                    </Field>
                    <Options>
                      <Field label={t.sizeLabel}>
                        {(id) => (
                          <input
                            id={id}
                            type="number"
                            min={4}
                            max={200}
                            value={selected.fontSize}
                            onChange={(event) => {
                              const fontSize = Number(event.currentTarget.value);
                              if (fontSize >= 1) {
                                updateSelected({ fontSize });
                                setStyle((current) => ({ ...current, fontSize }));
                              }
                            }}
                          />
                        )}
                      </Field>
                      <Field label={t.colorLabel}>
                        {(id) => (
                          <input
                            id={id}
                            type="color"
                            value={selected.color}
                            onChange={(event) => {
                              const color = event.currentTarget.value;
                              updateSelected({ color });
                              setStyle((current) => ({ ...current, color }));
                            }}
                          />
                        )}
                      </Field>
                    </Options>
                  </>
                )}
                {selected.kind === 'rect' && (
                  <Options>
                    <Field label={t.strokeLabel}>
                      {(id) => (
                        <input
                          id={id}
                          type="color"
                          value={selected.stroke ?? '#000000'}
                          onChange={(event) => {
                            const stroke = event.currentTarget.value;
                            updateSelected({ stroke });
                            setStyle((current) => ({ ...current, stroke }));
                          }}
                        />
                      )}
                    </Field>
                    <Field label={t.strokeWidthLabel}>
                      {(id) => (
                        <input
                          id={id}
                          type="number"
                          min={0}
                          max={20}
                          value={selected.strokeWidth}
                          onChange={(event) => {
                            const strokeWidth = Math.max(0, Number(event.currentTarget.value));
                            updateSelected({ strokeWidth });
                            setStyle((current) => ({ ...current, strokeWidth }));
                          }}
                        />
                      )}
                    </Field>
                    <Field label={t.fillLabel}>
                      {(id) => (
                        <select
                          id={id}
                          value={selected.fill === null ? 'none' : 'color'}
                          onChange={(event) => {
                            const fill = event.currentTarget.value === 'none' ? null : selected.fill ?? '#ffffff';
                            updateSelected({ fill });
                            setStyle((current) => ({ ...current, fill }));
                          }}
                        >
                          <option value="none">{t.noFill}</option>
                          <option value="color">{t.fillColorLabel}</option>
                        </select>
                      )}
                    </Field>
                    {selected.fill !== null && (
                      <Field label={t.fillColorLabel}>
                        {(id) => (
                          <input
                            id={id}
                            type="color"
                            value={selected.fill ?? '#ffffff'}
                            onChange={(event) => {
                              const fill = event.currentTarget.value;
                              updateSelected({ fill });
                              setStyle((current) => ({ ...current, fill }));
                            }}
                          />
                        )}
                      </Field>
                    )}
                  </Options>
                )}
                {selected.kind === 'highlight' && (
                  <fieldset className="segmented">
                    <legend>{t.colorLabel}</legend>
                    <div className="swatches">
                      {(Object.keys(HIGHLIGHTS) as (keyof typeof HIGHLIGHTS)[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          className="swatch"
                          style={{ background: HIGHLIGHTS[key] }}
                          aria-label={t.highlightColors[key]}
                          aria-pressed={selected.color === HIGHLIGHTS[key]}
                          onClick={() => {
                            updateSelected({ color: HIGHLIGHTS[key] });
                            setStyle((current) => ({ ...current, highlight: HIGHLIGHTS[key] }));
                          }}
                        />
                      ))}
                    </div>
                  </fieldset>
                )}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    edited(items.filter((item) => item.id !== selected.id));
                    setSelectedId(undefined);
                  }}
                >
                  {t.remove}
                </button>
              </div>
            )}

            <p className="muted">{items.length === 0 ? t.noEdits : plural(locale, t.editCount, items.length)}</p>
            <button type="button" className="primary-button" onClick={run} disabled={items.length === 0 || working}>
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
