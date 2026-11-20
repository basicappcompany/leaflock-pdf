/**
 * The sign-in email: a plain-text part and an HTML part with a real button.
 *
 * Email clients ignore stylesheets and most modern CSS, so the HTML is a table with inline styles and a "bulletproof"
 * button (the colour is set on the cell as well as the link, which is what Outlook honours). It loads nothing from
 * anywhere: no images, no tracking pixel, no web fonts. An image would be blocked by default in most clients anyway, and
 * the product's promise is that nothing about a visit is reported elsewhere. The plain-text part stays, for clients and
 * readers that show only text, and the link is repeated under the button for the same reason.
 */

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface SignInEmail {
  subject: string;
  text: string;
  html: string;
}

/** `minutes` is how long the link lasts; the caller passes it from the one constant that enforces it. */
export function signInEmail(link: string, minutes: number): SignInEmail {
  const subject = 'Your LeafLock PDF sign-in link';
  const lasts = `This link works once and expires in ${minutes} minutes.`;
  const ignore = "If you didn't request it, you can ignore this email.";

  const text = `Sign in to LeafLock PDF: ${link}\n\n${lasts} ${ignore}`;

  const href = escapeHtml(link);
  const green = '#15803d';
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f8f6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your sign-in link for LeafLock PDF. ${lasts}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f8f6;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background-color:#ffffff;border:1px solid #e3e5df;border-radius:16px;">
<tr><td style="padding:32px 28px 8px 28px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;color:${green};">LeafLock PDF</td></tr>
<tr><td style="padding:8px 28px 0 28px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:24px;line-height:30px;font-weight:700;color:#171a17;">Sign in to LeafLock PDF</td></tr>
<tr><td style="padding:12px 28px 24px 28px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:24px;color:#5b625b;">Tap the button to finish signing in. ${lasts}</td></tr>
<tr><td align="center" style="padding:0 28px 24px 28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td align="center" bgcolor="${green}" style="border-radius:12px;background-color:${green};">
<a href="${href}" target="_blank" style="display:block;padding:14px 24px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">Sign in</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:0 28px 8px 28px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#5b625b;">Button not working? Copy this address into your browser:</td></tr>
<tr><td style="padding:0 28px 24px 28px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;line-height:18px;color:#5b625b;word-break:break-all;"><a href="${href}" target="_blank" style="color:#5b625b;text-decoration:underline;">${href}</a></td></tr>
<tr><td style="padding:16px 28px 28px 28px;border-top:1px solid #e3e5df;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#5b625b;">${ignore} Your files never leave your device.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}
