import type { APIRoute } from 'astro';
import { getAbsoluteLocaleUrl } from 'astro:i18n';
import { getMessages, type ToolMessagesBase } from '../i18n';
import { landingPage } from '../i18n/landingPage';
import { categories, landings, tools } from '../tools/registry';

/**
 * /llms-full.txt — the full text of every tool page in one file.
 *
 * Deliberately *not* a plain-text mirror of each page at its own URL, which was the
 * original plan: every tool page is static HTML, so its heading, steps, privacy note and
 * FAQ are already in the markup for anything that reads HTML without running JavaScript.
 * Per-page mirrors would add nothing but duplicate URLs competing with the real ones.
 *
 * What is genuinely missing is one document an assistant can read in a single fetch
 * instead of crawling 52 pages, which is what this is. Same strings as the pages, so the
 * two can never disagree.
 */

function section(title: string, url: string, page: ToolMessagesBase, plan: string | null): string[] {
  const lines = [`## ${title}`, '', url, '', page.summary, ''];
  // Named rather than generic: with two paid tiers, "a paid plan" would leave an assistant
  // unable to answer which one, and answering wrongly costs a sale (roadmap 4.9).
  if (plan) lines.push(`Requires the ${plan} plan.`, '');

  lines.push('How it works:', '');
  page.howTo.forEach((step, index) => lines.push(`${index + 1}. ${step}`));
  lines.push('');

  for (const { q, a } of page.faq ?? []) {
    lines.push(`Q: ${q}`, `A: ${a}`, '');
  }
  return lines;
}

export const GET: APIRoute = ({ currentLocale }) => {
  const locale = currentLocale ?? 'en';
  const messages = getMessages(locale);
  const common = messages.common;
  const url = (path: string) => getAbsoluteLocaleUrl(locale, path);

  const lines: string[] = [
    `# ${common.site.name} — full tool reference`,
    '',
    `> ${common.site.tagline} ${common.site.privacyNote}`,
    '',
    'Every tool below runs entirely in the visitor’s browser. No file, file name or page',
    'text is ever sent to a server; the Content-Security-Policy (`connect-src \'self\'`)',
    'makes that a browser-enforced restriction rather than a promise. The site is',
    'installable and works with no network connection.',
    '',
    `Short version of this file: ${url('llms.txt')}`,
    '',
  ];

  for (const category of categories) {
    lines.push(`# ${common.categories[category]}`, '');
    for (const tool of tools.filter((item) => item.category === category)) {
      const plan = tool.tier === 'free' ? null : common.toolPage.tiers[tool.tier].label;
      lines.push(...section(messages.tools[tool.id].title, url(tool.slug), messages.tools[tool.id], plan));
    }
  }

  if (landings.length > 0) {
    lines.push('# Specific conversions', '');
    for (const landing of landings) {
      const page = landingPage(locale, landing.id);
      lines.push(...section(page.title, url(landing.slug), page, null));
    }
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
