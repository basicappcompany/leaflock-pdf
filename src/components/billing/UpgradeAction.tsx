import { useEffect, useState } from 'react';
import type { Messages } from '../../i18n';
import { format } from '../../i18n/format';

type Copy = Pick<
  Messages['pricing']['member'],
  'checking' | 'upgrade' | 'confirmCharge' | 'confirmRenews' | 'confirm' | 'cancel' | 'working' | 'pending' | 'unavailable' | 'failed'
>;

type Quote = { amount: number; currency: string; renewsOn: string | null };
type View =
  | { name: 'checking' }
  | { name: 'hidden' }
  | { name: 'unavailable' }
  | { name: 'pending' }
  | ({ name: 'ready' } & Quote)
  | ({ name: 'confirm' } & Quote)
  | { name: 'working' }
  | ({ name: 'failed' } & Quote);

/** How often to look for the plan change while a charge is being confirmed, and for how long. */
const POLL_MS = 8000;
const POLL_FOR_MS = 10 * 60 * 1000;

function money(amount: number, currency: string, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
  return formatter.format(amount / 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 2));
}

/**
 * The one dynamic part of a member's pricing panel: the button that upgrades them, and everything that
 * has to be true before it is pressed.
 *
 * - `upgrade` (a Pro subscriber): asks the server what is possible and what it would cost. Nothing
 *   asks for payment on the way, because the charge goes to the card already on the subscription, so
 *   the exact amount is shown and must be confirmed. If a charge is already being confirmed by the bank
 *   (an Indian card can take up to two days) it says so instead of offering the button again, and
 *   watches for the plan to change.
 * - `checkout` (a ten-year Pro holder, who has no subscription to change): Practice is a new purchase,
 *   so the button goes to the payment provider's own page, which shows the price.
 *
 * The space is reserved by CSS (.upgrade-slot), so the page does not jump when it answers.
 */
export default function UpgradeAction({ kind, t, locale }: { kind: 'upgrade' | 'checkout'; t: Copy; locale: string }) {
  const [view, setView] = useState<View>(kind === 'upgrade' ? { name: 'checking' } : { name: 'ready', amount: 0, currency: 'USD', renewsOn: null });

  useEffect(() => {
    if (kind !== 'upgrade') return;
    let cancelled = false;
    fetch('/api/billing/upgrade', { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? (response.json() as Promise<{ state: string } & Partial<Quote>>) : null))
      .then((body) => {
        if (cancelled) return;
        if (!body) return setView({ name: 'hidden' });
        if (body.state === 'pending') return setView({ name: 'pending' });
        if (body.state === 'unavailable') return setView({ name: 'unavailable' });
        if (body.state === 'ready' && typeof body.amount === 'number' && body.currency) {
          return setView({ name: 'ready', amount: body.amount, currency: body.currency, renewsOn: body.renewsOn ?? null });
        }
        setView({ name: 'hidden' });
      })
      .catch(() => !cancelled && setView({ name: 'hidden' }));
    return () => {
      cancelled = true;
    };
  }, [kind]);

  // While the charge is being confirmed, look for the plan to change and reload when it does.
  useEffect(() => {
    if (view.name !== 'pending') return;
    const stopAt = Date.now() + POLL_FOR_MS;
    const timer = window.setInterval(() => {
      if (Date.now() > stopAt) return window.clearInterval(timer);
      fetch('/api/auth/me')
        .then((response) => (response.ok ? (response.json() as Promise<{ plan?: string } | null>) : null))
        .then((me) => {
          if (me?.plan && me.plan !== 'pro') window.location.reload();
        })
        .catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [view.name]);

  async function run() {
    // What to go back to if it fails, so the member can try again without the page asking Dodo again.
    const quote: Quote = view.name === 'confirm' || view.name === 'ready' ? view : { amount: 0, currency: 'USD', renewsOn: null };
    setView({ name: 'working' });
    try {
      const response = await fetch(kind === 'upgrade' ? '/api/billing/upgrade' : '/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'practiceYearly' }),
      });
      const body = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (response.ok && body?.url) {
        window.location.href = body.url;
        return;
      }
      if (response.ok) return setView({ name: 'pending' });
      if (response.status === 409 && body?.error === 'pending') return setView({ name: 'pending' });
      setView({ name: 'failed', ...quote });
    } catch {
      setView({ name: 'failed', ...quote });
    }
  }

  const body = (() => {
    switch (view.name) {
      case 'checking':
        return <p className="muted">{t.checking}</p>;
      case 'hidden':
        return null;
      case 'unavailable':
        return <p className="muted">{t.unavailable}</p>;
      case 'pending':
        return <p role="status">{t.pending}</p>;
      case 'working':
        return <p className="muted">{t.working}</p>;
      case 'failed':
        return (
          <>
            <p className="error" role="alert">
              {t.failed}
            </p>
            <button type="button" className="primary-button" onClick={() => setView({ ...view, name: 'ready' })}>
              {t.upgrade}
            </button>
          </>
        );
      case 'ready':
        return (
          <button
            type="button"
            className="primary-button"
            onClick={() => (kind === 'upgrade' ? setView({ ...view, name: 'confirm' }) : void run())}
          >
            {t.upgrade}
          </button>
        );
      case 'confirm': {
        const renews = view.renewsOn ? new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(view.renewsOn)) : '';
        return (
          <>
            <p>{format(t.confirmCharge, { amount: money(view.amount, view.currency, locale) })}</p>
            {renews && <p className="muted">{format(t.confirmRenews, { date: renews })}</p>}
            <div className="member-panel__actions">
              <button type="button" className="primary-button" onClick={() => void run()}>
                {t.confirm}
              </button>
              <button type="button" className="secondary-button" onClick={() => setView({ ...view, name: 'ready' })}>
                {t.cancel}
              </button>
            </div>
          </>
        );
      }
    }
  })();

  return (
    <div className="upgrade-slot" aria-live="polite" aria-busy={view.name === 'checking' || view.name === 'working'}>
      {body}
    </div>
  );
}
