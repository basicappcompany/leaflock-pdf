import { plural, type CommonMessages } from '../../i18n';
import { formatBytes } from './formatBytes';

/** The picked file's name and size, with a way to pick a different one. */
export function SelectedFile({
  file,
  pageCount,
  common,
  locale,
  onClear,
  disabled,
}: {
  file: File;
  pageCount?: number | undefined;
  common: CommonMessages;
  locale: string;
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="selected-file">
      <span className="selected-file__name">{file.name}</span>
      <span className="muted">
        {formatBytes(file.size, locale)}
        {pageCount !== undefined && <> · {plural(locale, common.pages.count, pageCount)}</>}
      </span>
      <button type="button" className="link-button" onClick={onClear} disabled={disabled}>
        {common.picker.replace}
      </button>
    </div>
  );
}
