/**
 * Parses comma-separated text per RFC 4180: a quoted field may contain commas, line
 * breaks and `""` as an escaped quote. Hand-rolled rather than a dependency — CSV's
 * grammar is small enough that a character scan is both correct and fully testable
 * without one, and a quoted field with an embedded newline is exactly where splitting
 * the text into lines first (the tempting shortcut) gets the wrong answer.
 *
 * Only comma-delimited CSV is read; a semicolon- or tab-delimited export is a different,
 * common convention this does not guess at — stated on the tool page.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let sawAnyField = false;

  const endField = () => {
    row.push(field);
    field = '';
    sawAnyField = true;
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
    sawAnyField = false;
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ',') endField();
    else if (char === '\r') continue; // paired \n handles the line break
    else if (char === '\n') endRow();
    else field += char;
  }
  // A final line with no trailing newline still needs committing; one that is empty
  // and was never started (the file ended in a newline) must not become a phantom row.
  if (field !== '' || row.length > 0 || sawAnyField) endRow();

  return rows;
}

/** Writes rows back out per RFC 4180: a field containing a comma, a quote or a line
 * break is quoted, with `"` doubled inside it. The inverse of {@link parseCsv}. */
export function writeCsv(rows: readonly (readonly string[])[]): string {
  const field = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value);
  return rows.map((row) => row.map(field).join(',')).join('\r\n');
}
