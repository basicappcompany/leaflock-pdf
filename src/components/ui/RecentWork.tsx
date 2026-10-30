import { useCallback, useEffect, useState } from 'react';
import { format, plural, type CommonMessages } from '../../i18n';
import { describeRemaining } from '../../lib/retention/durations';
import { clearShelf, listShelf, readShelfFile, removeFromShelf, type ShelfEntry } from '../../lib/retention/shelf';
import { formatBytes } from './formatBytes';

interface Props {
  common: CommonMessages;
  locale: string;
}

/**
 * The files this visitor chose to keep, with the time each has left.
 *
 * Mounted on tool pages rather than only on `/dashboard`, because the shelf needs no
 * account: the dashboard sends a signed-out visitor to the login page, so putting the
 * only entrance there would have made a device-local feature account-only — the opposite
 * of the argument for building it.
 *
 * Renders nothing at all when the shelf is empty. A permanent empty panel on every tool
 * page would advertise a feature most visitors never turn on.
 */
export function RecentWork({ common, locale }: Props) {
  const t = common.retention;
  const [entries, setEntries] = useState<ShelfEntry[] | null>(null);

  const refresh = useCallback(() => {
    void listShelf().then(setEntries);
  }, []);

  useEffect(() => {
    refresh();
    // Re-read when the tab comes back: the sweep runs on read, so a tab left open for an
    // hour would otherwise keep showing a file that has since been deleted.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  async function download(entry: ShelfEntry) {
    const blob = await readShelfFile(entry.id);
    if (!blob) {
      // Expired between the render and the click. Re-reading shows it gone.
      refresh();
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = entry.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  function unitFor(remaining: { unit: 'minute' | 'hour' | 'day'; value: number }): string {
    const forms = remaining.unit === 'minute' ? t.unitMinute : remaining.unit === 'hour' ? t.unitHour : t.unitDay;
    return plural(locale, forms, remaining.value);
  }

  if (!entries || entries.length === 0) return null;

  return (
    <section className="shelf">
      <h2 className="shelf__heading">{t.shelfHeading}</h2>
      <p className="muted">{t.shelfNote}</p>
      <ul className="shelf__files">
        {entries.map((entry) => {
          const remaining = describeRemaining(entry.expiresAt, Date.now());
          return (
            <li key={entry.id}>
              <button type="button" className="secondary-button" onClick={() => void download(entry)}>
                {format(common.actions.downloadFile, { name: entry.name })}
              </button>
              <span className="muted">{formatBytes(entry.size, locale)}</span>
              <span className="muted">
                {remaining.expired ? '' : format(t.remaining, { value: remaining.value, unit: unitFor(remaining) })}
              </span>
              <button
                type="button"
                className="link-button"
                aria-label={format(t.removeFile, { name: entry.name })}
                onClick={() => void removeFromShelf(entry.id).then(refresh)}
              >
                {t.remove}
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="link-button" onClick={() => void clearShelf().then(refresh)}>
        {t.clearAll}
      </button>
    </section>
  );
}
