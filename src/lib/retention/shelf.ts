/**
 * The recent-work shelf: files the visitor explicitly chose to keep, on their own device.
 *
 * Nothing here is ever sent anywhere. There is no server copy, so the shelf does not
 * follow the visitor to another browser — the UI says so rather than implying it. Server
 * retention for Pro is roadmap item 2.12 and is a separate mechanism with its own
 * encryption and legal surface; this file has no network code at all, which is what keeps
 * `connect-src 'self'` an honest proof of the claim for everything it stores.
 *
 * **IndexedDB rather than OPFS**, which is what `docs/roadmap.md` Phase 2 item 5 first
 * proposed, for three reasons found while probing it:
 *
 * 1. OPFS's write path differs by engine — `createWritable()` in Chromium against a
 *    worker-only `createSyncAccessHandle()` elsewhere — and Safari and iOS are exactly the
 *    engines this project cannot test locally. Choosing the API with one write path
 *    everywhere removes a risk that could only have been discovered by a user.
 * 2. A finished job's bytes are already a `Uint8Array` in memory, so OPFS's streaming
 *    advantage buys nothing here.
 * 3. IndexedDB stores a `Blob` directly, and its eviction behaviour is the same one
 *    `recentActivity.ts` already reasons about for this product.
 *
 * Every call degrades to "no shelf" rather than throwing: a private window, blocked site
 * data or a browser with IndexedDB disabled must leave the tools themselves working.
 */

import type { OutputFile } from '../pdf/types';
import type { ToolId } from '../../tools/registry';
import { expiresAt, hasExpired } from './durations';

const DB_NAME = 'leaflock-shelf';
const DB_VERSION = 1;
const STORE = 'files';

export interface ShelfEntry {
  id: string;
  name: string;
  type: string;
  size: number;
  tool: ToolId;
  savedAt: number;
  expiresAt: number;
}

/** A stored row: the metadata above plus the bytes themselves. */
interface StoredEntry extends ShelfEntry {
  blob: Blob;
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      // Accessing indexedDB itself throws in some private-browsing configurations.
      return resolve(null);
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        // Sweeping is a range scan over this index, not a full read of every blob: the
        // point of the sweep is to delete expired files without loading them first.
        store.createIndex('expiresAt', 'expiresAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function finish(transaction: IDBTransaction): Promise<boolean> {
  return new Promise((resolve) => {
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => resolve(false);
    transaction.onabort = () => resolve(false);
  });
}

function request<T>(source: IDBRequest<T>): Promise<T | null> {
  return new Promise((resolve) => {
    source.onsuccess = () => resolve(source.result);
    source.onerror = () => resolve(null);
  });
}

/** Whether this browser can keep anything at all, so the UI can hide the option. */
export async function shelfAvailable(): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  db.close();
  return true;
}

/**
 * Deletes everything past its expiry.
 *
 * Called before every read, which is what makes the expiry real rather than cosmetic:
 * there is no background timer in a closed tab, so "expired" has to mean "removed the
 * next time anything looks", and nothing expired is ever returned to a caller.
 */
export async function sweepExpired(now = Date.now()): Promise<number> {
  const db = await openDb();
  if (!db) return 0;
  try {
    const transaction = db.transaction(STORE, 'readwrite');
    const index = transaction.objectStore(STORE).index('expiresAt');
    let removed = 0;
    // Everything with an expiry at or before now, without touching the rest.
    const cursorRequest = index.openCursor(IDBKeyRange.upperBound(now));
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      cursor.delete();
      removed += 1;
      cursor.continue();
    };
    await finish(transaction);
    return removed;
  } finally {
    db.close();
  }
}

/** What is on the shelf, newest first, with anything expired already gone. */
export async function listShelf(now = Date.now()): Promise<ShelfEntry[]> {
  await sweepExpired(now);
  const db = await openDb();
  if (!db) return [];
  try {
    const transaction = db.transaction(STORE, 'readonly');
    const rows = await request(transaction.objectStore(STORE).getAll() as IDBRequest<StoredEntry[]>);
    await finish(transaction);
    return (rows ?? [])
      .filter((row) => !hasExpired(row.expiresAt, now))
      .sort((a, b) => b.savedAt - a.savedAt)
      .map(({ blob: _blob, ...entry }) => entry);
  } finally {
    db.close();
  }
}

/** One kept file's bytes, or null if it expired or was removed meanwhile. */
export async function readShelfFile(id: string, now = Date.now()): Promise<Blob | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    const transaction = db.transaction(STORE, 'readonly');
    const row = await request(transaction.objectStore(STORE).get(id) as IDBRequest<StoredEntry | undefined>);
    await finish(transaction);
    if (!row || hasExpired(row.expiresAt, now)) return null;
    return row.blob;
  } finally {
    db.close();
  }
}

/**
 * Keeps a finished job's outputs for `minutes`.
 *
 * Returns the entries actually written, so a full or unavailable store shows the visitor
 * nothing rather than a shelf that silently lost half their files. Each id carries the
 * save time so the list has a stable order even when two files land in the same tick.
 */
export async function keepFiles(
  tool: ToolId,
  files: readonly OutputFile[],
  minutes: number,
  now = Date.now(),
): Promise<ShelfEntry[]> {
  const db = await openDb();
  if (!db) return [];
  try {
    const expiry = expiresAt(minutes, now);
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    const written: ShelfEntry[] = [];
    files.forEach((file, index) => {
      const entry: StoredEntry = {
        id: `${now}-${index}-${Math.random().toString(36).slice(2, 10)}`,
        name: file.name,
        type: file.type,
        size: file.bytes.byteLength,
        tool,
        savedAt: now,
        expiresAt: expiry,
        blob: new Blob([file.bytes], { type: file.type }),
      };
      store.put(entry);
      const { blob: _blob, ...metadata } = entry;
      written.push(metadata);
    });
    return (await finish(transaction)) ? written : [];
  } finally {
    db.close();
  }
}

export async function removeFromShelf(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(id);
    await finish(transaction);
  } finally {
    db.close();
  }
}

export async function clearShelf(): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).clear();
    await finish(transaction);
  } finally {
    db.close();
  }
}
