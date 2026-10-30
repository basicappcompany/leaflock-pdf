import {
  PDFCheckBox,
  PDFDict,
  PDFDropdown,
  PDFName,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  type PDFDocument,
} from '@cantoo/pdf-lib';
import type { FormField } from '../../edit/formFields';
import { ToolError } from '../errors';
import { loadPdf, type PdfInput } from '../load';
import type { OpContext } from '../types';

export interface ReadFormFieldsArgs {
  input: PdfInput;
}

export interface FormFieldsResult {
  fields: FormField[];
  /** Fields we list but can't fill here (buttons, digital signature fields). */
  unsupportedCount: number;
  /** The file also carries an XFA form; filling replaces it with the standard form. */
  hadXfa: boolean;
}

export function hasXfa(doc: PDFDocument): boolean {
  const acroForm = doc.catalog.lookupMaybe(PDFName.of('AcroForm'), PDFDict);
  return !!acroForm?.has(PDFName.of('XFA'));
}

/** Lists the form fields of a PDF so the UI can show a form for them. */
export async function readFormFields({ input }: ReadFormFieldsArgs, _ctx: OpContext): Promise<FormFieldsResult> {
  const doc = await loadPdf(input);
  const hadXfa = hasXfa(doc);
  const all = doc.getForm().getFields();

  const fields: FormField[] = [];
  let unsupportedCount = 0;
  for (const field of all) {
    const name = field.getName();
    const readOnly = field.isReadOnly();
    if (field instanceof PDFTextField) {
      fields.push({
        kind: 'text',
        name,
        value: field.getText() ?? '',
        multiline: field.isMultiline(),
        maxLength: field.getMaxLength(),
        readOnly,
      });
    } else if (field instanceof PDFCheckBox) {
      fields.push({ kind: 'checkbox', name, checked: field.isChecked(), readOnly });
    } else if (field instanceof PDFRadioGroup) {
      fields.push({ kind: 'radio', name, value: field.getSelected() ?? null, options: field.getOptions(), readOnly });
    } else if (field instanceof PDFDropdown) {
      fields.push({
        kind: 'dropdown',
        name,
        value: field.getSelected(),
        options: field.getOptions(),
        editable: field.isEditable(),
        multiSelect: field.isMultiselect(),
        readOnly,
      });
    } else if (field instanceof PDFOptionList) {
      fields.push({
        kind: 'optionList',
        name,
        value: field.getSelected(),
        options: field.getOptions(),
        multiSelect: field.isMultiselect(),
        readOnly,
      });
    } else {
      unsupportedCount++;
    }
  }

  if (fields.length === 0) throw new ToolError(hadXfa ? 'xfa-only' : 'no-fields');
  return { fields, unsupportedCount, hadXfa };
}
