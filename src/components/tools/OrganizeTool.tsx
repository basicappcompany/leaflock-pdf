import { useEffect, useRef, useState } from 'react';
import '../../styles/organize.css';
import { format, plural } from '../../i18n';
import { normaliseRotation, type QuarterTurn } from '../../lib/organize/pages';
import { runPdfJob } from '../../lib/pdf/client';
import type { OutputFile } from '../../lib/pdf/types';
import { closePdf, openPdf, type PDFDocumentProxy } from '../../lib/pdfjs';
import { FilePicker } from '../ui/FilePicker';
import { moveItem } from '../ui/PageGrid';
import { PageThumbnail } from '../ui/PageThumbnail';
import { ResultFiles } from '../ui/ResultFiles';
import { TaskStatusView } from '../ui/TaskStatusView';
import { readBytes } from '../ui/usePdfDocument';
import { describeFailure, useTask } from '../ui/useTask';
import type { ToolProps } from './types';

interface LoadedFile {
  id: string;
  name: string;
  bytes: Uint8Array<ArrayBuffer>;
  doc: PDFDocumentProxy;
}

type Item =
  | { key: string; kind: 'page'; fileId: string; index: number; rotation: QuarterTurn; removed: boolean }
  | { key: string; kind: 'blank'; width: number; height: number };

const A4 = { width: 595, height: 842 };

export default function OrganizeTool({ locale, common, t, preset }: ToolProps<'organize'>) {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  // What the pages looked like straight after loading, for "undo all changes".
  const [original, setOriginal] = useState<Item[]>([]);
  const [loading, setLoading] = useState<string[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [result, setResult] = useState<OutputFile[]>();
  const [dragFrom, setDragFrom] = useState<number>();
  const [dragOver, setDragOver] = useState<number>();
  const task = useTask(common.errors, t.errors);

  // Close every pdf.js document when the tool goes away.
  const filesRef = useRef(files);
  filesRef.current = files;
  useEffect(() => () => filesRef.current.forEach((file) => void closePdf(file.doc)), []);

  function edit(next: Item[]) {
    setItems(next);
    setResult(undefined);
    task.reset();
  }

  async function addFiles(picked: File[]) {
    setNotices([]);
    setLoading(picked.map((file) => file.name));
    const loaded: LoadedFile[] = [];
    const problems: string[] = [];
    for (const file of picked) {
      try {
        const bytes = await readBytes(file);
        const doc = await openPdf(file.name, bytes);
        loaded.push({ id: crypto.randomUUID(), name: file.name, bytes, doc });
      } catch (error) {
        problems.push(describeFailure(error, common.errors));
      }
    }
    const added: Item[] = loaded.flatMap((file) =>
      Array.from({ length: file.doc.numPages }, (_, index) => ({
        key: `${file.id}-${index}`,
        kind: 'page' as const,
        fileId: file.id,
        index,
        rotation: 0 as const,
        removed: false,
      })),
    );
    setFiles((current) => [...current, ...loaded]);
    setOriginal((current) => [...current, ...added]);
    // The Reverse pages landing exists because reversing 200 pages by hand is not a
    // thing anyone will do; the first file it opens arrives already reversed. "Undo all
    // changes" still restores document order, since `original` keeps it.
    const reverseFirst = preset?.['apply'] === 'reverse' && items.length === 0;
    setItems((current) => [...current, ...(reverseFirst ? [...added].reverse() : added)]);
    setNotices(problems);
    setLoading([]);
    setResult(undefined);
    task.reset();
  }

  function clearAll() {
    files.forEach((file) => void closePdf(file.doc));
    setFiles([]);
    setOriginal([]);
    edit([]);
  }

  async function addBlank() {
    // Match the size of the last real page, so a blank page fits in.
    let size = A4;
    const last = [...items].reverse().find((item) => item.kind === 'page');
    if (last?.kind === 'page') {
      const file = files.find((f) => f.id === last.fileId);
      if (file) {
        // Displayed size (with the page's own /Rotate), then our extra turn on top.
        const viewport = (await file.doc.getPage(last.index + 1)).getViewport({ scale: 1 });
        const turned = (last.rotation / 90) % 2 === 1;
        size = turned ? { width: viewport.height, height: viewport.width } : { width: viewport.width, height: viewport.height };
      }
    }
    edit([...items, { key: crypto.randomUUID(), kind: 'blank', ...size }]);
  }

  const update = (position: number, change: (item: Item) => Item | null) =>
    edit(items.flatMap((item, i) => (i === position ? [change(item)].filter((x): x is Item => x !== null) : [item])));

  const rotate = (position: number, by: number) =>
    update(position, (item) => (item.kind === 'page' ? { ...item, rotation: normaliseRotation(item.rotation + by) } : item));

  const kept = items.filter((item) => item.kind === 'blank' || !item.removed);
  const multiFile = files.length > 1;

  function label(item: Item): string {
    if (item.kind === 'blank') return t.blankPage;
    const page = format(common.pages.page, { number: item.index + 1 });
    if (!multiFile) return page;
    const name = files.find((file) => file.id === item.fileId)?.name ?? '';
    return format(t.pageFromFile, { name, number: item.index + 1 });
  }

  async function save() {
    const sourceIndex = new Map(files.map((file, index) => [file.id, index]));
    const output = await task.run((onProgress) =>
      runPdfJob(
        'assemble',
        {
          inputs: files.map((file) => ({ name: file.name, bytes: file.bytes })),
          pages: kept.map((item) =>
            item.kind === 'blank'
              ? { blank: true as const, width: item.width, height: item.height }
              : { source: sourceIndex.get(item.fileId)!, index: item.index, rotation: item.rotation },
          ),
          outputName: t.outputName,
        },
        onProgress,
      ),
    );
    if (output) setResult(output);
  }

  const working = task.working;
  const unchanged = JSON.stringify(items) === JSON.stringify(original);

  return (
    <div className="tool">
      <FilePicker common={common} multiple compact={files.length > 0} onFiles={addFiles} onSkipped={setNotices} />
      {loading.map((name) => (
        <p key={name} className="muted" role="status">
          {format(t.loadingFile, { name })}
        </p>
      ))}
      {notices.map((notice) => (
        <p key={notice} className="notice" role="alert">
          {notice}
        </p>
      ))}

      {items.length > 0 && (
        <>
          <div className="list-header">
            <span>
              {plural(locale, common.files.count, files.length)} · {plural(locale, common.pages.count, kept.length)}
            </span>
            <button type="button" className="link-button" onClick={clearAll} disabled={working}>
              {common.files.clear}
            </button>
          </div>
          <div className="toolbar">
            <button type="button" className="secondary-button" onClick={addBlank} disabled={working}>
              + {t.addBlank}
            </button>
            <button type="button" className="secondary-button" onClick={() => edit([...items].reverse())} disabled={working}>
              ⇅ {t.reverse}
            </button>
            <button type="button" className="link-button" onClick={() => edit(original)} disabled={working || unchanged}>
              {t.reset}
            </button>
          </div>
          <p className="muted">{t.instructions}</p>

          <ol className="page-grid organize-grid">
            {items.map((item, position) => {
              const name = label(item);
              const removed = item.kind === 'page' && item.removed;
              const classes = [
                'page-grid__item',
                removed && 'is-dimmed',
                dragOver === position && dragFrom !== position && 'is-drop-target',
              ].filter(Boolean);
              const doc = item.kind === 'page' ? files.find((file) => file.id === item.fileId)?.doc : undefined;
              const number = position + 1;
              return (
                <li
                  key={item.key}
                  className={classes.join(' ')}
                  draggable={!working}
                  aria-label={name}
                  onDragStart={(event) => {
                    setDragFrom(position);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(event) => {
                    if (dragFrom === undefined) return;
                    event.preventDefault();
                    setDragOver(position);
                  }}
                  onDragEnd={() => {
                    setDragFrom(undefined);
                    setDragOver(undefined);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragFrom !== undefined && dragFrom !== position) edit(moveItem(items, dragFrom, position));
                    setDragFrom(undefined);
                    setDragOver(undefined);
                  }}
                >
                  <div className="page-grid__page">
                    {item.kind === 'page' && doc ? (
                      <PageThumbnail doc={doc} pageNumber={item.index + 1} rotation={item.rotation} alt="" />
                    ) : (
                      <div className="blank-thumbnail" aria-hidden="true">
                        <div className="blank-thumbnail__page" />
                      </div>
                    )}
                    <span className="page-grid__label">{name}</span>
                  </div>
                  <div className="page-grid__controls">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={format(common.pages.moveEarlier, { number })}
                      disabled={working || position === 0}
                      onClick={() => edit(moveItem(items, position, position - 1))}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={format(common.pages.moveLater, { number })}
                      disabled={working || position === items.length - 1}
                      onClick={() => edit(moveItem(items, position, position + 1))}
                    >
                      →
                    </button>
                    {item.kind === 'page' && (
                      <>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={format(common.pages.rotateLeft, { number })}
                          disabled={working || removed}
                          onClick={() => rotate(position, -90)}
                        >
                          ↺
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={format(common.pages.rotateRight, { number })}
                          disabled={working || removed}
                          onClick={() => rotate(position, 90)}
                        >
                          ↻
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={format(removed ? common.pages.restore : common.pages.remove, { number })}
                          aria-pressed={removed}
                          disabled={working}
                          onClick={() => update(position, (it) => (it.kind === 'page' ? { ...it, removed: !it.removed } : it))}
                        >
                          {removed ? '↩' : '✕'}
                        </button>
                      </>
                    )}
                    {item.kind === 'blank' && (
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={t.removeBlank}
                        disabled={working}
                        onClick={() => update(position, () => null)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="tool__actions">
            {kept.length === 0 && <p className="warning">{t.noPagesLeft}</p>}
            <button type="button" className="primary-button" disabled={kept.length === 0 || working} onClick={save}>
              {working ? common.actions.working : t.action}
            </button>
          </div>
        </>
      )}

      <TaskStatusView status={task.status} common={common} />
      {result && <ResultFiles files={result} common={common} locale={locale} onStartOver={clearAll} />}
    </div>
  );
}
