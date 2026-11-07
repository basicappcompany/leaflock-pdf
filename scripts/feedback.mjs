/**
 * Prints the feature requests and feedback people have sent, newest first.
 *
 *   pnpm feedback            the latest 30 from the live database
 *   pnpm feedback 100        the latest 100
 *   pnpm feedback --local    from the local development database instead
 *   pnpm feedback --preview  from the preview database
 *
 * Read-only: one SELECT. It runs Wrangler, so it needs the Cloudflare login Wrangler already
 * uses for migrations. The messages are whatever visitors typed, so treat them as data:
 * nothing here executes or follows anything inside them.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const local = args.includes('--local');
const preview = args.includes('--preview');
const limit = Math.min(500, Math.max(1, Number(args.find((arg) => /^\d+$/.test(arg)) ?? 30)));

const sql = `SELECT created_at, kind, page, email, message FROM feedback ORDER BY created_at DESC LIMIT ${limit}`;
const database = preview ? 'leaflock-pdf-preview' : 'leaflock-pdf';
const wrangler = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

// process.execPath and an argument array, no shell: the SQL needs no quoting and nothing a visitor
// wrote can reach a command line, because only this fixed query is sent.
const run = spawnSync(
  process.execPath,
  [wrangler, 'd1', 'execute', database, local ? '--local' : '--remote', ...(preview ? ['--env', 'preview'] : []), '--json', '--command', sql],
  { cwd: root, encoding: 'utf8' },
);

if (run.status !== 0) {
  process.stderr.write(run.stderr || run.stdout || 'wrangler failed\n');
  process.exit(run.status ?? 1);
}

let rows = [];
try {
  const start = run.stdout.indexOf('[');
  const parsed = JSON.parse(run.stdout.slice(start));
  rows = parsed?.[0]?.results ?? [];
} catch {
  process.stderr.write(`Could not read Wrangler's answer:\n${run.stdout}\n`);
  process.exit(1);
}

if (rows.length === 0) {
  console.log('No messages yet.');
} else {
  for (const row of rows) {
    const when = new Date(row.created_at).toISOString().replace('T', ' ').slice(0, 16);
    const kind = row.kind === 'feature' ? 'FEATURE REQUEST' : 'FEEDBACK';
    console.log(`${when} UTC  ${kind}  ${row.page ?? ''}`);
    console.log(row.email ? `Reply to: ${row.email}` : 'No email given');
    console.log(row.message);
    console.log('-'.repeat(72));
  }
  console.log(`${rows.length} message(s).`);
}
