import { useEffect, useRef, useState } from 'react';
import { renderPage, type PDFDocumentProxy } from '../../lib/pdfjs';

const cache = new WeakMap<PDFDocumentProxy, Map<number, Promise<string>>>();

/** Renders (once per document and page) a thumbnail and returns an object URL for it. */
function thumbnailUrl(doc: PDFDocumentProxy, pageNumber: number, width: number): Promise<string> {
  let pages = cache.get(doc);
  if (!pages) {
    pages = new Map();
    cache.set(doc, pages);
  }
  let url = pages.get(pageNumber);
  if (!url) {
    url = (async () => {
      const page = await doc.getPage(pageNumber);
      const canvas = await renderPage(page, { width, pixelRatio: Math.min(window.devicePixelRatio || 1, 2) });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      return blob ? URL.createObjectURL(blob) : '';
    })();
    pages.set(pageNumber, url);
  }
  return url;
}

interface Props {
  doc: PDFDocumentProxy;
  /** 1-based, as pdf.js counts. */
  pageNumber: number;
  /** Extra clockwise rotation to show, in degrees. */
  rotation?: number;
  /** Rendered width in CSS pixels. */
  width?: number;
  alt: string;
}

/** A lazily rendered page image. Rotation is applied with CSS, so rotating doesn't re-render. */
export function PageThumbnail({ doc, pageNumber, rotation = 0, width = 160, alt }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    thumbnailUrl(doc, pageNumber, width).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, doc, pageNumber, width]);

  const quarterTurns = (((rotation / 90) % 4) + 4) % 4;
  return (
    <div ref={ref} className="thumbnail">
      {src ? (
        <img src={src} alt={alt} className={`thumbnail__image rotate-${quarterTurns * 90}`} draggable={false} />
      ) : (
        <div className="thumbnail__placeholder" aria-hidden="true" />
      )}
    </div>
  );
}
