/**
 * Starred (favourite) tools.
 *
 * Two places, one list:
 *   - This browser: localStorage, so it is remembered here with no account, and works offline.
 *   - The account, when signed in: GET and PUT /api/starred, so the same list follows the person
 *     to every browser and device.
 *
 * Privacy: only registry tool ids and their order, never a file, a file name or page text. The
 * server copy exists only for signed-in people; the local copy never leaves the browser unless
 * they sign in.
 *
 * Every call degrades to "local only" rather than throwing: a private window, blocked site
 * data, a signed-out session or an unreachable server must leave the tools themselves, and the
 * list on this page, working.
 *
 * How the two stay in step (the part worth reading before changing anything):
 *   - Starring or unstarring writes locally at once, and, when signed in, records the change as
 *     `pending` until it has reached the server. Syncing then applies the pending changes on top
 *     of what the server holds and sends the result, so a change made on another device in the
 *     meantime is kept, and an unstar is never undone by a stale copy.
 *   - The very first sync on a browser has no account recorded yet, so everything starred here
 *     (including before signing in) counts as an addition: signing in does not lose the list.
 *   - A browser that last synced as a different account takes that account's list and discards
 *     the old one's pending changes, so one person's stars never land in another person's account
 *     on a shared computer.
 */

import { tools, type ToolId } from '../tools/registry';

const KEY = 'leaflock-starred';
const EVENT = 'leaflock:starred';
export const MAX_STARRED = 100;

/** Must match SIGNED_IN_HINT_COOKIE_NAME in src/lib/server/session.ts (duplicated: that module is server-only). */
const SIGNED_IN_HINT_COOKIE = 'leaflock_signed_in';

interface Stored {
  /** Starred tool ids, newest first. */
  tools: string[];
  /** Opaque name of the account this list was last synced with. */
  account?: string | undefined;
  /** Changes made while signed in that the server has not confirmed yet. */
  pending?: { add: string[]; remove: string[] } | undefined;
}

function isToolId(value: unknown): value is ToolId {
  return typeof value === 'string' && tools.some((tool) => tool.id === value);
}

function unique(list: string[]): string[] {
  return [...new Set(list)];
}

function clean(list: unknown): string[] {
  return Array.isArray(list) ? unique(list.filter(isToolId)).slice(0, MAX_STARRED) : [];
}

function readStored(): Stored {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (typeof parsed !== 'object' || parsed === null) return { tools: [] };
    const record = parsed as Record<string, unknown>;
    const pending = record['pending'] as { add?: unknown; remove?: unknown } | undefined;
    return {
      tools: clean(record['tools']),
      account: typeof record['account'] === 'string' ? record['account'] : undefined,
      pending: pending ? { add: clean(pending.add), remove: clean(pending.remove) } : undefined,
    };
  } catch {
    return { tools: [] };
  }
}

function writeStored(stored: Stored): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    /* Private window or blocked site data: the list lasts for this page only. */
  }
}

function announce(): void {
  try {
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* No window (prerender): nothing is listening. */
  }
}

function hasSignedInHint(): boolean {
  try {
    return document.cookie.split('; ').some((entry) => entry.startsWith(`${SIGNED_IN_HINT_COOKIE}=`));
  } catch {
    return false;
  }
}

/** The starred tools, newest first. */
export function readStarred(): ToolId[] {
  return readStored().tools.filter(isToolId);
}

export function isStarred(id: ToolId): boolean {
  return readStored().tools.includes(id);
}

/** Stars the tool if it is not starred, removes the star if it is. Returns whether it is starred now. */
export function toggleStarred(id: ToolId): boolean {
  const stored = readStored();
  const had = stored.tools.includes(id);
  const next = had ? stored.tools.filter((tool) => tool !== id) : [id, ...stored.tools].slice(0, MAX_STARRED);
  const updated: Stored = { ...stored, tools: next };
  if (hasSignedInHint()) {
    const pending = stored.pending ?? { add: [], remove: [] };
    updated.pending = had
      ? { add: pending.add.filter((tool) => tool !== id), remove: unique([id, ...pending.remove]) }
      : { add: unique([id, ...pending.add]), remove: pending.remove.filter((tool) => tool !== id) };
  }
  writeStored(updated);
  announce();
  scheduleSync();
  return !had;
}

/** Calls back whenever the list changes: in this tab, or (via storage events) in another. */
export function onStarredChange(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) callback();
  };
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}

export interface MergeInput {
  /** What this browser holds, newest first. */
  local: string[];
  /** What the server holds, newest first. */
  remote: string[];
  /** The account the server answered as. */
  account: string;
  /** The account this browser last synced as, if any. */
  storedAccount?: string | undefined;
  /** Changes this browser made that the server has not confirmed. */
  pending?: { add: string[]; remove: string[] } | undefined;
}

export interface MergeResult {
  /** The list both sides should now hold, newest first. */
  tools: string[];
  /** What still differs from the server, to be retried if the upload fails. */
  pending: { add: string[]; remove: string[] };
  /** Whether the server needs to be sent the result. */
  upload: boolean;
}

/**
 * Reconciles this browser's list with the server's. Pure, so the rules above can be tested
 * without a browser or a server.
 */
export function mergeStarred({ local, remote, account, storedAccount, pending }: MergeInput): MergeResult {
  let result: string[];
  if (storedAccount && storedAccount !== account) {
    // Someone else's list was on this browser. Take the signed-in account's own, unchanged.
    result = remote;
  } else {
    // First sync on this browser (no account recorded): everything here is an addition.
    const adds = storedAccount ? (pending?.add ?? []) : local;
    const removes = new Set(storedAccount ? (pending?.remove ?? []) : []);
    const added = adds.filter((tool) => !removes.has(tool));
    result = unique([...added, ...remote.filter((tool) => !removes.has(tool))]).slice(0, MAX_STARRED);
  }
  const remoteSet = new Set(remote);
  const resultSet = new Set(result);
  const add = result.filter((tool) => !remoteSet.has(tool));
  const remove = remote.filter((tool) => !resultSet.has(tool));
  const sameOrder = result.length === remote.length && result.every((tool, i) => tool === remote[i]);
  return { tools: result, pending: { add, remove }, upload: !sameOrder };
}

let syncing = false;
let syncAgain = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function scheduleSync(): void {
  if (!hasSignedInHint()) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void syncStarred(), 600);
}

/**
 * Brings this browser and the signed-in account into agreement. Does nothing when signed out or
 * when the server cannot be reached, and never throws. Safe to call from every page: callers do
 * not need to know whether another call is already running.
 */
export async function syncStarred(): Promise<void> {
  if (!hasSignedInHint()) return;
  if (syncing) {
    syncAgain = true;
    return;
  }
  syncing = true;
  try {
    const response = await fetch('/api/starred', { credentials: 'same-origin' });
    if (!response.ok) return;
    const remote = (await response.json()) as { tools?: unknown; account?: unknown } | null;
    // A null body means the session is gone although the hint cookie lingers.
    if (!remote || typeof remote.account !== 'string') return;

    const stored = readStored();
    const merged = mergeStarred({
      local: stored.tools,
      remote: clean(remote.tools),
      account: remote.account,
      storedAccount: stored.account,
      pending: stored.pending,
    });

    let confirmed = !merged.upload;
    if (merged.upload) {
      try {
        const put = await fetch('/api/starred', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ tools: merged.tools }),
        });
        confirmed = put.ok;
      } catch {
        confirmed = false;
      }
    }
    // If the upload failed, keep what is still owed to the server so the next sync retries it.
    const before = stored.tools.join();
    writeStored({
      tools: merged.tools,
      account: remote.account,
      pending: confirmed ? { add: [], remove: [] } : merged.pending,
    });
    if (before !== merged.tools.join()) announce();
  } catch {
    /* Offline, or the server is down: the local list stands. */
  } finally {
    syncing = false;
    if (syncAgain) {
      syncAgain = false;
      scheduleSync();
    }
  }
}
