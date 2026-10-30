import { useState, type SubmitEvent } from 'react';
import type { Messages } from '../../i18n';
import { Field } from '../ui/fields';

type Status = { state: 'idle' } | { state: 'saving' } | { state: 'saved' } | { state: 'error'; message: string };

/** Lets a signed-in account add a password, so sign-in doesn't always need an email. */
export default function PasswordSection({ t }: { t: Messages['auth']['account'] }) {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>({ state: 'idle' });

  async function save(event: SubmitEvent) {
    event.preventDefault();
    setStatus({ state: 'saving' });
    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        setPassword('');
        setStatus({ state: 'saved' });
      } else {
        setStatus({ state: 'error', message: response.status === 400 ? t.passwordTooShort : t.passwordFailed });
      }
    } catch {
      setStatus({ state: 'error', message: t.passwordFailed });
    }
  }

  return (
    <section className="account-password">
      <h2>{t.passwordHeading}</h2>
      <p className="muted">{t.passwordIntro}</p>
      <form className="auth-form" onSubmit={save}>
        <Field label={t.passwordLabel} hint={t.passwordHint}>
          {(id, describedBy) => (
            <input
              id={id}
              aria-describedby={describedBy}
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>
        <button type="submit" className="secondary-button" disabled={status.state === 'saving'}>
          {status.state === 'saving' ? t.passwordSaving : t.passwordSave}
        </button>
        {status.state === 'saved' && (
          <p className="notice" role="status">
            {t.passwordSaved}
          </p>
        )}
        {status.state === 'error' && (
          <p className="error" role="alert">
            {status.message}
          </p>
        )}
      </form>
    </section>
  );
}
