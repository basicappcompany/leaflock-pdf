import { useEffect, useState } from 'react';
import { format, plural } from '../../i18n';
import { readableFieldName, type FormField, type FormValue } from '../../lib/edit/formFields';
import { runPdfJob } from '../../lib/pdf/client';
import type { FormFieldsResult } from '../../lib/pdf/ops/readFormFields';
import { baseName, type OutputFile } from '../../lib/pdf/types';
import { Checkbox, Field } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import type { ToolProps } from './types';
import '../../styles/edit.css';

function initialValue(field: FormField): FormValue {
  switch (field.kind) {
    case 'text':
      return field.value;
    case 'checkbox':
      return field.checked;
    case 'radio':
      return field.value ?? '';
    case 'dropdown':
    case 'optionList':
      return field.value;
  }
}

export default function FillFormTool({ locale, common, t }: ToolProps<'fillForm'>) {
  const [file, setFile] = useState<File>();
  const reader = useTask(common.errors, t.errors);
  const saver = useTask(common.errors, t.errors);
  const [form, setForm] = useState<FormFieldsResult>();
  const [values, setValues] = useState<Record<string, FormValue>>({});
  const [lock, setLock] = useState(false);
  const [result, setResult] = useState<OutputFile[]>();

  const { run: readForm, reset: resetReader } = reader;
  useEffect(() => {
    setForm(undefined);
    setResult(undefined);
    if (!file) return resetReader();
    let cancelled = false;
    void readForm(async () => runPdfJob('readFormFields', { input: { name: file.name, bytes: await readBytes(file) } })).then(
      (found) => {
        if (cancelled || !found) return;
        setForm(found);
        setValues(Object.fromEntries(found.fields.map((field) => [field.name, initialValue(field)])));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [file, readForm, resetReader]);

  function set(name: string, value: FormValue) {
    setValues((current) => ({ ...current, [name]: value }));
    setResult(undefined);
    saver.reset();
  }

  function reset() {
    setFile(undefined);
    saver.reset();
  }

  async function save() {
    if (!file || !form) return;
    const editable = Object.fromEntries(
      form.fields.filter((field) => !field.readOnly).map((field) => [field.name, values[field.name] ?? initialValue(field)]),
    );
    const output = await saver.run(async (onProgress) =>
      runPdfJob(
        'fillForm',
        {
          input: { name: file.name, bytes: await readBytes(file) },
          outputName: `${baseName(file.name)}-${t.outputSuffix}.pdf`,
          values: editable,
          flatten: lock,
        },
        onProgress,
      ),
    );
    if (output) setResult(output);
  }

  if (!file) {
    return (
      <div className="tool">
        <FilePicker common={common} onFiles={([picked]) => setFile(picked)} />
      </div>
    );
  }

  const working = saver.working;

  return (
    <div className="tool">
      <SelectedFile file={file} common={common} locale={locale} onClear={reset} disabled={working} />
      {reader.working && <p className="muted">{t.reading}</p>}
      <TaskStatusView status={reader.status.state === 'error' ? reader.status : { state: 'idle' }} common={common} />

      {form && (
        <form
          className="panel"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <p className="muted">{plural(locale, t.fieldCount, form.fields.length)}</p>
          {form.unsupportedCount > 0 && <p className="hint">{plural(locale, t.unsupported, form.unsupportedCount)}</p>}
          {form.hadXfa && <p className="hint">{t.xfaNote}</p>}

          <div className="form-fields">
            {form.fields.map((field) => (
              <FormFieldInput
                key={field.name}
                field={field}
                value={values[field.name] ?? initialValue(field)}
                onChange={(value) => set(field.name, value)}
                t={t}
                disabled={working}
              />
            ))}
          </div>

          <Checkbox label={t.lockIn} checked={lock} onChange={setLock} disabled={working} />
          <div className="tool__actions">
            <button type="submit" className="primary-button" disabled={working}>
              {working ? common.actions.working : t.action}
            </button>
          </div>
        </form>
      )}

      <TaskStatusView status={saver.status} common={common} />
      {result && <ResultFiles files={result} common={common} locale={locale} onStartOver={reset} />}
    </div>
  );
}

function FormFieldInput({
  field,
  value,
  onChange,
  t,
  disabled,
}: {
  field: FormField;
  value: FormValue;
  onChange: (value: FormValue) => void;
  t: ToolProps<'fillForm'>['t'];
  disabled: boolean;
}) {
  const label = readableFieldName(field.name);
  const hint = [field.readOnly ? t.readOnly : '', label !== field.name ? format(t.fieldName, { name: field.name }) : '']
    .filter(Boolean)
    .join(' · ');
  const off = disabled || field.readOnly;

  if (field.kind === 'checkbox') {
    return (
      <div className="field">
        <Checkbox label={label} checked={value === true} onChange={onChange} disabled={off} />
        {hint && <span className="field__name">{hint}</span>}
      </div>
    );
  }

  if (field.kind === 'radio') {
    return (
      <fieldset className="segmented" disabled={off}>
        <legend>{label}</legend>
        <div className="radio-list">
          {field.options.map((option) => (
            <label key={option} className="checkbox">
              <input type="radio" name={field.name} checked={value === option} onChange={() => onChange(option)} />
              {option}
            </label>
          ))}
        </div>
        {hint && <span className="field__name">{hint}</span>}
      </fieldset>
    );
  }

  return (
    <Field label={label} hint={hint || undefined}>
      {(id, describedBy) => {
        if (field.kind === 'text') {
          const common = {
            id,
            value: typeof value === 'string' ? value : '',
            disabled: off,
            'aria-describedby': describedBy,
            ...(field.maxLength === undefined ? {} : { maxLength: field.maxLength }),
          };
          return field.multiline ? (
            <textarea {...common} rows={4} onChange={(event) => onChange(event.currentTarget.value)} />
          ) : (
            <input {...common} type="text" onChange={(event) => onChange(event.currentTarget.value)} />
          );
        }
        const selected = Array.isArray(value) ? value : [];
        if (field.multiSelect || field.kind === 'optionList') {
          return (
            <select
              id={id}
              multiple={field.multiSelect}
              size={Math.min(Math.max(field.options.length, 2), 6)}
              value={field.multiSelect ? selected : (selected[0] ?? '')}
              disabled={off}
              aria-describedby={describedBy}
              onChange={(event) => onChange(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}
            >
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        }
        return (
          <select
            id={id}
            value={selected[0] ?? ''}
            disabled={off}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.currentTarget.value === '' ? [] : [event.currentTarget.value])}
          >
            <option value="">{t.noChoice}</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }}
    </Field>
  );
}
