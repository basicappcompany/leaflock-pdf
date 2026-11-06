import type { CommonMessages } from '../../i18n';

/**
 * Shown in place of a paid tool when the visitor's plan doesn't include it.
 *
 * Takes the tier so the screen names the plan that actually unlocks this tool: after the
 * six professional tools moved to Practice (roadmap 4.9), a single set of Pro wording
 * would have sent Practice buyers to the wrong plan.
 */
export function ProGate({
  common,
  signedIn,
  tier,
}: {
  common: CommonMessages;
  signedIn: boolean;
  tier: 'pro' | 'practice';
}) {
  const t = common.toolPage;
  const copy = t.tiers[tier];
  return (
    <div className="pro-gate">
      <span className="badge-pro">{copy.label}</span>
      <h2>{copy.gateHeading}</h2>
      <p>{copy.gateBody}</p>
      <div className="pro-gate__actions">
        <a className="primary-button" href="/pricing/">
          {copy.gateAction}
        </a>
        {!signedIn && (
          <a className="secondary-button" href="/login/">
            {t.gateLogIn}
          </a>
        )}
      </div>
      {!signedIn && <p className="muted">{copy.gateHaveIt}</p>}
    </div>
  );
}
