/**
 * A problem the user can fix, specific to one tool (e.g. "no form fields in this PDF").
 * `code` is looked up in that tool's `errors` strings; `values` fill its placeholders.
 */
export class ToolError extends Error {
  readonly code: string;
  readonly values: Record<string, string | number>;

  constructor(code: string, values: Record<string, string | number> = {}) {
    super(code);
    this.name = 'ToolError';
    this.code = code;
    this.values = values;
  }
}
