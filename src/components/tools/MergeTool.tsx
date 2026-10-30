import { useState } from 'react';
import { format, plural } from '../../i18n';
import { runPdfJob } from '../../lib/pdf/client';
import type { OutputFile } from '../../lib/pdf/types';
import { FilePicker } from '../ui/FilePicker';
import { formatBytes } from '../ui/formatBytes';
import { ResultFiles } from '../ui/ResultFiles';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import type { ToolProps } from './types';

interface PickedFile {
  id: string;
  file: File;
}

export default function MergeTool({ locale, common, t }: ToolProps<'merge'>) {
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [result, setResult] = useState<OutputFile[]>();
  const task = useTask(common.errors);

  function changeFiles(next: PickedFile[]) {
    setFiles(next);
    setResult(undefined);
    task.reset();
  }

  function move(index: number, offset: -1 | 1) {
    const next = [...files];
    const [item] = next.splice(index, 1);
    if (item) next.splice(index + offset, 0, item);
    changeFiles(next);
  }

  async function merge() {
    const output = await task.run(async (onProgress) => {
      const inputs = await Promise.all(files.map(async ({ file }) => ({ name: file.name, bytes: await readBytes(file) })));
      return runPdfJob('merge', { inputs, outputName: t.outputName }, onProgress);
    });
    if (output) setResult(output);
  }

  const working = task.working;
  const count = plural(locale, common.files.count, files.length);

  return (
    <div className="tool">
      <FilePicker
        common={common}
        multiple
        compact={files.length > 0}
        onFiles={(picked) => changeFiles([...files, ...picked.map((file) => ({ id: crypto.randomUUID(), file }))])}
        onSkipped={setNotices}
      />

      {notices.map((notice) => (
        <p key={notice} className="notice" role="status">
          {notice}
        </p>
      ))}

      {files.length > 0 && (
        <section aria-label={count}>
          <div className="list-header">
            <span>{count}</span>
            <button type="button" className="link-button" onClick={() => changeFiles([])} disabled={working}>
              {common.files.clear}
            </button>
          </div>
          <ol className="file-list">
            {files.map(({ id, file }, index) => (
              <li key={id} className="file-list__item">
                <span className="file-list__name">{file.name}</span>
                <span className="muted">{formatBytes(file.size, locale)}</span>
                <span className="icon-buttons">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={format(common.files.moveUp, { name: file.name })}
                    disabled={working || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={format(common.files.moveDown, { name: file.name })}
                    disabled={working || index === files.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={format(common.files.remove, { name: file.name })}
                    disabled={working}
                    onClick={() => changeFiles(files.filter((item) => item.id !== id))}
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="tool__actions">
        {files.length === 1 && <p className="hint">{t.needTwo}</p>}
        <button type="button" className="primary-button" disabled={files.length < 2 || working} onClick={merge}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      <TaskStatusView status={task.status} common={common} />
      {result && <ResultFiles files={result} common={common} locale={locale} onStartOver={() => changeFiles([])} />}
    </div>
  );
}
