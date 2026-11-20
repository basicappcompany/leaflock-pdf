import { useEffect, useState, type SubmitEvent } from 'react';
import type { Messages } from '../../i18n';
import { localePath } from '../../lib/localePath';
import { safeNext } from '../../lib/safeNext';
import { Field } from '../ui/fields';
import { useSession } from '../ui/useSession';

type Status =
  | { state: 'idle' }
  | { state: 'sending' }
  | { state: 'loggingIn' }
  | { state: 'sent' }
  | { state: 'error'; message: string };

const QUERY_ERRORS: Record<string, keyof Messages['auth']['login']> = {
  invalid: 'errorInvalid',
  expired: 'errorExpired',
  google_failed: 'errorGoogle',
  google_unverified: 'errorGoogleUnverified',
  google_unavailable: 'errorGoogleUnavailable',
};

/** Where this visit asked to go after signing in (a page that sent the visitor here), or the account page. */
function destination(): string {
  const next = typeof window === 'undefined' ? null : safeNext(new URLSearchParams(window.location.search).get('next'));
  return next ?? localePath('/account/');
}

function initialStatus(t: Messages['auth']['login']): Status {
  if (typeof window === 'undefined') return { state: 'idle' };
  const error = new URLSearchParams(window.location.search).get('error');
  const key = error ? QUERY_ERRORS[error] : undefined;
  return key ? { state: 'error', message: t[key] } : { state: 'idle' };
}

export default function LoginForm({ t }: { t: Messages['auth']['login'] }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // The link is the default: it needs no password and also creates the account. Password sign-in is opt-in.
  const [mode, setMode] = useState<'link' | 'password'>('link');
  const [status, setStatus] = useState<Status>(() => initialStatus(t));
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const session = useSession();
  const busy = status.state === 'sending' || status.state === 'loggingIn';

  // Already signed in: this page has nothing to offer, so go where signing in would have gone. If the server says there is
  // no session after all (an old hint cookie), clear the pre-paint mark that is holding the form back and show it.
  useEffect(() => {
    if (session.state === 'in') window.location.replace(destination());
    else if (session.state === 'out') delete document.documentElement.dataset.signedIn;
  }, [session.state]);

  // Only offer Google if the server actually has credentials for it.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/methods')
      .then((response) => (response.ok ? (response.json() as Promise<{ google?: boolean }>) : null))
      .then((methods) => {
        if (!cancelled) setGoogleEnabled(methods?.google === true);
      })
      .catch(() => {
        /* Leave it hidden: a button that can't work is worse than no button. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Password sign-in: the account and its address already exist. */
  async function logIn(event: SubmitEvent) {
    event.preventDefault();
    setStatus({ state: 'loggingIn' });
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        window.location.href = destination();
        return;
      }
      setStatus({
        state: 'error',
        message: response.status === 429 ? t.errorRateLimited : t.errorCredentials,
      });
    } catch {
      setStatus({ state: 'error', message: t.errorGeneric });
    }
  }

  /** The passwordless way in, which also creates the account the first time. */
  async function sendLink() {
    setStatus({ state: 'sending' });
    try {
      const response = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, next: safeNext(new URLSearchParams(window.location.search).get('next')) }),
      });
      if (response.status === 429) {
        setStatus({ state: 'error', message: t.errorRateLimited });
      } else if (!response.ok) {
        setStatus({ state: 'error', message: t.errorGeneric });
      } else {
        setStatus({ state: 'sent' });
      }
    } catch {
      setStatus({ state: 'error', message: t.errorGeneric });
    }
  }

  if (status.state === 'sent') {
    return (
      <div className="auth-card">
        <p className="auth-sent" role="status">
          <span>{t.sent}</span>
          <span className="auth-sent__to">
            {t.sentTo} {email}
          </span>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="auth-card">
        {googleEnabled && (
          <>
            <a className="secondary-button auth-google" href="/api/auth/google/start">
              {t.google}
            </a>
            <p className="auth-divider">
              <span>{t.or}</span>
            </p>
          </>
        )}

        <form
          className="auth-form"
          onSubmit={
            mode === 'password'
              ? logIn
              : (event) => {
                  event.preventDefault();
                  void sendLink();
                }
          }
        >
          <Field label={t.emailLabel}>
            {(id, describedBy) => (
              <input
                id={id}
                aria-describedby={describedBy}
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            )}
          </Field>

          {mode === 'password' && (
            <Field label={t.passwordLabel}>
              {(id, describedBy) => (
                <input
                  id={id}
                  aria-describedby={describedBy}
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              )}
            </Field>
          )}

          {mode === 'link' ? (
            <>
              <button type="submit" className="primary-button" disabled={busy}>
                {status.state === 'sending' ? t.sending : t.submit}
              </button>
              <p className="auth-note">{t.linkHint}</p>
              <button type="button" className="link-button" disabled={busy} onClick={() => setMode('password')}>
                {t.usePassword}
              </button>
            </>
          ) : (
            <>
              <button type="submit" className="primary-button" disabled={busy}>
                {status.state === 'loggingIn' ? t.loggingIn : t.logIn}
              </button>
              <button type="button" className="link-button" disabled={busy || !email} onClick={sendLink}>
                {status.state === 'sending' ? t.sending : t.useLink}
              </button>
            </>
          )}

          {status.state === 'error' && (
            <p className="error" role="alert">
              {status.message}
            </p>
          )}
        </form>
      </div>
      {mode === 'password' && <p className="auth-note">{t.noPassword}</p>}
    </>
  );
}
