import { useEffect, useState } from 'react';
import { format, plural, type CommonMessages } from '../../i18n';
import { getCachedPlan, isPaidPlan } from '../../lib/planCache';
import { getActiveTool } from '../../lib/recentActivity';
import type { OutputFile } from '../../lib/pdf/types';
import {
  CUSTOM_MAX_MINUTES,
  CUSTOM_MIN_MINUTES,
  RETENTION_PRESETS,
  isValidCustomMinutes,
  presetMinutes,
  type RetentionPresetId,
} from '../../lib/retention/durations';
import { keepFiles, shelfAvailable } from '../../lib/retention/shelf';

interface Props {
  files: OutputFile[];
  common: CommonMessages;
  locale: string;
}

type Choice = 'off' | RetentionPresetId | 'custom';

/**
 * Offers to keep a finished result on the device.
 *
 * Mounted inside `ResultFiles`, which every tool renders, so this reaches all of them
 * without forty edits — the same single-chokepoint trick `ImageList` uses to decode HEIC
 * wherever images are accepted.
 *
 * **Off is the default and stays the default.** The choice is not remembered between
 * runs: a retention preference that persisted would mean a later file gets kept because
 * of a decision made about an earlier one, which is how a privacy feature becomes a
 * privacy problem. Each result is asked about on its own.
 */
export function RetentionPicker({ files, common, locale }: Props) {
  const t = common.retention;
  const [available, setAvailable] = useState<boolean | null>(null);
  const [choice, setChoice] = useState<Choice>('off');
  const [customMinutes, setCustomMinutes] = useState('60');
  const [saved, setSaved] = useState<{ count: number; duration: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const isPro = isPaidPlan(getCachedPlan());

  useEffect(() => {
    let cancelled = false;
    void shelfAvailable().then((ok) => {
      if (!cancelled) setAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // A new result is a new decision: never carry the previous answer, or its confirmation.
  useEffect(() => {
    setChoice('off');
    setSaved(null);
    setFailed(false);
  }, [files]);

  const customValue = Number(customMinutes);
  const customOk = isValidCustomMinutes(customValue);
  const ceilingLabel = plural(locale, t.unitDay, CUSTOM_MAX_MINUTES / (24 * 60));
  const maxLabel = `${CUSTOM_MAX_MINUTES / (24 * 60)} ${ceilingLabel}`;

  function labelFor(id: RetentionPresetId): string {
    return id === '5m' ? t.preset5m : id === '1h' ? t.preset1h : t.preset24h;
  }

  async function keep(next: Choice) {
    setChoice(next);
    setFailed(false);
    setSaved(null);
    if (next === 'off') return;
    if (next === 'custom') return; // Waits for a valid number and an explicit confirm.
    await store(presetMinutes(next), labelFor(next));
  }

  async function store(minutes: number, duration: string) {
    const tool = getActiveTool();
    if (!tool) return;
    const kept = await keepFiles(tool, files, minutes);
    if (kept.length === 0) {
      setFailed(true);
      return;
    }
    setSaved({ count: kept.length, duration });
  }

  if (available === false) {
    return (
      <p className="retention__note muted" role="status">
        {t.unavailable}
      </p>
    );
  }
  if (available === null) return null;

  return (
    <div className="retention">
      <fieldset className="retention__choices">
        <legend className="retention__heading">{t.keepHeading}</legend>
        <p className="retention__note muted">{t.keepNote}</p>
        <div className="retention__options">
          <label>
            <input
              type="radio"
              name="retention"
              value="off"
              checked={choice === 'off'}
              onChange={() => void keep('off')}
            />
            {t.off}
          </label>
          {RETENTION_PRESETS.map((preset) => (
            <label key={preset.id}>
              <input
                type="radio"
                name="retention"
                value={preset.id}
                checked={choice === preset.id}
                onChange={() => void keep(preset.id)}
              />
              {labelFor(preset.id)}
            </label>
          ))}
          <label>
            <input
              type="radio"
              name="retention"
              value="custom"
              checked={choice === 'custom'}
              disabled={!isPro}
              onChange={() => void keep('custom')}
            />
            {t.custom}
            {!isPro && <span className="muted"> — {t.customPro}</span>}
          </label>
        </div>
      </fieldset>

      {choice === 'custom' && isPro && (
        <div className="retention__custom">
          <label htmlFor="retention-custom-minutes">{format(t.customLabel, { max: maxLabel })}</label>
          <input
            id="retention-custom-minutes"
            type="number"
            inputMode="numeric"
            min={CUSTOM_MIN_MINUTES}
            max={CUSTOM_MAX_MINUTES}
            step={1}
            value={customMinutes}
            onChange={(event) => {
              setCustomMinutes(event.target.value);
              setSaved(null);
            }}
            aria-describedby="retention-custom-help"
          />
          <button
            type="button"
            className="secondary-button"
            disabled={!customOk}
            onClick={() => void store(customValue, `${customValue} ${plural(locale, t.unitMinute, customValue)}`)}
          >
            {t.custom}
          </button>
          <p id="retention-custom-help" className="muted">
            {customOk
              ? t.customCeiling
              : format(t.customInvalid, { min: CUSTOM_MIN_MINUTES, max: CUSTOM_MAX_MINUTES })}
          </p>
        </div>
      )}

      {saved && (
        <p className="retention__saved" role="status">
          {format(plural(locale, t.kept, saved.count), { count: saved.count, duration: saved.duration })}
        </p>
      )}
      {failed && (
        <p className="retention__saved muted" role="status">
          {t.keptFailed}
        </p>
      )}
    </div>
  );
}
