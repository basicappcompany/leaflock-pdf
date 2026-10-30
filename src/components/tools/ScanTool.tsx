import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { format, plural } from '../../i18n';
import { runPdfJob } from '../../lib/pdf/client';
import type { OutputFile } from '../../lib/pdf/types';
import '../../styles/convert.css';
import { ResultFiles } from '../ui/ResultFiles';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import { ImageList, imageItem, toImageInputs, type ImageItem } from './convert/ImageList';
import { defaultLayout, PageLayoutOptions, type PageLayout } from './convert/PageLayoutOptions';
import type { ToolProps } from './types';

type CameraState = 'off' | 'starting' | 'on' | 'denied' | 'none' | 'failed';

export default function ScanTool({ locale, common, t }: ToolProps<'scan'>) {
  const [camera, setCamera] = useState<CameraState>('off');
  const [pages, setPages] = useState<ImageItem[]>([]);
  const [retakeId, setRetakeId] = useState<string>();
  const [capturing, setCapturing] = useState(false);
  const [layout, setLayout] = useState<PageLayout>(defaultLayout);
  const [result, setResult] = useState<OutputFile[]>();
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputId = useId();
  const task = useTask(common.errors, t.errors);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCamera((state) => (state === 'on' || state === 'starting' ? 'off' : state));
    setRetakeId(undefined);
  }, []);

  // Never leave the camera running after the tool is gone.
  useEffect(() => stopCamera, [stopCamera]);

  // Attach the stream once the <video> is on screen.
  useEffect(() => {
    if (camera === 'on' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [camera]);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('none');
      return;
    }
    setCamera('starting');
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: false,
        // Prefer the back camera on phones, at the best resolution it offers.
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 3840 }, height: { ideal: 2160 } },
      });
      setCamera('on');
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      setCamera(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' ? 'none' : 'failed');
    }
  }

  function changePages(next: ImageItem[]) {
    setPages(next);
    setResult(undefined);
    task.reset();
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    // Encoding a large frame takes a moment; Save stays disabled until it's in the list,
    // otherwise the late capture would reset the tool and cancel the save.
    setCapturing(true);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92)).finally(() =>
      setCapturing(false),
    );
    if (!blob) return;
    if (retakeId) {
      changePages(pages.map((page) => (page.id === retakeId ? { ...imageItem(page.name, blob) } : page)));
      setRetakeId(undefined);
    } else {
      changePages([...pages, imageItem(`page-${pages.length + 1}.jpg`, blob)]);
    }
  }

  async function save() {
    const output = await task.run(async (onProgress) =>
      runPdfJob('imagesToPdf', { images: await toImageInputs(pages), ...layout, outputName: t.outputName }, onProgress),
    );
    if (output) {
      setResult(output);
      stopCamera();
    }
  }

  const working = task.working;
  const retakeNumber = retakeId ? pages.findIndex((page) => page.id === retakeId) + 1 : 0;
  const cameraMessage = { denied: t.denied, none: t.noCamera, failed: t.cameraFailed }[camera as 'denied' | 'none' | 'failed'];

  return (
    <div className="tool">
      <div className="toolbar">
        {camera !== 'on' && (
          <button type="button" className="primary-button" onClick={startCamera} disabled={camera === 'starting' || working}>
            {camera === 'starting' ? t.starting : t.startCamera}
          </button>
        )}
        <label htmlFor={inputId} className="secondary-button">
          {t.photosInstead}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="visually-hidden"
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []).filter((file) => file.type.startsWith('image/'));
            event.currentTarget.value = '';
            if (files.length > 0) changePages([...pages, ...files.map((file) => imageItem(file.name, file))]);
          }}
        />
      </div>
      {cameraMessage && (
        <p className="warning" role="status">
          {cameraMessage}
        </p>
      )}

      {camera === 'on' && (
        <div>
          <div className="convert-camera">
            <video ref={videoRef} autoPlay playsInline muted aria-label={t.previewLabel} />
          </div>
          <div className="convert-camera__bar">
            <button type="button" className="primary-button" onClick={capture} disabled={working || capturing}>
              {retakeNumber ? format(t.replace, { number: retakeNumber }) : t.capture}
            </button>
            {retakeNumber > 0 && (
              <button type="button" className="link-button" onClick={() => setRetakeId(undefined)}>
                {t.cancelRetake}
              </button>
            )}
            <button type="button" className="secondary-button" onClick={stopCamera}>
              {t.stopCamera}
            </button>
          </div>
          <p className="hint">{retakeNumber ? format(t.retaking, { number: retakeNumber }) : t.tip}</p>
        </div>
      )}

      {pages.length > 0 && (
        <>
          <section aria-label={plural(locale, common.pages.count, pages.length)}>
            <div className="list-header">
              <span>{plural(locale, common.pages.count, pages.length)}</span>
              <button type="button" className="link-button" onClick={() => changePages([])} disabled={working}>
                {common.files.clear}
              </button>
            </div>
            <ImageList
              items={pages}
              common={common}
              onChange={changePages}
              disabled={working}
              label={(_, position) => format(common.pages.page, { number: position + 1 })}
              extra={(item, position) =>
                camera === 'on' && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={format(t.retake, { number: position + 1 })}
                    aria-pressed={retakeId === item.id}
                    onClick={() => setRetakeId(retakeId === item.id ? undefined : item.id)}
                  >
                    ↺
                  </button>
                )
              }
            />
          </section>

          <PageLayoutOptions
            value={layout}
            onChange={(next) => {
              setLayout(next);
              setResult(undefined);
              task.reset();
            }}
            labels={{ pageSizeLabel: t.pageSizeLabel, pageSizes: t.pageSizes, marginLabel: t.marginLabel, margins: t.margins }}
            disabled={working}
          />

          <div className="tool__actions">
            <button type="button" className="primary-button" disabled={working || capturing} onClick={save}>
              {working ? common.actions.working : t.action}
            </button>
          </div>
        </>
      )}
      {pages.length === 0 && camera === 'on' && <p className="hint">{t.needPage}</p>}

      <TaskStatusView status={task.status} common={common} />
      {result && (
        <ResultFiles
          files={result}
          common={common}
          locale={locale}
          onStartOver={() => {
            changePages([]);
          }}
        />
      )}
    </div>
  );
}
