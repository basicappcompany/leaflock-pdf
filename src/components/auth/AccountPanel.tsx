import { useEffect } from 'react';
import { clearOfflineAccess } from '../../lib/usage';
import { setCachedPlan } from '../../lib/planCache';
import { localePath } from '../../lib/localePath';
import type { Messages } from '../../i18n';
import { useSession } from '../ui/useSession';
import DataSection from './DataSection';
import PasswordSection from './PasswordSection';

export default function AccountPanel({ t }: { t: Messages['auth']['account'] }) {
  const session = useSession();
  const onFree = session.state === 'in' && session.plan === 'free';

  // Back from Dodo's checkout (the return URL carries `checkout`) with no plan yet: the webhook may still be on
  // its way, or may never come. Ask Dodo directly and reload once the plan is there. Nothing from the page is sent.
  useEffect(() => {
    if (!onFree || !new URLSearchParams(window.location.search).has('checkout')) return;
    let cancelled = false;
    fetch('/api/billing/refresh', { method: 'POST' })
      .then((response) => (response.ok ? (response.json() as Promise<{ plan: string }>) : null))
      .then((result) => {
        if (!cancelled && result && result.plan !== 'free') window.location.replace(localePath('/account/'));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [onFree]);

  // A redirect is a side effect, so it runs after render, never inside it.
  useEffect(() => {
    if (session.state === 'out') window.location.replace(localePath('/login/'));
  }, [session.state]);

  if (session.state === 'loading') {
    return (
      <p className="notice" role="status">
        {t.loading}
      </p>
    );
  }

  if (session.state === 'out') return null;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearOfflineAccess();
    setCachedPlan('anonymous');
    delete document.documentElement.dataset.plan;
    window.location.href = localePath('/login/');
  }

  const onFreePlan = session.plan === 'free';

  return (
    <>
      <div className="auth-card">
        <dl className="account-rows">
          <div className="account-row">
            <dt>{t.emailLabel}</dt>
            <dd>{session.email}</dd>
          </div>
          <div className="account-row">
            <dt>{t.planLabel}</dt>
            <dd>{onFreePlan ? t.plans.free : <span className="badge-pro">{t.plans[session.plan]}</span>}</dd>
          </div>
          <div className="account-row">
            <dt>{t.allowanceLabel}</dt>
            <dd>{onFreePlan ? t.allowanceFree : t.allowancePaid}</dd>
          </div>
        </dl>

        <div className="account-actions">
          {onFreePlan && (
            <a className="primary-button" href={localePath('/pricing/')}>
              {t.upgrade}
            </a>
          )}
          <button type="button" className="secondary-button" onClick={logout}>
            {t.logout}
          </button>
        </div>
      </div>

      <PasswordSection t={t} />
      <DataSection t={t} />
    </>
  );
}
