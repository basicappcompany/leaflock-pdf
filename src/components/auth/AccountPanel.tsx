import type { Messages } from '../../i18n';
import { useSession } from '../ui/useSession';
import DataSection from './DataSection';
import PasswordSection from './PasswordSection';

export default function AccountPanel({ t }: { t: Messages['auth']['account'] }) {
  const session = useSession();

  if (session.state === 'loading') {
    return (
      <p className="notice" role="status">
        {t.loading}
      </p>
    );
  }

  if (session.state === 'out') {
    if (typeof window !== 'undefined') window.location.href = '/login/';
    return null;
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login/';
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
            <a className="primary-button" href="/pricing/">
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
