import { useState } from 'react';
import type { Messages } from '../../i18n';
import { format } from '../../i18n/format';
import { useSession } from '../ui/useSession';

type PlanNames = { pro: string; lifetime: string; practice: string; business: string };

/**
 * What a signed-in member on a paid plan sees at the top of the pricing page: which plan they
 * have, when it starts, and how to upgrade. Rendered nothing for a visitor or a free account, who
 * keep the launch offer and the plan cards (the CSS in styles/early-notice.css hides those for a
 * paying member, keyed on the `data-plan` that useSession() puts on <html>).
 *
 * The dates are compared at run time, not at build time, so the wording is right the day the plans
 * start even on a page that was built earlier.
 */
export default function MemberPanel({
  t,
  names,
  plansStartAt,
  startDate,
  endDate,
  offerPrice,
  standardPrice,
  businessHref,
}: {
  t: Messages['pricing']['member'];
  names: PlanNames;
  plansStartAt: number;
  startDate: string;
  endDate: string;
  /** Practice for the first year during the launch offer, formatted. */
  offerPrice: string;
  standardPrice: string;
  businessHref: string;
}) {
  const session = useSession();
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');

  if (session.state !== 'in' || session.plan === 'free') return null;
  const plan = session.plan;
  const started = Date.now() >= plansStartAt;
  const upgradable = plan === 'pro' || plan === 'lifetime';

  async function upgrade() {
    setStatus('working');
    try {
      // A Pro subscriber changes plan on the subscription they have; a ten-year holder has none, so
      // Practice is a new purchase for them.
      const response = await fetch(plan === 'pro' ? '/api/billing/upgrade' : '/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'practiceYearly' }),
      });
      const body = (await response.json().catch(() => null)) as { url?: string } | null;
      if (response.ok && body?.url) {
        window.location.href = body.url;
        return;
      }
      setStatus(response.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="member-panel" aria-live="polite">
      <h2>{format(t.planLabel, { plan: names[plan] })}</h2>
      <p>{plan === 'business' ? '' : started ? t.active : format(t.startsOn, { startDate })}</p>
      {upgradable ? (
        <>
          <h3>{t.upgradeHeading}</h3>
          <p>{t.upgradeBody}</p>
          <p>
            {started
              ? format(t.upgradePrice, { price: standardPrice })
              : format(t.upgradePriceOffer, { price: offerPrice, endDate, standard: standardPrice })}
          </p>
          {plan === 'pro' && <p className="muted">{t.upgradeDifference}</p>}
          {status === 'done' ? (
            <p role="status">{t.upgraded}</p>
          ) : (
            <button type="button" className="primary-button" disabled={status === 'working'} onClick={upgrade}>
              {status === 'working' ? t.upgrading : t.upgrade}
            </button>
          )}
          {status === 'error' && (
            <p className="error" role="alert">
              {t.failed}
            </p>
          )}
        </>
      ) : plan === 'practice' ? (
        <p>
          {t.top} <a href={businessHref}>→</a>
        </p>
      ) : null}
    </section>
  );
}
