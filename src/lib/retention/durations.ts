/**
 * How long a kept file stays on this device.
 *
 * Pure arithmetic, no storage and no DOM, so the picker's preview and the sweep that
 * actually deletes things cannot disagree about when something expires — the same split
 * `src/lib/organize/pageLabels.ts` uses for page-label validation.
 *
 * The durations are short on purpose. `src/lib/recentActivity.ts` records only a tool id
 * and a timestamp precisely because a list of document names on a shared computer is a new
 * place for someone else to read what the user has been working on. Keeping the files
 * themselves reopens that exposure, so it is bounded three ways: opt-in per result, never
 * on by default, and measured in minutes and hours rather than weeks.
 */

export const RETENTION_PRESETS = [
  { id: '5m', minutes: 5 },
  { id: '1h', minutes: 60 },
  { id: '24h', minutes: 24 * 60 },
] as const;

export type RetentionPresetId = (typeof RETENTION_PRESETS)[number]['id'];

/**
 * Bounds on a Pro custom duration.
 *
 * The ceiling is seven days, and it is a platform limit rather than a pricing one: the
 * browser evicts IndexedDB under storage pressure without asking us, so a longer promise
 * is one we cannot keep on the device alone. Longer retention is what server support
 * (roadmap 2.12) is for — until then the UI says seven days is the most this can honour.
 */
export const CUSTOM_MIN_MINUTES = 1;
export const CUSTOM_MAX_MINUTES = 7 * 24 * 60;

export function presetMinutes(id: RetentionPresetId): number {
  const preset = RETENTION_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`unknown retention preset: ${id}`);
  return preset.minutes;
}

/** Whether a typed custom duration is one we can actually honour. */
export function isValidCustomMinutes(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= CUSTOM_MIN_MINUTES &&
    value <= CUSTOM_MAX_MINUTES
  );
}

/** When something kept now should disappear. */
export function expiresAt(minutes: number, now: number): number {
  return now + minutes * 60_000;
}

export function hasExpired(expiry: number, now: number): boolean {
  return expiry <= now;
}

export type Remaining =
  | { expired: true }
  | { expired: false; unit: 'minute' | 'hour' | 'day'; value: number };

/**
 * How much longer something lasts, in the largest useful unit.
 *
 * Rounds **down** with a floor of one, so the label never promises time that has already
 * gone and never reads "0 minutes left" — a file with thirty seconds to live says one
 * minute, which is what the copy's "about" is for.
 */
export function describeRemaining(expiry: number, now: number): Remaining {
  const ms = expiry - now;
  if (ms <= 0) return { expired: true };
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return { expired: false, unit: 'minute', value: Math.max(1, minutes) };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { expired: false, unit: 'hour', value: hours };
  return { expired: false, unit: 'day', value: Math.floor(hours / 24) };
}
