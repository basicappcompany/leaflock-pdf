import { useState } from 'react';
import { plural } from '../../i18n';
import { runPdfJob } from '../../lib/pdf/client';
import type { OutputFile } from '../../lib/pdf/types';
import '../../styles/convert.css';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import { ImageList, imageItem, toImageInputs, type ImageItem } from './convert/ImageList';
import { defaultLayout, PageLayoutOptions, type PageLayout } from './convert/PageLayoutOptions';
import type { ToolProps } from './types';

export default function ImagesToPdfTool({ locale, common, t }: ToolProps<'imagesToPdf'>) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [layout, setLayout] = useState<PageLayout>(defaultLayout);
  const [notices, setNotices] = useState<string[]>([]);
  const [result, setResult] = useState<OutputFile[]>();
  const task = useTask(common.errors, t.errors);

  function changeImages(next: ImageItem[]) {
    setImages(next);
    setResult(undefined);
    task.reset();
  }

  function changeLayout(next: PageLayout) {
    setLayout(next);
    setResult(undefined);
    task.reset();
  }

  async function convert() {
    const output = await task.run(async (onProgress) =>
      runPdfJob('imagesToPdf', { images: await toImageInputs(images), ...layout, outputName: t.outputName }, onProgress),
    );
    if (output) setResult(output);
  }

  const working = task.working;
  const count = plural(locale, t.imageCount, images.length);

  return (
    <div className="tool">
      <FilePicker
        common={common}
        kind="image"
        multiple
        compact={images.length > 0}
        onFiles={(files) => changeImages([...images, ...files.map((file) => imageItem(file.name, file))])}
        onSkipped={setNotices}
      />
      {notices.map((notice) => (
        <p key={notice} className="notice" role="status">
          {notice}
        </p>
      ))}

      {images.length > 0 && (
        <>
          <section aria-label={count}>
            <div className="list-header">
              <span>
                {count} · {t.instructions}
              </span>
              <button type="button" className="link-button" onClick={() => changeImages([])} disabled={working}>
                {common.files.clear}
              </button>
            </div>
            <ImageList items={images} common={common} onChange={changeImages} disabled={working} />
          </section>

          <PageLayoutOptions value={layout} onChange={changeLayout} labels={t} disabled={working} />

          <div className="tool__actions">
            <button type="button" className="primary-button" disabled={working} onClick={convert}>
              {working ? common.actions.working : t.action}
            </button>
          </div>
        </>
      )}

      <TaskStatusView status={task.status} common={common} />
      {result && <ResultFiles files={result} common={common} locale={locale} onStartOver={() => changeImages([])} />}
    </div>
  );
}
