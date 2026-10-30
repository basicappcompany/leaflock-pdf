import { describe, expect, it } from 'vitest';
import {
  CUSTOM_MAX_MINUTES,
  CUSTOM_MIN_MINUTES,
  RETENTION_PRESETS,
  describeRemaining,
  expiresAt,
  hasExpired,
  isValidCustomMinutes,
  presetMinutes,
} from '../../src/lib/retention/durations';

const NOW = Date.UTC(2026, 9, 30, 12, 0, 0);
const MINUTE = 60_000;

describe('retention presets', () => {
  it('offers exactly the three the owner specified, shortest first', () => {
    expect(RETENTION_PRESETS.map((preset) => preset.id)).toEqual(['5m', '1h', '24h']);
    expect(RETENTION_PRESETS.map((preset) => preset.minutes)).toEqual([5, 60, 1440]);
  });

  it('resolves each id to its minutes', () => {
    expect(presetMinutes('5m')).toBe(5);
    expect(presetMinutes('1h')).toBe(60);
    expect(presetMinutes('24h')).toBe(1440);
  });

  it('throws on an id that is not a preset, rather than silently keeping forever', () => {
    // A typo must not fall through to "no expiry": that is the one failure mode here
    // that leaves a file on the device indefinitely.
    expect(() => presetMinutes('7d' as never)).toThrow(/unknown retention preset/);
  });
});

describe('custom durations (Pro)', () => {
  it('accepts whole minutes inside the bounds', () => {
    expect(isValidCustomMinutes(CUSTOM_MIN_MINUTES)).toBe(true);
    expect(isValidCustomMinutes(90)).toBe(true);
    expect(isValidCustomMinutes(CUSTOM_MAX_MINUTES)).toBe(true);
  });

  it('rejects anything outside them, and anything that is not a whole number', () => {
    expect(isValidCustomMinutes(0)).toBe(false);
    expect(isValidCustomMinutes(-5)).toBe(false);
    expect(isValidCustomMinutes(CUSTOM_MAX_MINUTES + 1)).toBe(false);
    expect(isValidCustomMinutes(1.5)).toBe(false);
    expect(isValidCustomMinutes(Number.NaN)).toBe(false);
    expect(isValidCustomMinutes(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidCustomMinutes('60')).toBe(false);
    expect(isValidCustomMinutes(null)).toBe(false);
    expect(isValidCustomMinutes(undefined)).toBe(false);
  });

  it('caps at seven days, which is a platform limit and not a pricing one', () => {
    // Stated in the UI copy as the longest the device alone can honour; longer is what
    // roadmap 2.12's server support is for. If this ever rises, that copy has to move too.
    expect(CUSTOM_MAX_MINUTES).toBe(7 * 24 * 60);
  });
});

describe('expiry', () => {
  it('is the chosen duration past now', () => {
    expect(expiresAt(5, NOW)).toBe(NOW + 5 * MINUTE);
    expect(expiresAt(1440, NOW)).toBe(NOW + 24 * 60 * MINUTE);
  });

  it('counts the exact expiry moment as gone, not as still valid', () => {
    const expiry = expiresAt(5, NOW);
    expect(hasExpired(expiry, expiry - 1)).toBe(false);
    expect(hasExpired(expiry, expiry)).toBe(true);
    expect(hasExpired(expiry, expiry + 1)).toBe(true);
  });
});

describe('describeRemaining', () => {
  const at = (ms: number) => describeRemaining(NOW + ms, NOW);

  it('reports expired at and past the boundary', () => {
    expect(at(0)).toEqual({ expired: true });
    expect(at(-1)).toEqual({ expired: true });
  });

  it('never says zero minutes while time is left', () => {
    // A file with thirty seconds to live has to read as a minute: "0 minutes left" on
    // something still downloadable is worse than being a little generous.
    expect(at(30_000)).toEqual({ expired: false, unit: 'minute', value: 1 });
    expect(at(1)).toEqual({ expired: false, unit: 'minute', value: 1 });
  });

  it('rounds down so it never promises time that has gone', () => {
    expect(at(5 * MINUTE)).toEqual({ expired: false, unit: 'minute', value: 5 });
    expect(at(59 * MINUTE + 59_000)).toEqual({ expired: false, unit: 'minute', value: 59 });
    expect(at(61 * MINUTE)).toEqual({ expired: false, unit: 'hour', value: 1 });
    expect(at(23 * 60 * MINUTE + 59 * MINUTE)).toEqual({ expired: false, unit: 'hour', value: 23 });
  });

  it('switches unit exactly on the hour and the day', () => {
    expect(at(60 * MINUTE)).toEqual({ expired: false, unit: 'hour', value: 1 });
    expect(at(24 * 60 * MINUTE)).toEqual({ expired: false, unit: 'day', value: 1 });
    expect(at(CUSTOM_MAX_MINUTES * MINUTE)).toEqual({ expired: false, unit: 'day', value: 7 });
  });
});
