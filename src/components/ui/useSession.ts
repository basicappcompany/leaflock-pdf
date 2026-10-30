import { useEffect, useState } from 'react';
import { setCachedPlan, type Plan } from '../../lib/planCache';

export type { Plan };

export type SessionState = { state: 'loading' } | { state: 'out' } | { state: 'in'; email: string; plan: Plan };

// Must match SIGNED_IN_HINT_COOKIE_NAME in src/lib/server/session.ts (duplicated, not
// imported: that module is server-only and must never reach the browser bundle).
const SIGNED_IN_HINT_COOKIE = 'leaflock_signed_in';

function hasSignedInHint(): boolean {
  return document.cookie.split('; ').some((entry) => entry.startsWith(`${SIGNED_IN_HINT_COOKIE}=`));
}

/**
 * Reflects the signed-in user, if any. The site is a static build with no SSR, so a
 * client island can't read the (HttpOnly) session cookie itself — calling /api/auth/me
 * is the only way to find out. But that's skipped unless the non-HttpOnly hint cookie
 * is present: being signed out is the default for nearly every visitor, and hitting the
 * backend on every single page view for all of them would be pure waste.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>(() => (hasSignedInHint() ? { state: 'loading' } : { state: 'out' }));

  useEffect(() => {
    if (!hasSignedInHint()) return;
    let cancelled = false;
    fetch('/api/auth/me')
      .then((response) => (response.ok ? (response.json() as Promise<{ email: string; plan: Plan } | null>) : null))
      .then((data) => {
        // Cached so a job can skip the usage round trip on paid plans (src/lib/usage.ts).
        setCachedPlan(data ? data.plan : 'anonymous');
        if (!cancelled) setState(data ? { state: 'in', email: data.email, plan: data.plan } : { state: 'out' });
      })
      .catch(() => {
        if (!cancelled) setState({ state: 'out' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
