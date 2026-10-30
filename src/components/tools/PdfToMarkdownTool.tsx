import { useState } from 'react';
import { format, plural } from '../../i18n';
import { toMarkdown, type ToMarkdownResult } from '../../lib/convert/markdown';
import { bodyTextSize, pageStructure, type PageStructure, type TextRun } from '../../lib/convert/structure';
import { pageTextRuns } from '../../lib/pdfjs';
import { FilePicker } from '../ui/FilePicker';
import { ResultFiles } from '../ui/ResultFiles';
import { SelectedFile } from '../ui/SelectedFile';
import { TaskStatusView } from '../ui/TaskStatusView';
import { usePdfDocument } from '../ui/usePdfDocument';
import { useTask } from '../ui/useTask';
import { outputName } from './secure/outputName';
import type { ToolProps } from './types';

export default function PdfToMarkdownTool({ locale, common, t }: ToolProps<'pdfToMarkdown'>) {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<ToMarkdownResult>();
  const [stage, setStage] = useState<string>();
  const pdf = usePdfDocument(file);
  const task = useTask(common.errors, t.errors);

  function startOver() {
    setFile(undefined);
    setResult(undefined);
    setStage(undefined);
    task.reset();
  }

  async function run() {
    if (!file || pdf.state !== 'ready') return;
    setResult(undefined);
    const doc = pdf.doc;

    const output = await task.run(async (onProgress) => {
      // Reading needs pdf.js, which lives on the main thread (see CLAUDE.md); writing
      // Markdown is a few lines of string-building with no dependency at all, so this
      // whole conversion runs here, with no job worker involved — see lib/convert/markdown.ts.
      const perPage: TextRun[][] = [];
      for (let number = 1; number <= doc.numPages; number++) {
        setStage(format(t.reading, { number, count: doc.numPages }));
        const page = await doc.getPage(number);
        perPage.push(await pageTextRuns(page));
        page.cleanup();
        onProgress(number / doc.numPages);
      }
      setStage(undefined);

      const bodySize = bodyTextSize(perPage);
      const pages: PageStructure[] = await Promise.all(
        perPage.map(async (runs, index) => {
          const { width } = (await doc.getPage(index + 1)).getViewport({ scale: 1 });
          return pageStructure(runs, width, bodySize);
        }),
      );

      return toMarkdown({ pages, outputName: `${outputName(file, t.outputSuffix).replace(/\.pdf$/i, '')}.md` });
    });

    setStage(undefined);
    if (output) setResult(output);
  }

  if (!file) {
    return (
      <div className="tool">
        <FilePicker common={common} onFiles={([picked]) => setFile(picked)} />
      </div>
    );
  }

  const working = task.working;

  return (
    <div className="tool">
      <SelectedFile file={file} common={common} locale={locale} onClear={startOver} disabled={working} />

      <div className="tool__actions">
        <button type="button" className="primary-button" disabled={working || pdf.state !== 'ready'} onClick={run}>
          {working ? common.actions.working : t.action}
        </button>
      </div>

      {working && stage && <p className="hint">{stage}</p>}
      <TaskStatusView status={task.status} common={common} />

      {result && (
        <ResultFiles files={[result.file]} common={common} locale={locale} onStartOver={startOver}>
          <p>{plural(locale, t.blocksDone, result.paragraphs)}</p>
          {result.headings > 0 && <p>{plural(locale, t.headingsDone, result.headings)}</p>}
          {result.listItems > 0 && <p>{plural(locale, t.listItemsDone, result.listItems)}</p>}
          {result.columnPages.length > 0 && (
            <p role="alert" className="hint">
              {format(plural(locale, t.columnsWarning, result.columnPages.length), {
                pages: result.columnPages.join(', '),
              })}
            </p>
          )}
        </ResultFiles>
      )}
    </div>
  );
}
