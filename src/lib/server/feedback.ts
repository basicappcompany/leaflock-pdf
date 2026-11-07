/**
 * Server-side rules for the feature-request and feedback forms. Pure functions, so they can be
 * unit-tested without a database or a request.
 */

import { newId } from './db';

export const MIN_MESSAGE = 10;
export const MAX_MESSAGE = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FeedbackKind = 'feature' | 'feedback';

export interface Feedback {
  kind: FeedbackKind;
  message: string;
  email: string | null;
  /** The path of the page the form was opened on, such as "/split-pdf". Never a query string. */
  page: string | null;
}

export type FeedbackParse =
  | { ok: true; value: Feedback }
  /** A bot filled the hidden field. Answered like a success so it learns nothing, and stored nowhere. */
  | { ok: false; reason: 'spam' }
  | { ok: false; reason: 'invalid' };

/**
 * The submission from a request body, or why it was refused.
 *
 * Strict about shape and size, forgiving about whitespace. The page path is kept only if it
 * looks like a path on this site; anything else (a full URL, a query string, something odd) is
 * dropped rather than stored, because the form never sends one and a forged request should not
 * be able to put arbitrary text in a column an owner reads.
 */
export function parseFeedback(raw: unknown): FeedbackParse {
  if (typeof raw !== 'object' || raw === null) return { ok: false, reason: 'invalid' };
  const body = raw as Record<string, unknown>;

  // The honeypot: a field no person can see, so only a script fills it.
  if (typeof body['website'] === 'string' && body['website'].trim() !== '') return { ok: false, reason: 'spam' };

  const kind = body['kind'];
  if (kind !== 'feature' && kind !== 'feedback') return { ok: false, reason: 'invalid' };

  const message = typeof body['message'] === 'string' ? body['message'].trim() : '';
  if (message.length < MIN_MESSAGE || message.length > MAX_MESSAGE) return { ok: false, reason: 'invalid' };

  let email: string | null = null;
  if (typeof body['email'] === 'string' && body['email'].trim() !== '') {
    const candidate = body['email'].trim().toLowerCase();
    if (candidate.length > 254 || !EMAIL_PATTERN.test(candidate)) return { ok: false, reason: 'invalid' };
    email = candidate;
  }

  const page = typeof body['page'] === 'string' && /^\/[A-Za-z0-9\-_/]{0,98}$/.test(body['page']) ? body['page'] : null;

  return { ok: true, value: { kind, message, email, page } };
}

export async function insertFeedback(db: D1Database, value: Feedback, now: number): Promise<void> {
  await db
    .prepare('INSERT INTO feedback (id, created_at, kind, message, email, page) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(newId(), now, value.kind, value.message, value.email, value.page)
    .run();
}

/** A short plain-text summary for the optional email to the owner. */
export function summarise(value: Feedback): { subject: string; text: string } {
  const label = value.kind === 'feature' ? 'Feature request' : 'Feedback';
  return {
    subject: `${label}: ${value.message.replace(/\s+/g, ' ').slice(0, 60)}`,
    text: [
      value.message,
      '',
      `Kind: ${label}`,
      `Page: ${value.page ?? 'not given'}`,
      `Reply to: ${value.email ?? 'no email given'}`,
    ].join('\n'),
  };
}
