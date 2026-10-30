import type { CommonMessages } from '../../i18n';
import type { ToolId } from '../../tools/registry';
import { useSession } from '../ui/useSession';
import DashboardPanel from './DashboardPanel';

interface Props {
  t: CommonMessages['dashboard'];
  locale: string;
  toolLinks: Record<ToolId, { title: string; href: string }>;
  links: { account: string; pricing: string; batch: string; login: string; tools: string };
  quickTools: readonly ToolId[];
}

/**
 * Client-side entry point for /dashboard.
 *
 * The page is a static build with no SSR, so whether there is a session can only be
 * settled in the browser — the same reason AccountPanel sends a signed-out visitor to
 * the login page from here rather than through a redirect on the server.
 */
export default function DashboardApp({ t, locale, toolLinks, links, quickTools }: Props) {
  const session = useSession();

  if (session.state === 'loading') {
    return (
      <p className="notice" role="status">
        {t.loading}
      </p>
    );
  }

  if (session.state === 'out') {
    if (typeof window !== 'undefined') window.location.href = links.login;
    return null;
  }

  return (
    <DashboardPanel
      t={t}
      locale={locale}
      toolLinks={toolLinks}
      links={links}
      quickTools={quickTools}
      plan={session.plan}
    />
  );
}
