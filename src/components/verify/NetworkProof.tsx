import { useEffect, useRef, useState } from 'react';
import type { Messages } from '../../i18n';
import { format } from '../../i18n';

type T = Messages['verify'];

/** A host the page is not allowed to reach. Nothing is ever sent there: see `attempt()`. */
const FOREIGN_ORIGIN = 'https://example.com';

interface Attempt {
  /** What the browser reported, in its own words. */
  directive: string;
  blockedURI: string;
  thrown: string;
}

/**
 * The live half of the verifiability page (roadmap 3.4).
 *
 * Three things the visitor can see without opening developer tools: every network request
 * this page has made and where each one went, what happens when the page tries to send
 * something to another site, and whether the tools still work with the network off.
 *
 * Built on what the platform actually does, probed before this was written:
 *
 * - A cross-origin `fetch` blocked by `connect-src 'self'` fires `securitypolicyviolation`
 *   on the document with `violatedDirective: "connect-src"` and the blocked URI, and the
 *   fetch itself rejects with `TypeError: Failed to fetch`.
 * - A blocked request leaves **no** Resource Timing entry, so the request list below cannot
 *   show it. That is why the attempt is reported from the violation event instead, and why
 *   the two panels answer different questions.
 */
export function NetworkProof({ t }: { t: T }) {
  const [requests, setRequests] = useState<{ url: string; origin: string }[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [attemptFailed, setAttemptFailed] = useState(false);
  const [online, setOnline] = useState(true);
  const violation = useRef<{ directive: string; blockedURI: string } | null>(null);

  // Everything this page has fetched, and everything it fetches from now on. Resource
  // Timing is the browser's own record; the page cannot add to it or leave anything out.
  useEffect(() => {
    const read = () =>
      setRequests(
        performance.getEntriesByType('resource').map((entry) => ({
          url: entry.name,
          origin: safeOrigin(entry.name),
        })),
      );

    read();
    let observer: PerformanceObserver | undefined;
    try {
      observer = new PerformanceObserver(read);
      observer.observe({ type: 'resource', buffered: true });
    } catch {
      // Older browsers without the entry type still get the initial list above.
    }
    return () => observer?.disconnect();
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);
    const update = () => setOnline(navigator.onLine);
    addEventListener('online', update);
    addEventListener('offline', update);
    return () => {
      removeEventListener('online', update);
      removeEventListener('offline', update);
    };
  }, []);

  // Recorded on the document, because that is where the browser reports a blocked request.
  useEffect(() => {
    const onViolation = (event: SecurityPolicyViolationEvent) => {
      violation.current = { directive: event.violatedDirective, blockedURI: event.blockedURI };
    };
    document.addEventListener('securitypolicyviolation', onViolation);
    return () => document.removeEventListener('securitypolicyviolation', onViolation);
  }, []);

  /**
   * Asks the browser to send a request to another site, so it can refuse in front of you.
   *
   * No document is involved and nothing is put in the request: the point is the refusal,
   * and the refusal happens before anything leaves the machine, so `example.com` is never
   * contacted at all.
   */
  async function attemptForeignRequest() {
    // Remember what had already been reported rather than clearing it, so only a violation
    // that arrives during *this* attempt is accepted. Clearing would also have let an
    // unrelated earlier block be presented as the result of pressing the button.
    const before = violation.current;
    setAttempt(null);
    setAttemptFailed(false);

    let thrown = '';
    try {
      await fetch(`${FOREIGN_ORIGIN}/`, { mode: 'cors' });
    } catch (error) {
      thrown = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    }

    // The event is dispatched synchronously with the block, but give the task queue a turn
    // before reading it, so a slow dispatch reports honestly instead of showing nothing.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const reported = violation.current;
    if (reported && reported !== before) {
      setAttempt({ ...reported, thrown });
      return;
    }
    // If the request was not blocked, say so rather than implying it was. A page that
    // claims a block it cannot evidence is the exact failure this page exists to answer.
    setAttemptFailed(true);
  }

  const foreign = requests.filter((request) => request.origin !== safeOrigin(location.href));

  return (
    <div className="verify">
      <section className="verify__panel" aria-labelledby="verify-requests">
        <h2 id="verify-requests">{t.requests.heading}</h2>
        <p>{t.requests.intro}</p>
        <p className="verify__count">
          {format(t.requests.count, { count: requests.length, origin: safeOrigin(location.href) })}
        </p>

        {foreign.length === 0 ? (
          <p className="verify__verdict verify__verdict--good">{t.requests.allOurs}</p>
        ) : (
          <>
            <p className="verify__verdict verify__verdict--bad">{t.requests.foreignFound}</p>
            <ul>
              {foreign.map((request) => (
                <li key={request.url}>{request.url}</li>
              ))}
            </ul>
          </>
        )}

        <details>
          <summary>{t.requests.showAll}</summary>
          {/* Scrolls rather than growing without limit: a tool page can load dozens. */}
          <ol className="verify__list">
            {requests.map((request) => (
              <li key={request.url}>
                <code>{request.url}</code>
              </li>
            ))}
          </ol>
        </details>

        <p className="hint">{t.requests.limit}</p>
      </section>

      <section className="verify__panel" aria-labelledby="verify-attempt">
        <h2 id="verify-attempt">{t.attempt.heading}</h2>
        <p>{t.attempt.intro}</p>

        <button type="button" className="primary-button" onClick={attemptForeignRequest}>
          {t.attempt.action}
        </button>

        <div aria-live="polite">
          {attempt && (
            <div className="verify__result">
              <p className="verify__verdict verify__verdict--good">{t.attempt.blocked}</p>
              <dl className="verify__rows">
                <div>
                  <dt>{t.attempt.directiveLabel}</dt>
                  <dd>
                    <code>{attempt.directive}</code>
                  </dd>
                </div>
                <div>
                  <dt>{t.attempt.blockedUriLabel}</dt>
                  <dd>
                    <code>{attempt.blockedURI}</code>
                  </dd>
                </div>
                <div>
                  <dt>{t.attempt.errorLabel}</dt>
                  <dd>
                    <code>{attempt.thrown}</code>
                  </dd>
                </div>
              </dl>
              <p className="hint">{t.attempt.note}</p>
            </div>
          )}
          {attemptFailed && <p className="verify__verdict verify__verdict--bad">{t.attempt.notBlocked}</p>}
        </div>
      </section>

      <section className="verify__panel" aria-labelledby="verify-offline">
        <h2 id="verify-offline">{t.offline.heading}</h2>
        <p>{t.offline.intro}</p>
        <p className="verify__verdict" aria-live="polite">
          {online ? t.offline.statusOnline : t.offline.statusOffline}
        </p>
        <p className="hint">{t.offline.note}</p>
      </section>
    </div>
  );
}

/** An entry name is normally a URL, but never assume: a bad parse must not blank the panel. */
function safeOrigin(url: string): string {
  try {
    return new URL(url, location.href).origin;
  } catch {
    return url;
  }
}
