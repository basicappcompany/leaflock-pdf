import {
  PDFBool,
  PDFCheckBox,
  PDFDropdown,
  PDFName,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  StandardFonts,
  type PDFField,
} from '@cantoo/pdf-lib';
import { canEncode } from '../../edit/drawText';
import { readableFieldName, type FormValue } from '../../edit/formFields';
import { ToolError } from '../errors';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface FillFormArgs {
  input: PdfInput;
  outputName: string;
  /** By field name. Text: string; checkbox: boolean; radio: option; dropdown/list: selected options. */
  values: Record<string, FormValue>;
  /** Turn the fields into ordinary page content ("lock answers in"). */
  flatten: boolean;
}

function setValue(field: PDFField, value: FormValue): void {
  if (field.isReadOnly()) return;
  if (field instanceof PDFTextField && typeof value === 'string') {
    const max = field.getMaxLength();
    field.setText(max === undefined ? value : value.slice(0, max));
  } else if (field instanceof PDFCheckBox && typeof value === 'boolean') {
    if (value) field.check();
    else field.uncheck();
  } else if (field instanceof PDFRadioGroup && typeof value === 'string') {
    if (field.getOptions().includes(value)) field.select(value);
  } else if ((field instanceof PDFDropdown || field instanceof PDFOptionList) && Array.isArray(value)) {
    const allowed = field instanceof PDFDropdown && field.isEditable() ? value : value.filter((option) => field.getOptions().includes(option));
    if (allowed.length === 0) field.clear();
    else field.select(field.isMultiselect() ? allowed : allowed.slice(0, 1));
  }
}

/** The text a field's appearance would show (typed text, or the chosen options). */
function fieldText(field: PDFField): string[] {
  if (field instanceof PDFTextField) return [field.getText() ?? ''];
  if (field instanceof PDFDropdown || field instanceof PDFOptionList) return field.getSelected();
  return [];
}

/** Writes the user's answers into a PDF form, and optionally flattens it. */
export async function fillForm(args: FillFormArgs, _ctx: OpContext): Promise<OutputFile[]> {
  const doc = await loadPdf(args.input);
  const form = doc.getForm();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const [name, value] of Object.entries(args.values)) {
    const field = form.getFieldMaybe(name);
    if (field) setValue(field, value);
  }

  // Draw each field's appearance in Helvetica. Answers Helvetica can't encode (e.g. Hindi or Chinese)
  // are left for the viewer to draw instead, which every PDF reader does when NeedAppearances is set.
  // pdf-lib would silently draw missing characters as "?", so check before drawing.
  const viewerDrawn: string[] = [];
  for (const field of form.getFields()) {
    if (!form.fieldIsDirty(field.ref)) continue;
    if (!fieldText(field).every((text) => canEncode(font, text))) {
      viewerDrawn.push(field.getName());
      continue;
    }
    field.defaultUpdateAppearances(font);
    form.markFieldAsClean(field.ref);
  }

  if (viewerDrawn.length > 0) {
    if (args.flatten) {
      throw new ToolError('cannot-lock', { field: readableFieldName(viewerDrawn[0]!) });
    }
    form.acroForm.dict.set(PDFName.of('NeedAppearances'), PDFBool.True);
  }

  if (args.flatten) form.flatten({ updateFieldAppearances: false });

  markProduced(doc);
  return [pdfFile(args.outputName, await doc.save({ updateFieldAppearances: false }))];
}
