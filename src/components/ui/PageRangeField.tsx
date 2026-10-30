import { format, type CommonMessages } from '../../i18n';
import { parsePageRanges } from '../../lib/pageRanges';
import { Field } from './fields';

/**
 * A text box for "which pages" (e.g. "1-3, 5"). Shows an error while the text is invalid;
 * use `parsePageRanges(value, pageCount)` to read it (null = invalid).
 */
export function PageRangeField({
  value,
  onChange,
  pageCount,
  common,
  label,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  pageCount: number;
  common: CommonMessages;
  label?: string;
  disabled?: boolean;
}) {
  const invalid = value.trim() !== '' && parsePageRanges(value, pageCount) === null;
  return (
    <Field
      label={label ?? common.pages.rangeLabel}
      hint={common.pages.rangeHint}
      error={invalid ? format(common.pages.rangeInvalid, { count: pageCount }) : undefined}
    >
      {(id, describedBy) => (
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      )}
    </Field>
  );
}
