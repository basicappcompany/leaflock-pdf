import { useState, type SubmitEvent } from 'react';
import type { Messages } from '../../i18n';
import { Field } from '../ui/fields';

type Status = { state: 'idle' } | { state: 'busy' } | { state: 'error'; message: string };

/** Download-your-data and delete-your-account, which the GDPR and the DPDP Act both require. */
export default function DataSection({ t }: { t: Messages['auth']['account'] }) {
  const [exportStatus, setExportStatus] = useState<Status>({ state: 'idle' });
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<Status>({ state: 'idle' });

  async function downloadData() {
    setExportStatus({ state: 'busy' });
    try {
      const response = await fetch('/api/account/export');
      if (!response.ok) throw new Error(String(response.status));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'leaflock-account.json';
      link.click();
      URL.revokeObjectURL(url);
      setExportStatus({ state: 'idle' });
    } catch {
      setExportStatus({ state: 'error', message: t.exportFailed });
    }
  }

  async function deleteAccount(event: SubmitEvent) {
    event.preventDefault();
    setDeleteStatus({ state: 'busy' });
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: confirmText }),
      });
      if (response.ok) {
        window.location.href = '/';
        return;
      }
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      const message =
        body?.error === 'confirm_mismatch'
          ? t.deleteMismatch
          : body?.error === 'subscription_active'
            ? t.deleteSubscription
            : t.deleteFailed;
      setDeleteStatus({ state: 'error', message });
    } catch {
      setDeleteStatus({ state: 'error', message: t.deleteFailed });
    }
  }

  return (
    <>
      <section className="account-password">
        <h2>{t.dataHeading}</h2>
        <p className="muted">{t.dataIntro}</p>
        <button type="button" className="secondary-button" onClick={downloadData} disabled={exportStatus.state === 'busy'}>
          {exportStatus.state === 'busy' ? t.exporting : t.exportAction}
        </button>
        {exportStatus.state === 'error' && (
          <p className="error" role="alert">
            {exportStatus.message}
          </p>
        )}
      </section>

      <section className="account-danger">
        <h2>{t.deleteHeading}</h2>
        <p className="muted">{t.deleteIntro}</p>

        {!confirming ? (
          <button type="button" className="danger-button" onClick={() => setConfirming(true)}>
            {t.deleteStart}
          </button>
        ) : (
          <form className="auth-form" onSubmit={deleteAccount}>
            <Field label={t.deleteConfirmLabel}>
              {(id, describedBy) => (
                <input
                  id={id}
                  aria-describedby={describedBy}
                  type="email"
                  required
                  autoComplete="off"
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                />
              )}
            </Field>
            <div className="row">
              <button type="submit" className="danger-button" disabled={deleteStatus.state === 'busy'}>
                {deleteStatus.state === 'busy' ? t.deleting : t.deleteConfirm}
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setConfirming(false);
                  setConfirmText('');
                  setDeleteStatus({ state: 'idle' });
                }}
              >
                {t.deleteCancel}
              </button>
            </div>
            {deleteStatus.state === 'error' && (
              <p className="error" role="alert">
                {deleteStatus.message}
              </p>
            )}
          </form>
        )}
      </section>
    </>
  );
}
