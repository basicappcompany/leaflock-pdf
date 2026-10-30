import { useEffect, useState } from 'react';
import { format, type ToolMessages } from '../../../i18n';
import { diffPixels, type Rgba } from '../../../lib/secure/imageDiff';
import { renderPage, type PDFDocumentProxy } from '../../../lib/pdfjs';

/** Width both pages are rendered at for comparing; enough to catch small text changes. */
const RENDER_WIDTH = 1000;
/** Magenta: stands out against black text, white paper and most brand colours, in both themes. */
const HIGHLIGHT: [number, number, number] = [214, 0, 120];

async function pixels(doc: PDFDocumentProxy, number: number): Promise<Rgba | undefined> {
  if (number > doc.numPages) return undefined;
  const page = await doc.getPage(number);
  const canvas = await renderPage(page, { width: RENDER_WIDTH, pixelRatio: 1 });
  const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
  return { data, width: canvas.width, height: canvas.height };
}

/** The original page, faded, with every pixel that differs in the changed version highlighted. */
export function VisualDiff({
  original,
  changed,
  number,
  t,
}: {
  original: PDFDocumentProxy;
  changed: PDFDocumentProxy;
  number: number;
  t: ToolMessages<'compare'>;
}) {
  const [view, setView] = useState<{ url: string; share: number; missing: boolean }>();

  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;
    setView(undefined);
    (async () => {
      const [before, after] = await Promise.all([pixels(original, number), pixels(changed, number)]);
      if (cancelled) return;
      // A page missing from one version is compared against a blank page of the same size.
      const diff = diffPixels(before ?? blankLike(after!), after ?? blankLike(before!), HIGHLIGHT);
      const canvas = document.createElement('canvas');
      canvas.width = diff.width;
      canvas.height = diff.height;
      canvas.getContext('2d')!.putImageData(new ImageData(diff.overlay as Uint8ClampedArray<ArrayBuffer>, diff.width, diff.height), 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (cancelled || !blob) return;
      url = URL.createObjectURL(blob);
      setView({ url, share: diff.changed, missing: !before || !after });
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [original, changed, number]);

  if (!view) return <p className="muted">{t.analysing}</p>;
  const percent = view.share * 100;
  return (
    <figure className="visual-diff">
      <figcaption className="visual-diff__caption">
        {view.missing
          ? t.missingPage
          : view.share === 0
            ? t.visualSame
            : format(t.visualChanged, { percent: percent < 0.1 ? '<0.1' : percent.toFixed(1) })}{' '}
        <span className="muted">{t.overlayHint}</span>
      </figcaption>
      <img src={view.url} alt={format(t.overlayAlt, { number })} className="visual-diff__image" />
    </figure>
  );
}

/** A white image the size of `like`. */
function blankLike(like: Rgba): Rgba {
  return { data: new Uint8ClampedArray(like.width * like.height * 4).fill(255), width: like.width, height: like.height };
}
