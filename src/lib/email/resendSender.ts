import type { EmailSender } from './sender';

/** Sends via Resend's HTTP API directly (no SDK). This call is Function-to-provider,
 * server-side — it never touches the browser, so it has no interaction with connect-src 'self'. */
export function createResendSender(apiKey: string, from: string): EmailSender {
  return {
    async send({ to, subject, text, html }) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, subject, text, ...(html ? { html } : {}) }),
      });
      if (!response.ok) {
        throw new Error(`Resend send failed: ${response.status}`);
      }
    },
  };
}
