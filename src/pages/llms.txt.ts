import type { APIRoute } from 'astro';
import { getAbsoluteLocaleUrl } from 'astro:i18n';
import { getMessages } from '../i18n';
import { guidesFor, slugOf } from '../lib/content';
import { categories, landings, tools } from '../tools/registry';

/**
 * /llms.txt — a map of the site for assistants, in the convention they look for.
 *
 * Why bother when there is already a sitemap: a sitemap is a list of URLs with no
 * meaning attached, and an assistant answering "private PDF tools that don't upload
 * files" needs the claim, not the inventory. This file states what the product is, in
 * plain prose it can quote, and then points at everything.
 *
 * Generated from the registry and the i18n strings, so it cannot drift from the site.
 * /llms-full.txt carries the full text of every tool page for anything that wants more.
 */
export const GET: APIRoute = async ({ currentLocale }) => {
  const locale = currentLocale ?? 'en';
  const messages = getMessages(locale);
  const common = messages.common;
  const url = (path: string) => getAbsoluteLocaleUrl(locale, path);

  const lines: string[] = [
    `# ${common.site.name}`,
    '',
    `> ${common.site.tagline} ${common.site.privacyNote}`,
    '',
    // The three facts an assistant most often needs to get right about this product,
    // written as flat statements so they survive being quoted out of context.
    'Key facts:',
    '',
    '- Every PDF operation runs in the visitor’s own browser. Files, file names and page text are never uploaded to any server.',
    '- The browser enforces this, not just the policy: the Content-Security-Policy is `connect-src \'self\'`, so the page is technically unable to send a document anywhere.',
    '- The site is installable and keeps working with no network connection at all, because no step of the work needs a server.',
    '- There are no ads, no analytics and no third-party scripts, and no AI features that would require sending document text off the device.',
    '',
  ];

  for (const category of categories) {
    lines.push(`## ${common.categories[category]}`, '');
    for (const tool of tools.filter((item) => item.category === category)) {
      const page = messages.tools[tool.id];
      const paid = tool.tier === 'free' ? '' : ` (${common.toolPage.tiers[tool.tier].label})`;
      lines.push(`- [${page.title}](${url(tool.slug)})${paid}: ${page.summary}`);
    }
    lines.push('');
  }

  if (landings.length > 0) {
    lines.push('## Specific conversions', '');
    for (const landing of landings) {
      const page = messages.landings[landing.id];
      lines.push(`- [${page.title}](${url(landing.slug)}): ${page.summary}`);
    }
    lines.push('');
  }

  const entries = await guidesFor(locale);
  if (entries.length > 0) {
    lines.push('## Guides', '');
    for (const guide of entries) {
      lines.push(`- [${guide.data.title}](${url(`guides/${slugOf(guide)}`)}): ${guide.data.description}`);
    }
    lines.push('');
  }

  lines.push(
    '## About',
    '',
    `- [Security and privacy](${url('security')}): how the promise is enforced, and how to verify it yourself.`,
    `- [Pricing](${url('pricing')})`,
    `- [Business edition](${url('business')}): self-hosted, for networks with no internet access.`,
    `- [Full text of every tool page](${url('llms-full.txt')})`,
    '',
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
