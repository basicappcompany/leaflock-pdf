/**
 * Crash reports, sent to our own origin (/api/errors) so the CSP stays at connect-src 'self'.
 *
 * A report never contains file contents, file names, page text or anything the user typed:
 * messages are scrubbed of file names and quoted text, and stacks keep only our own code's
 * paths. Expected problems (locked or broken files, user mistakes) are not reported; only bugs.
 */

export const ENDPOINT = '/api/errors';
const MAX_REPORTS_PER_PAGE = 5;
const MAX_MESSAGE = 300;
const MAX_FRAMES = 12;

export interface ErrorReport {
  v: 1;
  kind: 'error' | 'unhandled' | 'job';
  tool: string | undefined;
  name: string;
  message: string;
  stack: string[];
  /** Path only, e.g. "/merge-pdf/". */
  page: string;
  /** Browser family and major version, e.g. "Chrome 141". */
  browser: string;
}

const extensions = 'pdf|png|jpe?g|webp|gif|bmp|tiff?|heic|avif|txt|zip|docx?|xlsx?|pptx?';
// File names can contain spaces ("Salary slip March.pdf") and we can't tell where they start,
// so everything from the previous punctuation mark (or the start) up to the extension goes.
const fileNameWithSpaces = new RegExp(`(^|[:;,(\\[])[^:;,()\\[\\]\\n]*?\\.(?:${extensions})\\b`, 'gi');
const fileName = new RegExp(`[^\\s"'\`/\\\\:]+\\.(?:${extensions})\\b`, 'gi');
const quoted = /(["'`“‘])(?:(?!\1|[”’]).){1,200}(?:\1|[”’])/g;
const localUrl = /\b(?:blob|data|file):[^\s)]+/gi;

/** Removes anything that could identify the user's files from an error message. */
export function scrubMessage(text: string): string {
  const scrubbed = text
    .replace(localUrl, '[url]')
    .replace(quoted, '[text]')
    .replace(fileNameWithSpaces, '$1 [file]')
    .replace(fileName, '[file]')
    .replace(/\s+/g, ' ')
    .trim();
  return scrubbed.length > MAX_MESSAGE ? `${scrubbed.slice(0, MAX_MESSAGE)}…` : scrubbed;
}

/** Keeps stack frames from our own scripts, as paths without the origin or query. */
export function scrubStack(stack: string | undefined, origin: string): string[] {
  if (!stack) return [];
  return stack
    .split('\n')
    .filter((line) => line.includes(origin))
    .map((line) => {
      const trimmed = line.trim().split(origin).join('').replace(/\?[^:)\s]*/g, '');
      return scrubMessage(trimmed).slice(0, 200);
    })
    .slice(0, MAX_FRAMES);
}

/** "Mozilla/5.0 … Chrome/141.0.0.0 … Edg/141.0" → "Edge 141". */
export function browserFamily(userAgent: string): string {
  const patterns: [string, RegExp][] = [
    ['Edge', /Edg\/(\d+)/],
    ['Firefox', /Firefox\/(\d+)/],
    ['Chrome', /Chrome\/(\d+)/],
    ['Safari', /Version\/(\d+)[^ ]* (?:Mobile\/\S+ )?Safari/],
  ];
  for (const [name, pattern] of patterns) {
    const match = pattern.exec(userAgent);
    if (match) return `${name} ${match[1]}`;
  }
  return 'Other';
}

export function buildReport(
  error: unknown,
  kind: ErrorReport['kind'],
  context: { tool: string | undefined; origin: string; path: string; userAgent: string },
): ErrorReport {
  const asError = error instanceof Error ? error : undefined;
  return {
    v: 1,
    kind,
    tool: context.tool,
    name: asError?.name.slice(0, 60) ?? typeof error,
    message: scrubMessage(asError?.message ?? String(error)),
    stack: scrubStack(asError?.stack, context.origin),
    page: context.path.slice(0, 100),
    browser: browserFamily(context.userAgent),
  };
}

let currentTool: string | undefined;
let sent = 0;
const seen = new Set<string>();

function enabled(): boolean {
  // Off in development, and in builds made with PUBLIC_ERROR_REPORTING=off (e.g. the Business edition).
  return !import.meta.env.DEV && import.meta.env.PUBLIC_ERROR_REPORTING !== 'off' && typeof navigator !== 'undefined';
}

/** Sends a scrubbed report for a bug. Safe to call anywhere; it never throws. */
export function reportError(error: unknown, kind: ErrorReport['kind'] = 'error'): void {
  try {
    if (!enabled() || sent >= MAX_REPORTS_PER_PAGE) return;
    const report = buildReport(error, kind, {
      tool: currentTool,
      origin: location.origin,
      path: location.pathname,
      userAgent: navigator.userAgent,
    });
    const key = `${report.name}:${report.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    sent++;
    navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify(report)], { type: 'application/json' }));
  } catch {
    // Reporting must never break the page.
  }
}

/** Reports uncaught errors on a tool page. Call once when the tool mounts. */
export function installErrorReporting(tool: string): void {
  currentTool = tool;
  if (typeof window === 'undefined' || (window as { __leaflockReporting?: boolean }).__leaflockReporting) return;
  (window as { __leaflockReporting?: boolean }).__leaflockReporting = true;
  window.addEventListener('error', (event) => reportError(event.error ?? event.message, 'error'));
  window.addEventListener('unhandledrejection', (event) => reportError(event.reason, 'unhandled'));
}
