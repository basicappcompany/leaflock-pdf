/**
 * The feature-request and feedback dialog, opened from the two buttons at the bottom of the
 * sidebar. Loaded on first use (a dynamic import from ToolsSidebar.astro), so the code costs
 * nothing on a page where nobody opens it.
 *
 * The markup and every string come from the page: a <template id="feedbackTemplate"> that
 * ToolsSidebar.astro renders in the visitor's language. This module only clones it, fills in
 * the wording for the chosen kind, and sends the result to /api/feedback.
 *
 * Privacy: what is sent is the message the person typed, the kind, the email only if they
 * typed one, and the path of the page they were on (no query string). Nothing about any file.
 * The form says so in its own words, above the Send button.
 */

export type FeedbackKind = 'feature' | 'feedback';

/** Must match MIN_MESSAGE in src/lib/server/feedback.ts (duplicated: that module is server-only). */
const MIN_MESSAGE = 10;

let dialog: HTMLDialogElement | null = null;
let opener: HTMLElement | null = null;

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

function build(template: HTMLTemplateElement): HTMLDialogElement {
  const copy = template.content.firstElementChild?.cloneNode(true) as HTMLDialogElement;
  document.body.appendChild(copy);
  const words = template.dataset;
  const form = copy.querySelector<HTMLFormElement>('form')!;
  const message = copy.querySelector<HTMLTextAreaElement>('textarea')!;
  const status = copy.querySelector<HTMLElement>('.feedback__status')!;
  const send = copy.querySelector<HTMLButtonElement>('[data-send]')!;

  const say = (text: string, state: 'idle' | 'error' | 'ok') => {
    status.textContent = text;
    status.dataset.state = state;
  };

  copy.querySelector('[data-cancel]')!.addEventListener('click', () => copy.close());
  // Clicking the dim area outside the box closes it, as people expect of a dialog.
  copy.addEventListener('click', (event) => {
    if (event.target === copy) copy.close();
  });
  copy.addEventListener('close', () => {
    opener?.focus();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (copy.dataset.done === 'true') {
      copy.close();
      return;
    }
    const text = message.value.trim();
    if (text.length < MIN_MESSAGE) {
      say(fill(words.tooShort ?? '', { min: String(MIN_MESSAGE) }), 'error');
      message.setAttribute('aria-invalid', 'true');
      message.focus();
      return;
    }
    message.removeAttribute('aria-invalid');

    const email = copy.querySelector<HTMLInputElement>('input[type="email"]')!.value.trim();
    const website = copy.querySelector<HTMLInputElement>('.feedback__hp')!.value;
    for (const control of form.elements) (control as HTMLInputElement).disabled = true;
    say(words.sending ?? '', 'idle');

    void fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: copy.dataset.kind, message: text, email, page: location.pathname, website }),
    })
      .then((response) => response.status === 204)
      .catch(() => false)
      .then((ok) => {
        for (const control of form.elements) (control as HTMLInputElement).disabled = false;
        if (ok) {
          // Thanks, and the form turns into a Close button so a second press does not send it again.
          copy.dataset.done = 'true';
          message.disabled = true;
          copy.querySelector<HTMLInputElement>('input[type="email"]')!.disabled = true;
          send.textContent = words.close ?? '';
          copy.querySelector<HTMLElement>('[data-cancel]')!.hidden = true;
          say(words.thanks ?? '', 'ok');
          send.focus();
        } else {
          say(fill(words.error ?? '', { email: words.email ?? '' }), 'error');
        }
      });
  });

  return copy;
}

/** Opens the dialog for one kind of message. `from` is the button to return focus to afterwards. */
export function openFeedback(kind: FeedbackKind, from: HTMLElement): void {
  const template = document.getElementById('feedbackTemplate') as HTMLTemplateElement | null;
  if (!template) return;
  opener = from;
  dialog ??= build(template);
  const words = template.dataset;

  dialog.dataset.kind = kind;
  dialog.dataset.done = 'false';
  const title = dialog.querySelector<HTMLElement>('.feedback__title')!;
  const prompt = dialog.querySelector<HTMLElement>('.feedback__prompt')!;
  title.textContent = (kind === 'feature' ? words.requestTitle : words.feedbackTitle) ?? '';
  prompt.textContent = (kind === 'feature' ? words.requestPrompt : words.feedbackPrompt) ?? '';

  // A fresh form each time it opens, and the buttons as they were before a "thank you".
  const message = dialog.querySelector<HTMLTextAreaElement>('textarea')!;
  const email = dialog.querySelector<HTMLInputElement>('input[type="email"]')!;
  message.value = '';
  message.disabled = false;
  message.removeAttribute('aria-invalid');
  email.value = '';
  email.disabled = false;
  dialog.querySelector<HTMLInputElement>('.feedback__hp')!.value = '';
  dialog.querySelector<HTMLButtonElement>('[data-send]')!.textContent = words.send ?? '';
  dialog.querySelector<HTMLElement>('[data-cancel]')!.hidden = false;
  const status = dialog.querySelector<HTMLElement>('.feedback__status')!;
  status.textContent = '';
  status.dataset.state = 'idle';

  dialog.showModal();
  message.focus();
}
