import { useState } from 'react';
import type { Messages } from '../../i18n';
import { useSession } from '../ui/useSession';

// Imported rather than redeclared: this union had drifted out of date by the time the
// Practice tier was added, still listing a `lifetime` key the server no longer accepts.
// The import is type-only, so nothing from the server module reaches the browser bundle.
import type { PlanKey } from '../../lib/server/billing';

/**
 * Starts a purchase. Sends the browser to Dodo's hosted checkout, so no payment form
 * and no third-party script ever runs on our origin.
 */
export default function CheckoutButton({
  plan,
  label,
  t,
}: {
  plan: PlanKey;
  label: string;
  t: Messages['pricing']['checkout'];
}) {
  const session = useSession();
  const [status, setStatus] = useState<'idle' | 'starting' | 'error'>('idle');

  // Buying needs an account, so the payment has something to attach to.
  if (session.state === 'out') {
    return (
      <a className="primary-button" href="/login">
        {t.logInToBuy}
      </a>
    );
  }

  async function start() {
    setStatus('starting');
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const body = (await response.json().catch(() => null)) as { url?: string } | null;
      if (response.ok && body?.url) {
        window.location.href = body.url;
        return;
      }
      setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <button
        type="button"
        className="primary-button"
        disabled={session.state === 'loading' || status === 'starting'}
        onClick={start}
      >
        {status === 'starting' ? t.starting : label}
      </button>
      {status === 'error' && (
        <p className="error" role="alert">
          {t.failed}
        </p>
      )}
    </>
  );
}
