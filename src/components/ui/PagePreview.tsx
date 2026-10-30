import { useEffect, useRef, useState, type ReactNode } from 'react';
import { renderPage, type PDFDocumentProxy } from '../../lib/pdfjs';

/** Page size in PDF points, as displayed (after the page's own rotation). */
export interface PageSize {
  width: number;
  height: number;
}

interface Props {
  doc: PDFDocumentProxy;
  /** 1-based. */
  pageNumber: number;
  alt: string;
  /** Called once the page's size is known, for converting overlay positions to PDF points. */
  onSize?: (size: PageSize) => void;
  /**
   * Overlay drawn on top of the page. Position children with percentages
   * (left/top/width/height as a share of the page), so they line up at any zoom.
   */
  children?: ReactNode;
}

/** One page rendered at the width of its container, with an optional overlay. */
export function PagePreview({ doc, pageNumber, alt, onSize, children }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [src, setSrc] = useState<string>();
  const [aspect, setAspect] = useState<number>();

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      // Re-render only on meaningful width changes.
      const next = Math.round((entry?.contentRect.width ?? 0) / 50) * 50;
      setWidth((current) => (next > 0 && next !== current ? next : current));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (width === 0) return;
    let cancelled = false;
    let url: string | undefined;
    (async () => {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      if (cancelled) return;
      setAspect(viewport.width / viewport.height);
      onSize?.({ width: viewport.width, height: viewport.height });
      const canvas = await renderPage(page, { width });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (cancelled || !blob) return;
      url = URL.createObjectURL(blob);
      setSrc(url);
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // onSize is deliberately left out: callers pass inline callbacks, and re-rendering on each would loop.
  }, [doc, pageNumber, width]);

  return (
    <div ref={frameRef} className="page-preview">
      <div className="page-preview__page" style={{ aspectRatio: aspect ?? 0.7071 }}>
        {src && <img src={src} alt={alt} className="page-preview__image" draggable={false} />}
        {children && <div className="page-preview__overlay">{children}</div>}
      </div>
    </div>
  );
}
