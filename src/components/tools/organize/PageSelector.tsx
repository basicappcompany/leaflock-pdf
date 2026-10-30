import { useMemo, useState } from 'react';
import { plural, type CommonMessages } from '../../../i18n';
import { formatPageRanges, parsePageRanges } from '../../../lib/pageRanges';
import type { PDFDocumentProxy } from '../../../lib/pdfjs';
import { PageGrid } from '../../ui/PageGrid';
import { PageRangeField } from '../../ui/PageRangeField';

interface Props {
  doc: PDFDocumentProxy;
  common: CommonMessages;
  locale: string;
  /** 0-based selected pages. */
  selected: ReadonlySet<number>;
  onChange: (selected: Set<number>) => void;
  rangeLabel: string;
  instructions: string;
  /** Show selected pages greyed out (for "remove") rather than highlighted. */
  selectedMeansRemoved?: boolean;
  disabled?: boolean;
}

/** Choose pages by clicking thumbnails or typing ranges; the two stay in sync. */
export function PageSelector({
  doc,
  common,
  locale,
  selected,
  onChange,
  rangeLabel,
  instructions,
  selectedMeansRemoved = false,
  disabled = false,
}: Props) {
  const pageCount = doc.numPages;
  const [text, setText] = useState(() => formatPageRanges([...selected].sort((a, b) => a - b)));

  function select(next: Set<number>) {
    onChange(next);
    setText(formatPageRanges([...next].sort((a, b) => a - b)));
  }

  function typed(value: string) {
    setText(value);
    const parsed = value.trim() === '' ? [] : parsePageRanges(value, pageCount);
    if (parsed) onChange(new Set(parsed));
  }

  const pages = useMemo(
    () =>
      Array.from({ length: pageCount }, (_, index) => ({
        key: String(index),
        doc,
        index,
        selected: !selectedMeansRemoved && selected.has(index),
        dimmed: selectedMeansRemoved && selected.has(index),
      })),
    [doc, pageCount, selected, selectedMeansRemoved],
  );

  return (
    <div className="page-selector">
      <div className="page-selector__bar">
        <PageRangeField value={text} onChange={typed} pageCount={pageCount} common={common} label={rangeLabel} disabled={disabled} />
        <div className="toolbar">
          <button
            type="button"
            className="secondary-button"
            disabled={disabled}
            onClick={() => select(new Set(Array.from({ length: pageCount }, (_, index) => index)))}
          >
            {common.pages.selectAll}
          </button>
          <button type="button" className="secondary-button" disabled={disabled} onClick={() => select(new Set())}>
            {common.pages.selectNone}
          </button>
        </div>
      </div>
      <p className="muted" role="status">
        {instructions} {plural(locale, common.pages.selected, selected.size)}
      </p>
      <PageGrid
        pages={pages}
        common={common}
        onToggle={(page) => {
          if (disabled) return;
          const next = new Set(selected);
          if (next.has(page.index)) next.delete(page.index);
          else next.add(page.index);
          select(next);
        }}
      />
    </div>
  );
}
