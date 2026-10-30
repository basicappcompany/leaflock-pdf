import { useEffect, useRef, useState } from 'react';
import { format, plural } from '../../i18n';
import type { OverlayItem } from '../../lib/edit/overlays';
import { runPdfJob } from '../../lib/pdf/client';
import type { OutputFile } from '../../lib/pdf/types';
import { FilePicker } from '../ui/FilePicker';
import type { PageSize } from '../ui/PagePreview';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import type { PlacedImage } from './edit/images';
import { OverlayEditor } from './edit/OverlayEditor';
import { SignatureCreator } from './edit/SignatureCreator';
import { usePickedPdf } from './edit/usePickedPdf';
import type { ToolProps } from './types';
import '../../styles/edit.css';

type SignItem = Extract<OverlayItem, { kind: 'image' } | { kind: 'text' }>;

const DATE_SIZE = 11;

export default function SignTool({ locale, common, t }: ToolProps<'sign'>) {
  const picked = usePickedPdf(common);
  const task = useTask(common.errors, t.errors);
  const [result, setResult] = useState<OutputFile[]>();
  const [signatures, setSignatures] = useState<Record<string, PlacedImage>>({});
  const [current, setCurrent] = useState<string>();
  const [creating, setCreating] = useState(true);
  const [items, setItems] = useState<SignItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [page, setPage] = useState(0);
  const pageSize = useRef<PageSize>({ width: 612, height: 792 });

  // Free the preview images when the tool goes away.
  const signaturesRef = useRef(signatures);
  signaturesRef.current = signatures;
  useEffect(() => () => Object.values(signaturesRef.current).forEach((signature) => URL.revokeObjectURL(signature.url)), []);

  function edited(next: SignItem[]) {
    setItems(next);
    setResult(undefined);
    task.reset();
  }

  function reset() {
    picked.setFile(undefined);
    setItems([]);
    setPage(0);
    setSelectedId(undefined);
    setResult(undefined);
    task.reset();
  }

  function addSignature(signature: PlacedImage) {
    const id = crypto.randomUUID();
    setSignatures((all) => ({ ...all, [id]: signature }));
    setCurrent(id);
    setCreating(false);
    place(id, signature);
  }

  function place(imageId: string, signature: PlacedImage) {
    const { width: pageW, height: pageH } = pageSize.current;
    const w = 0.28;
    const h = Math.min((w * pageW * (signature.height / signature.width)) / pageH, 0.4);
    const item: SignItem = { id: crypto.randomUUID(), page, kind: 'image', imageId, x: 0.55, y: 0.78, w, h };
    edited([...items, item]);
    setSelectedId(item.id);
  }

  function addDate() {
    const text = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date());
    const { width: pageW, height: pageH } = pageSize.current;
    const item: SignItem = {
      id: crypto.randomUUID(),
      page,
      kind: 'text',
      text,
      fontSize: DATE_SIZE,
      color: '#000000',
      x: 0.55,
      y: 0.9,
      // Rough box for selecting and dragging; the text itself starts at the top-left.
      w: Math.min((text.length * DATE_SIZE * 0.55) / pageW, 0.9),
      h: (DATE_SIZE * 1.2) / pageH,
    };
    edited([...items, item]);
    setSelectedId(item.id);
  }

  async function run() {
    const file = picked.file;
    if (!file) return;
    const used = new Set(items.flatMap((item) => (item.kind === 'image' ? [item.imageId] : [])));
    const images = Object.fromEntries(
      [...used].map((id) => [id, { bytes: signatures[id]!.bytes, type: signatures[id]!.type }]),
    );
    const output = await task.run(async (onProgress) =>
      runPdfJob(
        'placeOverlays',
        {
          input: { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) },
          outputName: picked.outputName(t.outputSuffix),
          items,
          images,
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
  const signature = current ? signatures[current] : undefined;
  const label = (item: SignItem) =>
    format(item.kind === 'image' ? t.itemLabel.signature : t.itemLabel.date, { page: item.page + 1 });

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
            onPageSize={(size) => {
              pageSize.current = size;
            }}
            previewLabel={format(common.pages.page, { number: page + 1 })}
            common={common}
            disabled={working}
            renderItem={(item, scale) =>
              item.kind === 'image' ? (
                <img className="overlay-item__image" src={signatures[item.imageId]?.url} alt="" draggable={false} />
              ) : (
                <p className="overlay-item__text" style={{ fontSize: item.fontSize * scale, color: item.color }}>
                  {item.text}
                </p>
              )
            }
          />

          <div className="panel__section">
            {creating || !signature ? (
              <SignatureCreator
                t={t}
                common={common}
                onCreate={addSignature}
                onCancel={signature ? () => setCreating(false) : undefined}
              />
            ) : (
              <div className="panel">
                <h2 className="panel__heading">{t.yourSignature}</h2>
                <div className="signature-preview">
                  <img src={signature.url} alt={t.signatureImage} />
                </div>
                <div className="toolbar">
                  <button type="button" className="secondary-button" onClick={() => place(current!, signature)} disabled={working}>
                    {t.placeOnPage}
                  </button>
                  <button type="button" className="secondary-button" onClick={addDate} disabled={working}>
                    {t.addDate}
                  </button>
                </div>
                <button type="button" className="link-button" onClick={() => setCreating(true)} disabled={working}>
                  {t.newSignature}
                </button>
                <p className="hint">{t.placeHint}</p>
                {selectedId && (
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      edited(items.filter((item) => item.id !== selectedId));
                      setSelectedId(undefined);
                    }}
                    disabled={working}
                  >
                    {t.removeItem}
                  </button>
                )}
              </div>
            )}
            <p className="muted">{t.memoryNote}</p>
            {items.length > 0 && <p className="muted">{plural(locale, t.placedCount, items.length)}</p>}
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
