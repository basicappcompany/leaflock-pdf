import { useEffect, useState } from 'react';
import type { CommonMessages } from '../../i18n';
import { format } from '../../i18n';
import { toolIcons } from '../../lib/icons';
import type { Plan } from '../../lib/planCache';
import { requiresUpgrade } from '../../lib/proAccess';
import { clearRecent, readRecent, type RecentRun } from '../../lib/recentActivity';
import type { ToolId } from '../../tools/registry';

interface ToolLink {
  title: string;
  href: string;
}

export interface DashboardPanelProps {
  t: CommonMessages['dashboard'];
  locale: string;
  /** Title and URL per tool, built on the Astro side so slugs and strings stay there. */
  toolLinks: Record<ToolId, ToolLink>;
  links: { account: string; pricing: string; batch: string; tools: string };
  /** A short list of common tools, so the page is never a dead end. */
  quickTools: readonly ToolId[];
  /** Resolved by DashboardApp, which has already confirmed there is a session. */
  plan: Plan;
}

interface Usage {
  plan: Plan;
  used: number;
  /** null means the plan is not metered. */
  limit: number | null;
}

/** Same attributes as ToolIcon.astro, so the two render identically. */
function ToolGlyph({ tool }: { tool: ToolId }) {
  return (
    <svg
      className="tool-icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: toolIcons[tool] }}
    />
  );
}

/**
 * How long ago a run was, in the visitor's own language.
 *
 * Intl does this properly for every locale, which beats inventing "2 min ago" strings
 * that then need translating and pluralising in each one.
 */
function useRelativeTime(locale: string): (at: number) => string {
  const [formatter] = useState(() => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }));
  return (at: number) => {
    const minutes = Math.round((at - Date.now()) / 60_000);
    if (Math.abs(minutes) < 60) return formatter.format(Math.min(minutes, 0), 'minute');
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
    return formatter.format(Math.round(hours / 24), 'day');
  };
}

/**
 * The dashboard itself: recent tools, a few tools to start, today's allowance and the plan.
 *
 * Deliberately *not* what a dashboard usually is. There is no file list, because we hold
 * no files and store no names (see src/lib/recentActivity.ts) — so this shows the tools
 * someone reached for, which is the part we can honestly offer.
 */
export default function DashboardPanel({ t, locale, toolLinks, links, quickTools, plan }: DashboardPanelProps) {
  const [recent, setRecent] = useState<RecentRun[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const relative = useRelativeTime(locale);

  // Read after mount, never during render: localStorage does not exist while Astro
  // prerenders, and a value read during render would not match the first paint.
  useEffect(() => setRecent(readRecent()), []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/usage/today')
      .then((response) => (response.ok ? (response.json() as Promise<Usage | null>) : null))
      .then((data) => {
        if (!cancelled && data) setUsage(data);
      })
      .catch(() => {
        /* Fails open, like every other usage call: the meter is simply left out. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const metered = usage?.limit != null;
  const used = usage?.used ?? 0;
  const limit = usage?.limit ?? 0;
  const onFreePlan = plan === 'free';
  // Batch is a Practice tool since 30 October 2026 (roadmap 4.9), so a paying Pro customer
  // must not be offered it. During early access nothing is gated and every plan reaches it.
  const hasProfessionalTools = !requiresUpgrade('practice', plan);

  return (
    <section className="dashboard" aria-labelledby="dashboard-title">
      <div className="dashboard__head">
        <h1 id="dashboard-title">{t.welcome}</h1>
        <p className="lead">{t.subtitle}</p>
      </div>

      <div className="dashboard__panels">
        <div className="dashboard__main">
          <div className="dashboard__card">
            <div className="list-header">
              <h2>{t.recentHeading}</h2>
              {recent.length > 0 && (
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    clearRecent();
                    setRecent([]);
                  }}
                >
                  {t.clear}
                </button>
              )}
            </div>

            {recent.length === 0 ? (
              <p className="muted">{t.recentEmpty}</p>
            ) : (
              <ul className="dashboard__recent">
                {recent.map(({ tool, at }) => (
                  <li key={tool}>
                    <span className="tool-grid__icon">
                      <ToolGlyph tool={tool} />
                    </span>
                    <span className="dashboard__recent-text">
                      <strong>{toolLinks[tool].title}</strong>
                      <span className="muted">
                        <time dateTime={new Date(at).toISOString()}>{relative(at)}</time>
                      </span>
                    </span>
                    <a className="secondary-button secondary-button--small" href={toolLinks[tool].href}>
                      {t.open}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <p className="hint">{t.recentNote}</p>
          </div>

          <div className="dashboard__card dashboard__quick">
            <div className="list-header">
              <h2>{t.quickHeading}</h2>
              <a className="link-button" href={links.tools}>
                {t.allTools}
              </a>
            </div>
            <ul className="tool-grid tool-grid--small">
              {quickTools.map((tool) => (
                <li key={tool}>
                  <a href={toolLinks[tool].href}>
                    <span className="tool-grid__icon">
                      <ToolGlyph tool={tool} />
                    </span>
                    <strong>{toolLinks[tool].title}</strong>
                  </a>
                </li>
              ))}
              </ul>
          </div>
        </div>

        <div className="dashboard__side">
          <div className="dashboard__card">
            <h2>{metered ? t.todayHeading : t.unlimitedHeading}</h2>
            {metered ? (
              <>
                <p className="muted">{format(t.todayUsed, { used, limit })}</p>
                {/* Inline style because the value is data; the CSSOM path is CSP-safe. */}
                <div
                  className="meter"
                  role="progressbar"
                  aria-valuenow={used}
                  aria-valuemin={0}
                  aria-valuemax={limit}
                  aria-label={t.todayHeading}
                >
                  <span style={{ width: `${Math.min(100, Math.round((used / limit) * 100))}%` }} />
                </div>
                <p className="hint">{t.todayResets}</p>
              </>
            ) : (
              <p className="muted">{t.unlimited}</p>
            )}
          </div>

          <div className="dashboard__card">
            {onFreePlan ? (
              <>
                <h2>{t.planHeading}</h2>
                <p className="muted">{t.planFree}</p>
                <a className="primary-button" href={links.pricing}>
                  {t.upgrade}
                </a>
              </>
            ) : hasProfessionalTools ? (
              <>
                <h2>{t.proHeading}</h2>
                <p className="muted">{t.proNote}</p>
                <a className="secondary-button" href={links.batch}>
                  {t.proAction}
                </a>
              </>
            ) : (
              <>
                <h2>{t.practiceHeading}</h2>
                <p className="muted">{t.practiceNote}</p>
                <a className="secondary-button" href={links.pricing}>
                  {t.practiceAction}
                </a>
              </>
            )}
            <a className="link-button" href={links.account}>
              {t.accountAction}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
