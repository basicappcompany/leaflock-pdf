import type { APIRoute } from 'astro';

// Everything is public and meant to be found, by search engines and by AI answer engines.
// The named groups are explicit on purpose: they state that these crawlers are welcome.
const BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
];

export const GET: APIRoute = ({ site }) => {
  const lines = ['User-agent: *', 'Allow: /', ''];
  for (const bot of BOTS) lines.push(`User-agent: ${bot}`, 'Allow: /', '');
  lines.push(`Sitemap: ${new URL('/sitemap.xml', site).href}`, '');
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
