import { useState } from 'react';
import { plural } from '../../i18n';
import { JobError, runPdfJob } from '../../lib/pdf/client';
import { ToolError } from '../../lib/pdf/errors';
import type { RenderedPage, RepairResult } from '../../lib/pdf/ops/repair';
import { canvasToBlob, closePdf, openPdf, renderPage } from '../../lib/pdfjs';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

/** Resolution for pages we have to redraw: sharp enough to read and print, still reasonably small. */
const FALLBACK_DPI = 150;

function cannotRebuild(error: unknown): boolean {
  return error instanceof JobError && error.failure.kind === 'tool' && error.failure.code === 'cannot-rebuild';
}

/** Renders every page pdf.js can still read, for rebuilding the PDF from images. */
async function renderReadablePages(file: File, bytes: Uint8Array, onProgress: (fraction: number) => void) {
  let doc;
  try {
    doc = await openPdf(file.name, bytes);
  } catch {
    throw new ToolError('unrecoverable', { name: file.name });
  }
  const pages: RenderedPage[] = [];
  try {
    for (let number = 1; number <= doc.numPages; number++) {
      try {
        const page = await doc.getPage(number);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = await renderPage(page, { scale: FALLBACK_DPI / 72, pixelRatio: 1 });
        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.85);
        pages.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), width: viewport.width, height: viewport.height });
      } catch {
        // Skip pages pdf.js can't draw either.
      }
      onProgress((number / doc.numPages) * 0.8);
    }
  } finally {
    void closePdf(doc);
  }
  if (pages.length === 0) throw new ToolError('unrecoverable', { name: file.name });
  return pages;
}

export default function RepairTool({ locale, common, t }: ToolProps<'repair'>) {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<RepairResult>();
  const task = useTask(common.errors, t.errors);

  function startOver() {
    setFile(undefined);
    setResult(undefined);
    task.reset();
  }

  async function run() {
    if (!file) return;
    setResult(undefined);
    const name = outputName(file, t.outputSuffix);
    const output = await task.run(async (onProgress) => {
      const bytes = await readBytes(file);
      try {
        return await runPdfJob('repair', { mode: 'rebuild', input: { name: file.name, bytes }, outputName: name }, onProgress);
      } catch (error) {
        if (!cannotRebuild(error)) throw error;
      }
      const pages = await renderReadablePages(file, bytes, onProgress);
      return runPdfJob('repair', { mode: 'from-images', pages, outputName: name }, (fraction) =>
        onProgress(0.8 + fraction * 0.2),
      );
    });
    if (output) setResult(output);
  }

  if (!file) {
    return (
      <div className="tool">
        <FilePicker common={common} onFiles={([picked]) => setFile(picked)} />
        <p className="hint">{t.explanation}</p>
      </div>
    );
  }

  const working = task.working;

  return (
    <div className="tool">
      <SelectedFile file={file} common={common} locale={locale} onClear={startOver} disabled={working} />
      <p className="hint">{t.explanation}</p>

      <div className="tool__actions">
        <button type="button" className="primary-button" disabled={working} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />
      {result && (
        <ResultFiles files={[result.file]} common={common} locale={locale} onStartOver={startOver}>
          {result.method === 'rebuilt' ? (
            <p>{plural(locale, t.rebuilt, result.pages)}</p>
          ) : (
            <p className="warning">{plural(locale, t.fromImages, result.pages)}</p>
          )}
          {result.lostPages > 0 && <p className="warning">{plural(locale, t.lost, result.lostPages)}</p>}
          <p className="hint">{t.checkResult}</p>
        </ResultFiles>
      )}
    </div>
  );
}
