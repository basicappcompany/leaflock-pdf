/** A fillable field, as listed for the Fill form tool. */
export type FormField =
  | { kind: 'text'; name: string; value: string; multiline: boolean; maxLength: number | undefined; readOnly: boolean }
  | { kind: 'checkbox'; name: string; checked: boolean; readOnly: boolean }
  | { kind: 'radio'; name: string; value: string | null; options: string[]; readOnly: boolean }
  | {
      kind: 'dropdown';
      name: string;
      value: string[];
      options: string[];
      editable: boolean;
      multiSelect: boolean;
      readOnly: boolean;
    }
  | { kind: 'optionList'; name: string; value: string[]; options: string[]; multiSelect: boolean; readOnly: boolean };

export type FormValue = string | boolean | string[];

/** "applicant.firstName_2" → "Applicant first name 2": a readable label from a field's internal name. */
export function readableFieldName(name: string): string {
  const last = name.split('.').filter(Boolean).pop() ?? name;
  const words = last
    .replace(/\[\d+\]$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (words === '') return name;
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}
