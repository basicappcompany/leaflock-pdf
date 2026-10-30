import { useEffect, useState } from 'react';
import { runPdfJob } from '../../lib/pdf/client';
import type { EditMetadataResult } from '../../lib/pdf/ops/editMetadata';
import type { ReadMetadataResult } from '../../lib/pdf/ops/readMetadata';
import type { DocMetadata } from '../../lib/pdf/metadata';
import { Field } from '../ui/fields';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

type Editable = keyof DocMetadata;

const order = ['title', 'author', 'subject', 'keywords'] as const satisfies readonly Editable[];

const blank: Record<Editable, string> = { title: '', author: '', subject: '', keywords: '' };

export default function EditMetadataTool({ locale, common, t }: ToolProps<'editMetadata'>) {
  const [file, setFile] = useState<File>();
  const reader = useTask(common.errors, t.errors);
  const saver = useTask(common.errors, t.errors);
  const [current, setCurrent] = useState<ReadMetadataResult>();
  const [values, setValues] = useState<Record<Editable, string>>(blank);
  const [result, setResult] = useState<EditMetadataResult>();

  const { run: readProperties, reset: resetReader } = reader;
  useEffect(() => {
    setCurrent(undefined);
    setResult(undefined);
    setValues(blank);
    if (!file) return resetReader();

    let cancelled = false;
    void readProperties(async () =>
      runPdfJob('readMetadata', { input: { name: file.name, bytes: await readBytes(file) } }),
    ).then((found) => {
      if (cancelled || !found) return;
      setCurrent(found);
      setValues({
        title: found.values.title ?? '',
        author: found.values.author ?? '',
        subject: found.values.subject ?? '',
        keywords: found.values.keywords ?? '',
      });
    });
    return () => {
      cancelled = true;
    };
  }, [file, readProperties, resetReader]);

  function startOver() {
    setFile(undefined);
    setCurrent(undefined);
    setResult(undefined);
    setValues(blank);
    reader.reset();
    saver.reset();
  }

  function set(field: Editable, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setResult(undefined);
    saver.reset();
  }

  async function save() {
    if (!file) return;
    setResult(undefined);
    const output = await saver.run(async () =>
      runPdfJob('editMetadata', {
        input: { name: file.name, bytes: await readBytes(file) },
        values: {
          title: values.title.trim() || undefined,
          author: values.author.trim() || undefined,
          subject: values.subject.trim() || undefined,
          keywords: values.keywords.trim() || undefined,
        },
        outputName: outputName(file, t.outputSuffix),
      }),
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
  const hadNothing = current && order.every((field) => !current.values[field]);

  return (
    <div className="tool">
      <SelectedFile file={file} common={common} locale={locale} onClear={startOver} disabled={working} />

      <TaskStatusView status={reader.status} common={common} />

      {current && (
        <>
          <div className="panel">
            {hadNothing && <p className="hint">{t.empty}</p>}
            {order.map((field) => (
              <Field
                key={field}
                label={t.fields[field]}
                hint={field === 'keywords' ? t.keywordsHint : undefined}
              >
                {(id, describedBy) => (
                  <input
                    id={id}
                    type="text"
                    value={values[field]}
                    disabled={working}
                    aria-describedby={describedBy}
                    onChange={(event) => set(field, event.target.value)}
                  />
                )}
              </Field>
            ))}
            {current.hasXmp && <p className="hint">{t.xmpNotice}</p>}
          </div>

          <div className="tool__actions">
            <button type="button" className="primary-button" disabled={working} onClick={save}>
              {working ? common.actions.working : t.action}
            </button>
          </div>
        </>
      )}

      <TaskStatusView status={saver.status} common={common} />
      {result && (
        <ResultFiles files={[result.file]} common={common} locale={locale} onStartOver={startOver}>
          <p>{t.saved}</p>
          {result.removedXmp && <p>{t.xmpRemoved}</p>}
        </ResultFiles>
      )}
    </div>
  );
}
