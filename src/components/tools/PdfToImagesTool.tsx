import { useState } from 'react';
import { format } from '../../i18n';
import { parsePageRanges } from '../../lib/pageRanges';
import { baseName, type OutputFile } from '../../lib/pdf/types';
import { canvasToBlob, renderPage } from '../../lib/pdfjs';
import '../../styles/convert.css';
import { FilePicker } from '../ui/FilePicker';
import { Options, Segmented } from '../ui/fields';
import { PageRangeField } from '../ui/PageRangeField';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { usePdfDocument } from '../ui/usePdfDocument';
import { describeFailure, useTask } from '../ui/useTask';
import type { ToolProps } from './types';

type ImageFormat = 'jpg' | 'png';
type Resolution = 'screen' | 'standard' | 'print';

const dpi: Record<Resolution, number> = { screen: 72, standard: 150, print: 300 };

/** Browsers (Safari especially) refuse canvases above about 16.7 million pixels. */
const MAX_PIXELS = 16_000_000;

export default function PdfToImagesTool({ locale, common, t, preset }: ToolProps<'pdfToImages'>) {
  const [file, setFile] = useState<File>();
  const [imageFormat, setImageFormat] = useState<ImageFormat>(preset?.['format'] === 'png' ? 'png' : 'jpg');
  const [resolution, setResolution] = useState<Resolution>('standard');
  const [pagesMode, setPagesMode] = useState<'all' | 'custom'>('all');
  const [range, setRange] = useState('');
  const [stage, setStage] = useState<string>();
  const [result, setResult] = useState<OutputFile[]>();
  const pdf = usePdfDocument(file);
  const task = useTask(common.errors, t.errors);

  function changed() {
    setResult(undefined);
    task.reset();
  }

  if (!file) {
    return (
      <div className="tool">
        <FilePicker common={common} onFiles={([picked]) => setFile(picked)} />
      </div>
    );
  }

  const pageCount = pdf.state === 'ready' ? pdf.doc.numPages : undefined;
  const pages =
    pageCount === undefined
      ? null
      : pagesMode === 'all'
        ? Array.from({ length: pageCount }, (_, index) => index)
        : parsePageRanges(range, pageCount);
  const working = task.working;

  async function convert() {
    if (pdf.state !== 'ready' || !pages || !file) return;
    const { doc } = pdf;
    const type = imageFormat === 'jpg' ? 'image/jpeg' : 'image/png';
    const stem = baseName(file.name);
    const output = await task.run(async (onProgress) => {
      const files: OutputFile[] = [];
      for (const [position, index] of pages.entries()) {
        setStage(format(t.rendering, { number: position + 1, count: pages.length }));
        const page = await doc.getPage(index + 1);
        const { width, height } = page.getViewport({ scale: 1 });
        let scale = dpi[resolution] / 72;
        scale = Math.min(scale, Math.sqrt(MAX_PIXELS / (width * height)));
        const canvas = await renderPage(page, { scale, pixelRatio: 1, background: 'white' });
        const blob = await canvasToBlob(canvas, type, imageFormat === 'jpg' ? 0.92 : undefined);
        // Free the pixels straight away; big documents would otherwise pile up in memory.
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
        files.push({ name: `${stem}-page-${index + 1}.${imageFormat}`, bytes: new Uint8Array(await blob.arrayBuffer()), type });
        onProgress((position + 1) / pages.length);
      }
      return files;
    });
    setStage(undefined);
    if (output) setResult(output);
  }

  return (
    <div className="tool">
      <SelectedFile
        file={file}
        pageCount={pageCount}
        common={common}
        locale={locale}
        disabled={working}
        onClear={() => {
          setFile(undefined);
          setRange('');
          changed();
        }}
      />
      {pdf.state === 'error' && (
        <p className="error" role="alert">
          {describeFailure(pdf.error, common.errors)}
        </p>
      )}

      {pageCount !== undefined && (
        <>
          <Options>
            <div className="field">
              <Segmented
                label={t.formatLabel}
                value={imageFormat}
                options={(['jpg', 'png'] as const).map((value) => ({ value, label: t.formats[value] }))}
                onChange={(value) => {
                  setImageFormat(value);
                  changed();
                }}
                disabled={working}
              />
              <span className="field__hint">{t.formatHints[imageFormat]}</span>
            </div>
            <Segmented
              label={t.resolutionLabel}
              value={resolution}
              options={(['screen', 'standard', 'print'] as const).map((value) => ({ value, label: t.resolutions[value] }))}
              onChange={(value) => {
                setResolution(value);
                changed();
              }}
              disabled={working}
            />
            <Segmented
              label={t.pagesLabel}
              value={pagesMode}
              options={(['all', 'custom'] as const).map((value) => ({ value, label: t.pagesMode[value] }))}
              onChange={(value) => {
                setPagesMode(value);
                changed();
              }}
              disabled={working}
            />
            {pagesMode === 'custom' && (
              <PageRangeField
                value={range}
                onChange={(value) => {
                  setRange(value);
                  changed();
                }}
                pageCount={pageCount}
                common={common}
                disabled={working}
              />
            )}
          </Options>

          <div className="tool__actions">
            <button type="button" className="primary-button" disabled={working || !pages?.length} onClick={convert}>
              {working ? common.actions.working : t.action}
            </button>
          </div>
        </>
      )}

      {working && stage && <p className="convert-stage">{stage}</p>}
      <TaskStatusView status={task.status} common={common} />
      {result && (
        <ResultFiles
          files={result}
          common={common}
          locale={locale}
          onStartOver={() => {
            setFile(undefined);
            setRange('');
            changed();
          }}
        />
      )}
    </div>
  );
}
