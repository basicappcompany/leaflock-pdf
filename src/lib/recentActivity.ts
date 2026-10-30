/**
 * Which tools this visitor used recently, kept on their own device.
 *
 * Privacy: only a tool id and a timestamp are stored — never a file name, a size or a
 * page count. That is deliberate and not just a nod to the rules in CLAUDE.md: a list
 * of document names sitting in localStorage would be a new place for someone else at
 * the same computer to read what the user has been working on, which is exactly the
 * exposure this product exists to avoid. So the dashboard can say "you merged something
 * nine minutes ago" and offer the tool again; it can never say which file it was.
 *
 * Nothing here is ever sent anywhere. There is no server copy, so the list does not
 * follow the user to another browser — the dashboard says so rather than implying it.
 */

import { tools, type ToolId } from '../tools/registry';

export interface RecentRun {
  tool: ToolId;
  /** Unix milliseconds of the most recent run of that tool. */
  at: number;
}

const KEY = 'leaflock-recent';
const MAX_ENTRIES = 6;
/** Two runs of the same tool this close together are one entry, not two. */
const COLLAPSE_MS = 60_000;

/** Set by ToolApp on mount, the same way installErrorReporting() tracks the tool. */
let activeTool: ToolId | undefined;

export function setActiveTool(tool: ToolId): void {
  activeTool = tool;
}

/**
 * Which tool page this is, for code shared by all of them.
 *
 * The retention picker needs it to label a kept file, and reading it here rather than
 * threading a prop through every tool is the reasoning that already made `recordRun()`
 * take no argument: forty call sites each passing their own id are forty chances to pass
 * the wrong one.
 */
export function getActiveTool(): ToolId | undefined {
  return activeTool;
}

function isToolId(value: unknown): value is ToolId {
  return typeof value === 'string' && tools.some((tool) => tool.id === value);
}

/**
 * The stored list, newest first.
 *
 * Every entry is validated rather than trusted: storage survives across releases, so a
 * tool that has since been renamed or removed would otherwise break the dashboard. The
 * accessor itself can also throw (private windows, blocked site data), so this never
 * assumes it has storage at all.
 */
export function readRecent(): RecentRun[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return [];
  }
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is RecentRun => {
        if (typeof entry !== 'object' || entry === null) return false;
        const { tool, at } = entry as Record<string, unknown>;
        return isToolId(tool) && typeof at === 'number' && Number.isFinite(at);
      })
      .sort((a, b) => b.at - a.at)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function write(entries: RecentRun[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* Private window, or site data blocked. The dashboard simply shows nothing. */
  }
}

/**
 * Records that the active tool finished a piece of work.
 *
 * Called from useTask's success path, which every tool shares. A tool that runs twice
 * in quick succession (or one whose UI runs two steps for a single user action) keeps
 * one entry with the later timestamp, so the list reflects sessions rather than clicks.
 */
export function recordRun(now = Date.now()): void {
  if (!activeTool) return;
  const tool = activeTool;
  const existing = readRecent();
  const previous = existing.find((entry) => entry.tool === tool);
  if (previous && now - previous.at < COLLAPSE_MS) {
    previous.at = now;
    write(existing.sort((a, b) => b.at - a.at));
    return;
  }
  write([{ tool, at: now }, ...existing.filter((entry) => entry.tool !== tool)].slice(0, MAX_ENTRIES));
}

export function clearRecent(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* Nothing stored means nothing to clear. */
  }
}
