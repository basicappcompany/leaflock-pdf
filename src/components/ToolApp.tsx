import { lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from 'react';
import type { CommonMessages, ToolMessages } from '../i18n';
import type { ToolId } from '../tools/registry';
import { installErrorReporting } from '../lib/errorReporting';
import { warmPdfWorker } from '../lib/pdf/client';
import { requiresUpgrade, type ToolTier } from '../lib/proAccess';
import { setActiveTool } from '../lib/recentActivity';
import { ProGate } from './ui/ProGate';
import { RecentWork } from './ui/RecentWork';
import { useSession } from './ui/useSession';
import type { ToolProps } from './tools/types';

type Loaders = { [K in ToolId]: () => Promise<{ default: ComponentType<ToolProps<K>> }> };

/** Each tool's UI is its own chunk, so a tool page only downloads that tool's code. */
const loaders: Loaders = {
  merge: () => import('./tools/MergeTool'),
  split: () => import('./tools/SplitTool'),
  removePages: () => import('./tools/RemovePagesTool'),
  extractPages: () => import('./tools/ExtractPagesTool'),
  organize: () => import('./tools/OrganizeTool'),
  rotate: () => import('./tools/RotateTool'),
  crop: () => import('./tools/CropTool'),
  mixPages: () => import('./tools/MixPagesTool'),
  nUp: () => import('./tools/NUpTool'),
  booklet: () => import('./tools/BookletTool'),
  wordToPdf: () => import('./tools/WordToPdfTool'),
  excelToPdf: () => import('./tools/ExcelToPdfTool'),
  csvToPdf: () => import('./tools/CsvToPdfTool'),
  rtfToPdf: () => import('./tools/RtfToPdfTool'),
  imagesToPdf: () => import('./tools/ImagesToPdfTool'),
  pdfToImages: () => import('./tools/PdfToImagesTool'),
  pdfToText: () => import('./tools/PdfToTextTool'),
  extractImages: () => import('./tools/ExtractImagesTool'),
  pdfToMarkdown: () => import('./tools/PdfToMarkdownTool'),
  pdfToWord: () => import('./tools/PdfToWordTool'),
  pdfToExcel: () => import('./tools/PdfToExcelTool'),
  extractTables: () => import('./tools/ExtractTablesTool'),
  ocr: () => import('./tools/OcrTool'),
  scan: () => import('./tools/ScanTool'),
  pageNumbers: () => import('./tools/PageNumbersTool'),
  pageLabels: () => import('./tools/PageLabelsTool'),
  batesNumber: () => import('./tools/BatesNumberTool'),
  watermark: () => import('./tools/WatermarkTool'),
  sign: () => import('./tools/SignTool'),
  edit: () => import('./tools/EditTool'),
  fillForm: () => import('./tools/FillFormTool'),
  editMetadata: () => import('./tools/EditMetadataTool'),
  redact: () => import('./tools/RedactTool'),
  protect: () => import('./tools/ProtectTool'),
  unlock: () => import('./tools/UnlockTool'),
  compress: () => import('./tools/CompressTool'),
  repair: () => import('./tools/RepairTool'),
  flatten: () => import('./tools/FlattenTool'),
  removeMetadata: () => import('./tools/RemoveMetadataTool'),
  removeAnnotations: () => import('./tools/RemoveAnnotationsTool'),
  pdfToPdfA: () => import('./tools/PdfToPdfATool'),
  compare: () => import('./tools/CompareTool'),
  batch: () => import('./tools/BatchTool'),
};

type AnyTool = ComponentType<ToolProps<ToolId>>;

const components = new Map<ToolId, LazyExoticComponent<AnyTool>>();

/** The lazy component for a tool, created once so React keeps its state between renders. */
function componentFor(id: ToolId): LazyExoticComponent<AnyTool> {
  let component = components.get(id);
  if (!component) {
    component = lazy(loaders[id] as unknown as () => Promise<{ default: AnyTool }>);
    components.set(id, component);
  }
  return component;
}

interface Props {
  toolId: ToolId;
  /** From the registry, so the gate below knows whether this tool is a paid one. */
  tier: ToolTier;
  locale: string;
  common: CommonMessages;
  t: ToolMessages<ToolId>;
  preset?: Readonly<Record<string, string>> | undefined;
}

/** Client-side entry point for every tool page. */
export default function ToolApp({ toolId, tier, locale, common, t, preset }: Props) {
  const Tool = componentFor(toolId);
  const session = useSession();
  useEffect(() => {
    installErrorReporting(toolId);
    setActiveTool(toolId);
  }, [toolId]);

  // Someone on a tool page intends to use it, so the worker is started while the browser
  // is idle rather than on the first click. Idle, not immediate, so it never competes
  // with rendering the tool itself.
  useEffect(() => {
    const idle = window.requestIdleCallback?.bind(window);
    if (!idle) {
      const timer = window.setTimeout(warmPdfWorker, 1_200);
      return () => window.clearTimeout(timer);
    }
    const handle = idle(() => warmPdfWorker(), { timeout: 3_000 });
    return () => window.cancelIdleCallback?.(handle);
  }, []);

  // Wait for the plan before deciding: showing a paying customer an upgrade screen for
  // a moment would be worse than a brief wait. Signed-out visitors resolve immediately.
  if (tier !== 'free' && session.state === 'loading') {
    return <p className="muted">{common.toolPage.loading}</p>;
  }

  const plan = session.state === 'in' ? session.plan : 'anonymous';
  if (tier !== 'free' && requiresUpgrade(tier, plan)) {
    return <ProGate common={common} signedIn={session.state === 'in'} tier={tier} />;
  }

  return (
    <>
      <Suspense fallback={<p className="muted">{common.toolPage.loading}</p>}>
        <Tool locale={locale} common={common} t={t} preset={preset} />
      </Suspense>
      {/* Below the tool, not above it: someone arriving to do a job should see the file
          picker first, and the shelf renders nothing at all unless they kept something. */}
      <RecentWork common={common} locale={locale} />
    </>
  );
}
