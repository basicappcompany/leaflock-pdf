import { useEffect, useState } from 'react';
import { format, plural, type CommonMessages, type ToolMessages } from '../../i18n';
import { pageText, type PDFDocumentProxy } from '../../lib/pdfjs';
import { diffWords, summarize, type DiffPart, type DiffSummary } from '../../lib/secure/textDiff';
import { UsageLimitError, withClaim } from '../../lib/usage';
import { Segmented } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { PagePreview } from '../ui/PagePreview';
import { SelectedFile } from '../ui/SelectedFile';
import { usePdfDocument, type PdfDocumentState } from '../ui/usePdfDocument';
import { describeFailure } from '../ui/useTask';
import { TextDiffView } from './secure/TextDiffView';
import { VisualDiff } from './secure/VisualDiff';
import type { ToolProps } from './types';
import '../../styles/secure.css';

type Mode = 'text' | 'overlay' | 'sideBySide';

interface PageComparison {
  number: number;
  inOriginal: boolean;
  inChanged: boolean;
  parts: DiffPart[];
  summary: DiffSummary;
}

async function textOf(doc: PDFDocumentProxy, number: number): Promise<string> {
  return number <= doc.numPages ? pageText(await doc.getPage(number)) : '';
}

/**
 * Text diff of every page pair, computed once both documents are open.
 *
 * This tool has no run button, so the comparison starting is the run: the server's yes (src/lib/usage.ts) comes
 * first, and without it nothing is computed. `blocked` carries why, for the page to say.
 */
function useComparison(original: PDFDocumentProxy | undefined, changed: PDFDocumentProxy | undefined) {
  const [pages, setPages] = useState<PageComparison[]>();
  const [blocked, setBlocked] = useState<unknown>();
  useEffect(() => {
    setPages(undefined);
    setBlocked(undefined);
    if (!original || !changed) return;
    let cancelled = false;
    withClaim(async () => {
      const count = Math.max(original.numPages, changed.numPages);
      const result: PageComparison[] = [];
      for (let number = 1; number <= count; number++) {
        const [before, after] = await Promise.all([textOf(original, number), textOf(changed, number)]);
        if (cancelled) return;
        const parts = diffWords(before, after);
        result.push({
          number,
          inOriginal: number <= original.numPages,
          inChanged: number <= changed.numPages,
          parts,
          summary: summarize(parts),
        });
      }
      if (!cancelled) setPages(result);
    }).catch((error: unknown) => {
      if (!cancelled) setBlocked(error);
    });
    return () => {
      cancelled = true;
    };
  }, [original, changed]);
  return { pages, blocked };
}

export default function CompareTool({ locale, common, t }: ToolProps<'compare'>) {
  const [originalFile, setOriginalFile] = useState<File>();
  const [changedFile, setChangedFile] = useState<File>();
  const [mode, setMode] = useState<Mode>('text');
  const [current, setCurrent] = useState(1);
  const original = usePdfDocument(originalFile);
  const changed = usePdfDocument(changedFile);
  const originalDoc = original.state === 'ready' ? original.doc : undefined;
  const changedDoc = changed.state === 'ready' ? changed.doc : undefined;
  const { pages, blocked } = useComparison(originalDoc, changedDoc);

  useEffect(() => setCurrent(1), [originalDoc, changedDoc]);

  const totals = pages?.reduce(
    (sum, page) => ({ inserted: sum.inserted + page.summary.inserted, deleted: sum.deleted + page.summary.deleted }),
    { inserted: 0, deleted: 0 },
  );
  const page = pages?.[current - 1];

  return (
    <div className="tool">
      <div className="compare-slots">
        <Slot
          label={t.original}
          file={originalFile}
          state={original}
          common={common}
          locale={locale}
          onFile={setOriginalFile}
        />
        <Slot label={t.changed} file={changedFile} state={changed} common={common} locale={locale} onFile={setChangedFile} />
      </div>

      {originalDoc && changedDoc && !pages && !blocked && (
        <p className="muted" role="status">
          {t.analysing}
        </p>
      )}

      {blocked !== undefined && (
        <p className="notice" role="alert">
          {blocked instanceof UsageLimitError
            ? blocked.reason === 'anonymous'
              ? common.errors.dailyLimitAnonymous
              : common.errors.dailyLimitFree
            : common.errors.unexpected}
        </p>
      )}

      {originalDoc && changedDoc && pages && page && totals && (
        <div className="tool__workspace">
          <section className="compare-view" aria-live="polite">
            <Segmented
              label={t.modeLabel}
              value={mode}
              options={(['text', 'overlay', 'sideBySide'] as const).map((value) => ({ value, label: t.modes[value] }))}
              onChange={setMode}
            />
            <Pager current={current} count={pages.length} common={common} onChange={setCurrent} />
            {mode === 'text' &&
              (!page.inOriginal || !page.inChanged ? (
                <p className="notice">{page.inOriginal ? t.onlyInOriginal : t.onlyInChanged}</p>
              ) : (
                <TextDiffView parts={page.parts} t={t} />
              ))}
            {mode === 'overlay' && <VisualDiff original={originalDoc} changed={changedDoc} number={current} t={t} />}
            {mode === 'sideBySide' && (
              <div className="side-by-side">
                <SidePage doc={originalDoc} number={current} label={format(t.originalPage, { number: current })} t={t} />
                <SidePage doc={changedDoc} number={current} label={format(t.changedPage, { number: current })} t={t} />
              </div>
            )}
          </section>

          <aside className="panel">
            <h2 className="compare-summary__heading">{t.summaryHeading}</h2>
            <p className="hint">
              {totals.inserted + totals.deleted === 0
                ? t.identical
                : format(t.totalsJoin, {
                    added: plural(locale, t.added, totals.inserted),
                    removed: plural(locale, t.removed, totals.deleted),
                  })}
            </p>
            <ol className="compare-pages">
              {pages.map((item) => (
                <li key={item.number}>
                  <button
                    type="button"
                    className={item.number === current ? 'compare-pages__item is-current' : 'compare-pages__item'}
                    aria-current={item.number === current ? 'page' : undefined}
                    onClick={() => setCurrent(item.number)}
                  >
                    <span>{format(t.pageSummary, { number: item.number })}</span>
                    <PageBadge page={item} locale={locale} t={t} />
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}
    </div>
  );
}

function Slot({
  label,
  file,
  state,
  common,
  locale,
  onFile,
}: {
  label: string;
  file: File | undefined;
  state: PdfDocumentState;
  common: CommonMessages;
  locale: string;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <section className="compare-slot" aria-label={label}>
      <h2 className="compare-slot__label">{label}</h2>
      {file ? (
        <SelectedFile
          file={file}
          pageCount={state.state === 'ready' ? state.doc.numPages : undefined}
          common={common}
          locale={locale}
          onClear={() => onFile(undefined)}
        />
      ) : (
        <FilePicker common={common} onFiles={([picked]) => onFile(picked)} />
      )}
      {state.state === 'error' && (
        <p className="error" role="alert">
          {describeFailure(state.error, common.errors)}
        </p>
      )}
    </section>
  );
}

function PageBadge({ page, locale, t }: { page: PageComparison; locale: string; t: ToolMessages<'compare'> }) {
  if (!page.inOriginal) return <span className="diff-badge diff-badge--added">{t.onlyInChanged}</span>;
  if (!page.inChanged) return <span className="diff-badge diff-badge--removed">{t.onlyInOriginal}</span>;
  const count = page.summary.inserted + page.summary.deleted;
  if (count === 0) return <span className="muted">{t.noChanges}</span>;
  return <span className="diff-badge">{plural(locale, t.changes, count)}</span>;
}

function SidePage({ doc, number, label, t }: { doc: PDFDocumentProxy; number: number; label: string; t: ToolMessages<'compare'> }) {
  return (
    <figure className="side-by-side__page">
      <figcaption className="muted">{label}</figcaption>
      {number <= doc.numPages ? <PagePreview doc={doc} pageNumber={number} alt={label} /> : <p className="notice">{t.missingPage}</p>}
    </figure>
  );
}

function Pager({
  current,
  count,
  common,
  onChange,
}: {
  current: number;
  count: number;
  common: CommonMessages;
  onChange: (page: number) => void;
}) {
  return (
    <div className="pager">
      <button
        type="button"
        className="icon-button"
        aria-label={common.pages.previous}
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
      >
        ←
      </button>
      <span>{format(common.pages.of, { number: current, count })}</span>
      <button
        type="button"
        className="icon-button"
        aria-label={common.pages.next}
        disabled={current >= count}
        onClick={() => onChange(current + 1)}
      >
        →
      </button>
    </div>
  );
}
