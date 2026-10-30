import { useSession } from '../ui/useSession';

interface Props {
  loginLabel: string;
  loginHref: string;
  accountLabel: string;
  accountHref: string;
}

/** Site-header link: "Log in" when signed out, "Account" once a session is confirmed.
 * Nothing renders while that's still being checked, to avoid a flash of the wrong state. */
export default function AuthNavLink({ loginLabel, loginHref, accountLabel, accountHref }: Props) {
  const session = useSession();
  if (session.state === 'loading') return null;
  // Shares the .nav-link styling (and touch-target padding) with its plain-anchor
  // siblings in Base.astro's header, even though this one is hydrated separately.
  return session.state === 'in' ? (
    <a className="nav-link" href={accountHref}>
      {accountLabel}
    </a>
  ) : (
    <a className="nav-link" href={loginHref}>
      {loginLabel}
    </a>
  );
}
