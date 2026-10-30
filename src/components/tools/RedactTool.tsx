import { useState } from 'react';
import { format, plural } from '../../i18n';
import type { OverlayItem } from '../../lib/edit/overlays';
import { runPdfJob } from '../../lib/pdf/client';
import type { OutputFile } from '../../lib/pdf/types';
import { renderPage, type PDFDocumentProxy } from '../../lib/pdfjs';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { OverlayEditor, type Box } from './edit/OverlayEditor';
import { usePickedPdf } from './edit/usePickedPdf';
import type { ToolProps } from './types';
import '../../styles/edit.css';

type Redaction = Extract<OverlayItem, { kind: 'redaction' }>;

/** Resolution of the flattened pages: sharp enough to read and print, without huge files. */
const DPI = 200;
const MAX_SIDE = 5000;

/** Renders a page with its redaction boxes painted solid black, as a JPEG. */
async function burnIn(doc: PDFDocumentProxy, pageIndex: number, boxes: Redaction[]): Promise<Uint8Array> {
  const page = await doc.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 1 });
  const scale = Math.min(DPI / 72, MAX_SIDE / Math.max(viewport.width, viewport.height));
  const canvas = await renderPage(page, { scale, pixelRatio: 1, background: 'white' });
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#000';
  for (const box of boxes) {
    // Round outwards so no anti-aliased sliver of the original survives at the edges.
    const left = Math.floor(box.x * canvas.width) - 1;
    const top = Math.floor(box.y * canvas.height) - 1;
    const right = Math.ceil((box.x + box.w) * canvas.width) + 1;
    const bottom = Math.ceil((box.y + box.h) * canvas.height) + 1;
    context.fillRect(left, top, right - left, bottom - top);
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new Error('Could not export the redacted page');
  canvas.width = 0;
  return new Uint8Array(await blob.arrayBuffer());
}

export default function RedactTool({ locale, common, t }: ToolProps<'redact'>) {
  const picked = usePickedPdf(common);
  const task = useTask(common.errors, t.errors);
  const [result, setResult] = useState<OutputFile[]>();
  const [boxes, setBoxes] = useState<Redaction[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [page, setPage] = useState(0);

  function edited(next: Redaction[]) {
    setBoxes(next);
    setResult(undefined);
    task.reset();
  }

  function reset() {
    picked.setFile(undefined);
    setBoxes([]);
    setPage(0);
    setSelectedId(undefined);
    setResult(undefined);
    task.reset();
  }

  function onDraw(pageIndex: number, box: Box) {
    const item: Redaction = { id: crypto.randomUUID(), page: pageIndex, kind: 'redaction', ...box };
    edited([...boxes, item]);
    setSelectedId(item.id);
  }

  const pagesWithBoxes = [...new Set(boxes.map((box) => box.page))].sort((a, b) => a - b);

  async function run() {
    const file = picked.file;
    if (!file || picked.pdf.state !== 'ready') return;
    const doc = picked.pdf.doc;
    const output = await task.run(async (onProgress) => {
      const pages = [];
      for (const [position, index] of pagesWithBoxes.entries()) {
        const bytes = await burnIn(doc, index, boxes.filter((box) => box.page === index));
        pages.push({ index, image: { bytes, type: 'jpeg' as const } });
        // Rendering is most of the work; the rebuild is quick.
        onProgress(((position + 1) / pagesWithBoxes.length) * 0.8);
      }
      return runPdfJob(
        'rasterizePages',
        { input: { name: file.name, bytes: await readBytes(file) }, outputName: picked.outputName(t.outputSuffix), pages },
        (fraction) => onProgress(0.8 + fraction * 0.2),
      );
    });
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
            items={boxes}
            onChange={edited}
            selectedId={selectedId}
            onSelect={setSelectedId}
            itemLabel={(box) => format(t.boxLabel, { page: box.page + 1 })}
            onDraw={onDraw}
            previewLabel={format(common.pages.page, { number: page + 1 })}
            common={common}
            disabled={working}
            renderItem={() => <div className="overlay-item__fill" />}
          />

          <div className="panel">
            <p className="hint">{t.drawHint}</p>
            {boxes.length > 0 && (
              <p>
                <strong>{plural(locale, t.summaryCount, boxes.length)}</strong>{' '}
                {plural(locale, t.pagesAffected, pagesWithBoxes.length)}
              </p>
            )}
            <div className="toolbar">
              {selectedId && (
                <button
                  type="button"
                  className="link-button"
                  disabled={working}
                  onClick={() => {
                    edited(boxes.filter((box) => box.id !== selectedId));
                    setSelectedId(undefined);
                  }}
                >
                  {t.removeBox}
                </button>
              )}
              {boxes.some((box) => box.page === page) && (
                <button
                  type="button"
                  className="link-button"
                  disabled={working}
                  onClick={() => {
                    edited(boxes.filter((box) => box.page !== page));
                    setSelectedId(undefined);
                  }}
                >
                  {t.clearPage}
                </button>
              )}
            </div>
            <section className="redact-explainer">
              <h2 className="panel__heading">{t.howItWorksHeading}</h2>
              <ul>
                {t.howItWorks.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
            <p className="warning">{t.checkNote}</p>
            {boxes.length === 0 && <p className="hint">{t.noBoxes}</p>}
            <button type="button" className="primary-button" onClick={run} disabled={boxes.length === 0 || working}>
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
