/**
 * Cloudflare Pages Function: starts a passwordless login by emailing a one-time link.
 *
 * Always responds 204 whether or not the email has an account — the account is only
 * created once the link is actually clicked (see verify.ts) — so this endpoint can't
 * be used to check who has signed up.
 */

import { getEmailSender } from '../../../src/lib/email/sender';
import { safeNext } from '../../../src/lib/safeNext';
import { hashIp } from '../../../src/lib/server/ipHash';
import { createMagicLink } from '../../../src/lib/server/magicLink';
import { checkAndIncrement } from '../../../src/lib/server/rateLimit';

const MAX_BODY = 512;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > MAX_BODY) return new Response(null, { status: 413 });
  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response(null, { status: 413 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  const rawEmail =
    typeof parsed === 'object' && parsed !== null && typeof (parsed as Record<string, unknown>)['email'] === 'string'
      ? ((parsed as Record<string, unknown>)['email'] as string)
      : null;
  const email = rawEmail?.trim().toLowerCase().slice(0, 254) ?? null;
  if (!email || !EMAIL_PATTERN.test(email)) return new Response(null, { status: 400 });

  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const ipHash = ip ? await hashIp(ip, env.SESSION_IP_SALT) : null;

  // [TO CONFIRM: owner] 3 per 15 min + 10 per day per email, 10 per 15 min per IP.
  const perEmail = await checkAndIncrement(env.DB, `link-email:${email}`, 3, 15 * 60);
  const perEmailDay = await checkAndIncrement(env.DB, `link-email-day:${email}`, 10, 24 * 60 * 60);
  const perIp = ipHash ? await checkAndIncrement(env.DB, `link-ip:${ipHash}`, 10, 15 * 60) : { allowed: true };
  if (!perEmail.allowed || !perEmailDay.allowed || !perIp.allowed) {
    return new Response(null, { status: 429 });
  }

  const token = await createMagicLink(env.DB, email, ipHash);
  const origin = new URL(request.url).origin;
  const next = safeNext((parsed as Record<string, unknown>)['next']);
  const link = `${origin}/api/auth/verify?token=${token}${next ? `&next=${encodeURIComponent(next)}` : ''}`;

  try {
    await getEmailSender(env).send({
      to: email,
      subject: 'Your LeafLock PDF sign-in link',
      text: `Sign in to LeafLock PDF: ${link}\n\nThis link works once and expires in 15 minutes. If you didn't request it, you can ignore this email.`,
    });
  } catch (error) {
    // Same response either way: delivery failures aren't revealed to the caller.
    console.error('magic link email failed', error);
  }

  return new Response(null, { status: 204 });
}
