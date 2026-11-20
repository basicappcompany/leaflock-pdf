import { consoleSender } from './consoleSender';
import { createResendSender } from './resendSender';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  /** Optional HTML alternative. Always send `text` too: it is what clients that show no HTML display. */
  html?: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

/** Picks the configured provider, falling back to a console-logging stub when none is set (dev/CI). */
export function getEmailSender(env: Env): EmailSender {
  if (env.RESEND_API_KEY) {
    return createResendSender(env.RESEND_API_KEY, env.EMAIL_FROM ?? 'hello@leaflockpdf.com');
  }
  return consoleSender;
}
