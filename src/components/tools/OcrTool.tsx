import { useEffect, useId, useState } from 'react';
import { format, plural } from '../../i18n';
import { recognize, stopOcr } from '../../lib/ocr';
import { runPdfJob } from '../../lib/pdf/client';
import { ToolError } from '../../lib/pdf/errors';
import { PdfInputError } from '../../lib/pdf/inputError';
import type { OcrPage } from '../../lib/pdf/ops/addTextLayer';
import { baseName, type OutputFile } from '../../lib/pdf/types';
import { closePdf, openPdf, pageText, renderPage, type PDFDocumentProxy } from '../../lib/pdfjs';
import '../../styles/convert.css';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { usePdfDocument } from '../ui/usePdfDocument';
import { describeFailure, useTask } from '../ui/useTask';
import { CopyButton } from './convert/CopyButton';
import { ImageList, imageItem, toImageInputs, type ImageItem } from './convert/ImageList';
import type { ToolProps } from './types';

/** Tesseract reads best at about 300 dpi. */
const OCR_SCALE = 300 / 72;
/** Keeps canvases within browser limits and recognition time reasonable. */
const MAX_PIXELS = 16_000_000;
const MAX_SIDE = 5000;

/** Share of the progress bar spent loading the model, and building the PDF at the end. */
const MODEL_SHARE = 0.05;
const BUILD_SHARE = 0.05;

export default function OcrTool({ locale, common, t }: ToolProps<'ocr'>) {
  const [mode, setMode] = useState<'pdf' | 'images'>('pdf');
  const [file, setFile] = useState<File>();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [hasText, setHasText] = useState(false);
  const [stage, setStage] = useState<string>();
  const [result, setResult] = useState<{ files: OutputFile[] | undefined; text: string }>();
  const pdf = usePdfDocument(mode === 'pdf' ? file : undefined);
  const task = useTask(common.errors, t.errors);
  const textId = useId();

  // Free the OCR engine's memory when leaving the tool.
  useEffect(() => () => void stopOcr(), []);

  // Warn when the PDF already has real text: OCR is for scans.
  const doc = pdf.state === 'ready' ? pdf.doc : undefined;
  useEffect(() => {
    setHasText(false);
    if (!doc) return;
    let cancelled = false;
    (async () => {
      for (let number = 1; number <= Math.min(doc.numPages, 3); number++) {
        const text = await pageText(await doc.getPage(number));
        if (text.replace(/\s/g, '').length > 20) {
          if (!cancelled) setHasText(true);
          return;
        }
      }
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [doc]);

  function startOver() {
    setFile(undefined);
    setImages([]);
    setResult(undefined);
    task.reset();
  }

  function switchMode(next: 'pdf' | 'images') {
    startOver();
    setNotices([]);
    setMode(next);
  }

  async function run() {
    const output = await task.run(async (onProgress) => {
      let source: { name: string; bytes: Uint8Array<ArrayBuffer>; doc: PDFDocumentProxy; owned: boolean };
      if (mode === 'pdf') {
        if (pdf.state !== 'ready' || !file) throw new Error('No PDF loaded');
        source = { name: file.name, bytes: pdf.bytes, doc: pdf.doc, owned: false };
      } else {
        setStage(t.stages.preparing);
        const [built] = await runPdfJob('imagesToPdf', {
          images: await toImageInputs(images),
          pageSize: 'fit',
          orientation: 'auto',
          margin: 'none',
          outputName: t.imagesOutputName,
        });
        source = {
          name: t.imagesOutputName,
          bytes: built!.bytes,
          doc: await openPdf(t.imagesOutputName, built!.bytes),
          owned: true,
        };
      }

      try {
        const count = source.doc.numPages;
        const pages: OcrPage[] = [];
        const texts: string[] = [];
        for (let number = 1; number <= count; number++) {
          const page = await source.doc.getPage(number);
          const { width, height } = page.getViewport({ scale: 1 });
          const scale = Math.min(OCR_SCALE, Math.sqrt(MAX_PIXELS / (width * height)), MAX_SIDE / Math.max(width, height));
          const canvas = await renderPage(page, { scale, pixelRatio: 1, background: 'white' });
          page.cleanup();

          const pageStart = MODEL_SHARE + ((number - 1) / count) * (1 - MODEL_SHARE - BUILD_SHARE);
          const pageShare = (1 - MODEL_SHARE - BUILD_SHARE) / count;
          let recognized;
          try {
            recognized = await recognize(canvas, (step, fraction) => {
              if (step === 'model') {
                setStage(t.stages.model);
                onProgress(fraction * MODEL_SHARE);
              } else {
                setStage(format(t.stages.recognizing, { number, count }));
                onProgress(pageStart + fraction * pageShare);
              }
            });
          } catch (error) {
            if (error instanceof PdfInputError) throw error;
            console.error(error);
            throw new ToolError('ocrUnavailable');
          }
          pages.push({ pageIndex: number - 1, imageWidth: canvas.width, imageHeight: canvas.height, words: recognized.words });
          texts.push(recognized.text.trim());
          canvas.width = 0;
          canvas.height = 0;
        }

        const text = texts.filter(Boolean).join('\n\n');
        if (!pages.some((page) => page.words.length > 0)) return { files: undefined, text: '' };

        setStage(t.stages.building);
        const outputName = mode === 'pdf' ? `${baseName(source.name)}-${t.outputSuffix}.pdf` : t.imagesOutputName;
        const files = await runPdfJob('addTextLayer', { input: { name: source.name, bytes: source.bytes }, pages, outputName });
        onProgress(1);
        return { files, text };
      } finally {
        if (source.owned) void closePdf(source.doc);
      }
    });
    setStage(undefined);
    if (output) setResult(output);
  }

  const working = task.working;
  const ready = mode === 'pdf' ? pdf.state === 'ready' : images.length > 0;
  const imageCount = plural(locale, t.imageCount, images.length);

  return (
    <div className="tool">
      <p className="notice">{t.englishOnly}</p>

      {mode === 'pdf' && !file && (
        <>
          <FilePicker common={common} onFiles={([picked]) => setFile(picked)} />
          <p className="hint">
            {t.imagesInstead}{' '}
            <button type="button" className="link-button" onClick={() => switchMode('images')}>
              {t.chooseImages}
            </button>
          </p>
        </>
      )}

      {mode === 'pdf' && file && (
        <>
          <SelectedFile
            file={file}
            pageCount={doc?.numPages}
            common={common}
            locale={locale}
            disabled={working}
            onClear={startOver}
          />
          {pdf.state === 'error' && (
            <p className="error" role="alert">
              {describeFailure(pdf.error, common.errors)}
            </p>
          )}
          {hasText && <p className="warning">{t.alreadyHasText}</p>}
        </>
      )}

      {mode === 'images' && (
        <>
          <FilePicker
            common={common}
            kind="image"
            multiple
            compact={images.length > 0}
            onFiles={(files) => {
              setImages([...images, ...files.map((picked) => imageItem(picked.name, picked))]);
              setResult(undefined);
              task.reset();
            }}
            onSkipped={setNotices}
          />
          {notices.map((notice) => (
            <p key={notice} className="notice" role="status">
              {notice}
            </p>
          ))}
          {images.length > 0 && (
            <section aria-label={imageCount}>
              <div className="list-header">
                <span>{imageCount}</span>
              </div>
              <ImageList
                items={images}
                common={common}
                onChange={(next) => {
                  setImages(next);
                  setResult(undefined);
                  task.reset();
                }}
                disabled={working}
              />
            </section>
          )}
          <p className="hint">
            <button type="button" className="link-button" onClick={() => switchMode('pdf')} disabled={working}>
              {t.backToPdf}
            </button>
          </p>
        </>
      )}

      {ready && !result && (
        <div className="tool__actions">
          <button type="button" className="primary-button" disabled={working} onClick={run}>
            {working ? common.actions.working : t.action}
          </button>
        </div>
      )}

      {working && stage && <p className="convert-stage">{stage}</p>}
      <TaskStatusView status={task.status} common={common} />

      {result && !result.files && (
        <p className="warning" role="status">
          {t.noTextFound}
        </p>
      )}
      {result?.files && (
        <>
          <ResultFiles files={result.files} common={common} locale={locale} onStartOver={startOver} />
          <div className="convert-text-header">
            <label htmlFor={textId}>{t.resultTextLabel}</label>
            <CopyButton text={result.text} labels={t} />
          </div>
          <textarea id={textId} className="convert-text" readOnly value={result.text} spellCheck={false} />
        </>
      )}
    </div>
  );
}
