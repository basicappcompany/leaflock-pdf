import { format, type CommonMessages } from '../../../i18n';

/** Previous / next page buttons with "Page n of N". `page` is 0-based. */
export function Pager({
  page,
  pageCount,
  onChange,
  common,
  disabled,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  common: CommonMessages;
  disabled?: boolean | undefined;
}) {
  if (pageCount < 2) return null;
  return (
    <div className="pager">
      <button
        type="button"
        className="icon-button"
        aria-label={common.pages.previous}
        disabled={disabled || page === 0}
        onClick={() => onChange(page - 1)}
      >
        ←
      </button>
      <span aria-live="polite">{format(common.pages.of, { number: page + 1, count: pageCount })}</span>
      <button
        type="button"
        className="icon-button"
        aria-label={common.pages.next}
        disabled={disabled || page === pageCount - 1}
        onClick={() => onChange(page + 1)}
      >
        →
      </button>
    </div>
  );
}
