/**
 * Cloudflare Pages Function: receives a feature request or a piece of feedback from the forms at
 * the bottom of the sidebar.
 *
 *   POST /api/feedback   { kind: 'feature' | 'feedback', message, email?, page?, website? }
 *     204  stored (also what a bot that filled the hidden `website` field gets, with nothing stored)
 *     400  not a valid submission
 *     413  too large
 *     415  not JSON
 *     429  too many from this visitor
 *     503  could not be stored (including the table not existing yet on a database that has not
 *          had migration 0007 applied); the form then shows the contact email address instead
 *
 * Privacy: what the person typed, the kind, and the page path they were on. The IP address is
 * hashed with the server's salt and used only to count submissions for rate limiting, in
 * rate_limits; it is never written next to the message. The email is stored only if they gave
 * one, and only to reply. The cookie is not read, so a message is not tied to an account.
 *
 * The only thing standing between this endpoint and a flood is the limit below plus the
 * size cap, because a feedback form has to accept anonymous posts. An optional email to the
 * owner (FEEDBACK_NOTIFY_EMAIL) is sent after the message is safely stored, and its failure
 * is ignored: a message must never be lost because mail was down.
 */

import { getEmailSender } from '../../src/lib/email/sender';
import { insertFeedback, parseFeedback, summarise } from '../../src/lib/server/feedback';
import { hashIp } from '../../src/lib/server/ipHash';
import { checkAndIncrement } from '../../src/lib/server/rateLimit';

const MAX_BODY = 4096;

/** Per visitor, and across everyone: the second bound stops a spread-out flood. */
const PER_VISITOR_HOUR = 5;
const PER_VISITOR_DAY = 15;
const ALL_VISITORS_DAY = 300;

const status = (code: number): Response => new Response(null, { status: code });

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return status(415);
  if (Number(request.headers.get('content-length') ?? '0') > MAX_BODY) return status(413);
  const text = await request.text();
  if (text.length > MAX_BODY) return status(413);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return status(400);
  }

  const result = parseFeedback(parsed);
  if (!result.ok) return result.reason === 'spam' ? status(204) : status(400);

  try {
    const ip = request.headers.get('cf-connecting-ip') ?? '';
    const visitor = ip ? await hashIp(ip, env.SESSION_IP_SALT) : null;
    const hour = visitor ? await checkAndIncrement(env.DB, `feedback-hour:${visitor}`, PER_VISITOR_HOUR, 60 * 60) : { allowed: true };
    const day = visitor ? await checkAndIncrement(env.DB, `feedback-day:${visitor}`, PER_VISITOR_DAY, 24 * 60 * 60) : { allowed: true };
    const everyone = await checkAndIncrement(env.DB, 'feedback-all', ALL_VISITORS_DAY, 24 * 60 * 60);
    if (!hour.allowed || !day.allowed || !everyone.allowed) return status(429);

    await insertFeedback(env.DB, result.value, Date.now());
  } catch {
    return status(503);
  }

  if (env.FEEDBACK_NOTIFY_EMAIL) {
    try {
      const { subject, text: body } = summarise(result.value);
      await getEmailSender(env).send({ to: env.FEEDBACK_NOTIFY_EMAIL, subject, text: body });
    } catch (error) {
      console.error('feedback notification failed', error);
    }
  }
  return status(204);
}
