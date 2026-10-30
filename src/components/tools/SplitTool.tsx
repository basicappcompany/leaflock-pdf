import { useMemo, useState } from 'react';
import '../../styles/organize.css';
import { format, plural } from '../../i18n';
import { splitGroups, type SplitMode } from '../../lib/organize/pages';
import { parsePageRanges } from '../../lib/pageRanges';
import { runPdfJob } from '../../lib/pdf/client';
import type { OutputFile } from '../../lib/pdf/types';
import { Field, Segmented } from '../ui/fields';
import { PageGrid } from '../ui/PageGrid';
import { PageRangeField } from '../ui/PageRangeField';
import { ResultFiles } from '../ui/ResultFiles';
import { TaskStatusView } from '../ui/TaskStatusView';
import { useTask } from '../ui/useTask';
import { PdfIntake, useSinglePdf } from './organize/PdfIntake';
import type { ToolProps } from './types';

type ModeKind = SplitMode['kind'];

interface RangeRow {
  id: string;
  text: string;
}

const newRow = (text = ''): RangeRow => ({ id: crypto.randomUUID(), text });

export default function SplitTool({ locale, common, t }: ToolProps<'split'>) {
  const { file, setFile, doc } = useSinglePdf();
  const [kind, setKind] = useState<ModeKind>('ranges');
  const [rows, setRows] = useState<RangeRow[]>(() => [newRow()]);
  const [every, setEvery] = useState('1');
  const [result, setResult] = useState<OutputFile[]>();
  const task = useTask(common.errors, t.errors);

  const pageCount = doc.state === 'ready' ? doc.doc.numPages : 0;

  function changed() {
    setResult(undefined);
    task.reset();
  }

  function pick(next: File | undefined) {
    setFile(next);
    setRows([newRow()]);
    changed();
  }

  // The mode as it stands, or null while the user's input is incomplete or invalid.
  const mode = useMemo((): SplitMode | null => {
    if (kind === 'single') return { kind };
    if (kind === 'every') {
      const size = Number(every);
      return Number.isInteger(size) && size >= 1 ? { kind, size } : null;
    }
    const groups = rows.filter((row) => row.text.trim() !== '').map((row) => parsePageRanges(row.text, pageCount));
    if (groups.length === 0 || groups.some((group) => group === null)) return null;
    return { kind, groups: groups as number[][] };
  }, [kind, every, rows, pageCount]);

  const fileCount = mode && pageCount > 0 ? splitGroups(mode, pageCount).length : 0;

  const pages = useMemo(
    () => (doc.state === 'ready' ? Array.from({ length: pageCount }, (_, index) => ({ key: String(index), doc: doc.doc, index })) : []),
    [doc, pageCount],
  );

  async function run() {
    if (doc.state !== 'ready' || !file || !mode) return;
    const output = await task.run((onProgress) =>
      runPdfJob('split', { input: { name: file.name, bytes: doc.bytes }, mode }, onProgress),
    );
    if (output) setResult(output);
  }

  const working = task.working;

  return (
    <div className="tool">
      <PdfIntake file={file} doc={doc} common={common} locale={locale} onFile={pick} disabled={working} />

      {doc.state === 'ready' && (
        <div className="tool__workspace">
          <PageGrid pages={pages} common={common} />

          <div className="panel">
            <Segmented
              label={t.modeLabel}
              value={kind}
              options={[
                { value: 'ranges', label: t.modes.ranges },
                { value: 'every', label: t.modes.every },
                { value: 'single', label: t.modes.single },
              ]}
              onChange={(next) => {
                setKind(next);
                changed();
              }}
              disabled={working}
            />

            {kind === 'ranges' && (
              <>
                <ol className="split-ranges">
                  {rows.map((row, index) => (
                    <li key={row.id}>
                      <PageRangeField
                        value={row.text}
                        pageCount={pageCount}
                        common={common}
                        label={format(t.rangeLabel, { number: index + 1 })}
                        disabled={working}
                        onChange={(text) => {
                          setRows(rows.map((item) => (item.id === row.id ? { ...item, text } : item)));
                          changed();
                        }}
                      />
                      {rows.length > 1 && (
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={format(t.removeRange, { number: index + 1 })}
                          disabled={working}
                          onClick={() => {
                            setRows(rows.filter((item) => item.id !== row.id));
                            changed();
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={working}
                  onClick={() => setRows([...rows, newRow()])}
                >
                  + {t.addRange}
                </button>
              </>
            )}

            {kind === 'every' && (
              <Field label={t.everyLabel}>
                {(id) => (
                  <input
                    id={id}
                    type="number"
                    min={1}
                    max={pageCount}
                    step={1}
                    value={every}
                    disabled={working}
                    onChange={(event) => {
                      setEvery(event.currentTarget.value);
                      changed();
                    }}
                  />
                )}
              </Field>
            )}

            <p className="muted" role="status">
              {mode ? plural(locale, t.willCreate, fileCount) : t.fixRanges}
            </p>
            <button type="button" className="primary-button" disabled={!mode || working} onClick={run}>
              {working ? common.actions.working : t.action}
            </button>
          </div>
        </div>
      )}

      <TaskStatusView status={task.status} common={common} />
      {result && <ResultFiles files={result} common={common} locale={locale} onStartOver={() => pick(undefined)} />}
    </div>
  );
}
