import type { EmailSender } from './sender';

/** Dev/CI stand-in: logs the message instead of sending it, so the login flow works with no provider configured. */
export const consoleSender: EmailSender = {
  async send(message) {
    console.log(JSON.stringify({ type: 'dev-email', ...message }));
  },
};
