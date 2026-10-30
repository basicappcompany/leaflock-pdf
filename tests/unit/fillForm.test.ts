import { PDFDict, PDFDocument, PDFName, PDFString } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { readableFieldName } from '../../src/lib/edit/formFields';
import { fillForm } from '../../src/lib/pdf/ops/fillForm';
import { readFormFields } from '../../src/lib/pdf/ops/readFormFields';
import { noProgress } from '../../src/lib/pdf/types';
import { makePdf } from '../fixtures/pdfs';
import { pdf, readPages } from './editHelpers';

async function makeForm(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 700]);
  const form = doc.getForm();
  form.createTextField('applicant.fullName').addToPage(page, { x: 50, y: 600, width: 300, height: 24 });
  const notes = form.createTextField('notes');
  notes.enableMultiline();
  notes.addToPage(page, { x: 50, y: 450, width: 300, height: 100 });
  form.createCheckBox('agree_terms').addToPage(page, { x: 50, y: 400, width: 16, height: 16 });
  const plan = form.createRadioGroup('plan');
  plan.addOptionToPage('Basic', page, { x: 50, y: 350, width: 16, height: 16 });
  plan.addOptionToPage('Pro', page, { x: 100, y: 350, width: 16, height: 16 });
  const country = form.createDropdown('country');
  country.addOptions(['India', 'Germany', 'Japan']);
  country.addToPage(page, { x: 50, y: 300, width: 150, height: 24 });
  return doc.save();
}

describe('readFormFields', () => {
  it('lists every fillable field with its kind and options', async () => {
    const { fields, unsupportedCount, hadXfa } = await readFormFields({ input: pdf('form.pdf', await makeForm()) }, noProgress);
    expect(unsupportedCount).toBe(0);
    expect(hadXfa).toBe(false);
    expect(fields.map((field) => [field.kind, field.name])).toEqual([
      ['text', 'applicant.fullName'],
      ['text', 'notes'],
      ['checkbox', 'agree_terms'],
      ['radio', 'plan'],
      ['dropdown', 'country'],
    ]);
    expect(fields[1]).toMatchObject({ multiline: true });
    expect(fields[4]).toMatchObject({ options: ['India', 'Germany', 'Japan'] });
  });

  it('explains when there is nothing to fill', async () => {
    await expect(readFormFields({ input: pdf('plain.pdf', await makePdf([[300, 300]])) }, noProgress)).rejects.toMatchObject({
      code: 'no-fields',
    });
  });

  it('recognises XFA-only forms', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([300, 300]);
    const acroForm = doc.context.obj({ Fields: [], XFA: PDFString.of('<xdp/>') });
    doc.catalog.set(PDFName.of('AcroForm'), acroForm);
    await expect(readFormFields({ input: pdf('xfa.pdf', await doc.save()) }, noProgress)).rejects.toMatchObject({
      code: 'xfa-only',
    });
  });
});

describe('fillForm', () => {
  const values = {
    'applicant.fullName': 'Asha Rao',
    notes: 'Line one\nLine two',
    agree_terms: true,
    plan: 'Pro',
    country: ['Japan'],
  };

  it('writes the answers so they read back', async () => {
    const [output] = await fillForm({ input: pdf('form.pdf', await makeForm()), outputName: 'filled.pdf', values, flatten: false }, noProgress);
    const { fields } = await readFormFields({ input: pdf('filled.pdf', output!.bytes) }, noProgress);
    expect(fields).toEqual([
      expect.objectContaining({ name: 'applicant.fullName', value: 'Asha Rao' }),
      expect.objectContaining({ name: 'notes', value: 'Line one\nLine two' }),
      expect.objectContaining({ name: 'agree_terms', checked: true }),
      expect.objectContaining({ name: 'plan', value: 'Pro' }),
      expect.objectContaining({ name: 'country', value: ['Japan'] }),
    ]);
  });

  it('locks answers into the page when flattening', async () => {
    const [output] = await fillForm({ input: pdf('form.pdf', await makeForm()), outputName: 'filled.pdf', values, flatten: true }, noProgress);
    await expect(readFormFields({ input: pdf('filled.pdf', output!.bytes) }, noProgress)).rejects.toMatchObject({ code: 'no-fields' });
    expect((await readPages(output!.bytes))[0]!.text).toContain('Asha Rao');
  });

  it('lets the viewer draw answers Helvetica can’t, and refuses to lock those in', async () => {
    const hindi = { 'applicant.fullName': 'आशा राव' };
    const [output] = await fillForm(
      { input: pdf('form.pdf', await makeForm()), outputName: 'filled.pdf', values: hindi, flatten: false },
      noProgress,
    );
    const doc = await PDFDocument.load(output!.bytes);
    expect(doc.getForm().getTextField('applicant.fullName').getText()).toBe('आशा राव');
    const acroForm = doc.catalog.lookup(PDFName.of('AcroForm'), PDFDict);
    expect(acroForm.get(PDFName.of('NeedAppearances'))?.toString()).toBe('true');

    await expect(
      fillForm({ input: pdf('form.pdf', await makeForm()), outputName: 'filled.pdf', values: hindi, flatten: true }, noProgress),
    ).rejects.toMatchObject({ code: 'cannot-lock', values: { field: 'Full name' } });
  });
});

describe('readableFieldName', () => {
  it('turns internal names into labels', () => {
    expect(readableFieldName('applicant.firstName_2')).toBe('First name 2');
    expect(readableFieldName('form1[0].page1[0].ZIP_code[0]')).toBe('Zip code');
    expect(readableFieldName('___')).toBe('___');
  });
});
