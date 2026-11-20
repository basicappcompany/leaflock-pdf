/**
 * Machine-translates the English catalogue (src/i18n/en/**) into another locale.
 *
 *   node scripts/translate.mjs --locale es --dry-run     count strings, estimate cost, call nothing
 *   node scripts/translate.mjs --locale es               translate and write src/i18n/es/index.ts
 *   node scripts/translate.mjs --locale es --force       re-translate strings that already exist
 *   node scripts/translate.mjs --patch fixes.json        add or replace a few strings in several locales at once, no API key:
 *                                                        { "de": { "common.nav.menu": "Menü" }, "fr": { ... } }. Keys are dotted
 *                                                        paths into the English catalogue; each value is checked like --import, and
 *                                                        everything else in the locale's file is kept exactly as it is.
 *   node scripts/translate.mjs --export strings.json     write every English string as a JSON array
 *   node scripts/translate.mjs --locale es --import es.json
 *                                                        validate a translated array (same length
 *                                                        and order as the export) and write the
 *                                                        catalogue; no API key needed
 *
 * Needs ANTHROPIC_API_KEY in the environment. This is build-time tooling run by a person, never
 * shipped code, so the site's `connect-src 'self'` does not apply to it.
 *
 * What it guarantees, because prose is invisible to the type checker (CLAUDE.md, "stated claims"):
 *   - every `{placeholder}` in the English string appears, unchanged, in the translation;
 *   - every number, URL and `<…>` tag in the English string appears in the translation;
 *   - a string that fails those checks twice is left in English and reported, never written wrong.
 * It does NOT guarantee the translation is good. A person reviews the trust claims, pricing and
 * error strings before a locale's status goes from 'machine' to 'reviewed' (roadmap 5.7).
 */
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { localeRegistry } from '../src/i18n/locales.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MODEL = process.env.TRANSLATE_MODEL ?? 'claude-sonnet-5-5';
const BATCH_SIZE = 40;

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
};

/** Loads the English catalogue by bundling its TypeScript entry; no TS runner is installed. */
async function loadEnglish() {
  const result = await build({
    entryPoints: [path.join(root, 'src/i18n/en/index.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  });
  const code = result.outputFiles[0].text;
  const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  return module.en;
}

/** Every string leaf, with the path to reach it. Arrays are walked by index. */
function leaves(value, trail = [], out = []) {
  if (typeof value === 'string') out.push({ trail, text: value });
  else if (Array.isArray(value)) value.forEach((item, index) => leaves(item, [...trail, index], out));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) leaves(item, [...trail, key], out);
  return out;
}

function getAt(root, trail) {
  return trail.reduce((node, key) => (node == null ? undefined : node[key]), root);
}

function setAt(root, trail, value) {
  let node = root;
  trail.slice(0, -1).forEach((key) => (node = node[key]));
  node[trail[trail.length - 1]] = value;
}

/** The things a translation must carry over untouched. */
function mustKeep(text) {
  const tokens = new Set();
  for (const match of text.matchAll(/\{\w+\}/g)) tokens.add(match[0]);
  for (const match of text.matchAll(/https?:\/\/[^\s)"']+/g)) tokens.add(match[0]);
  for (const match of text.matchAll(/<\/?[a-zA-Z][^>]*>/g)) tokens.add(match[0]);
  for (const match of text.matchAll(/\d[\d.,]*/g)) tokens.add(match[0].replace(/[.,]$/, ''));
  return [...tokens];
}

function problems(source, translated) {
  if (typeof translated !== 'string' || translated.trim() === '') return ['empty'];
  return mustKeep(source).filter((token) => !translated.includes(token)).map((token) => `lost ${token}`);
}

async function ask(system, user) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 16000, system, messages: [{ role: 'user', content: user }] }),
  });
  if (!response.ok) throw new Error(`API ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const body = await response.json();
  return body.content.map((block) => block.text ?? '').join('');
}

function parseJsonArray(text) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end < start) throw new Error('no JSON array in reply');
  return JSON.parse(text.slice(start, end + 1));
}

async function translateBatch(batch, locale, glossary) {
  const system = [
    `You translate UI text and product copy for LeafLock PDF, a privacy-focused browser PDF tool, from English into ${locale.name} (${locale.native}, locale code ${locale.code}).`,
    'Reply with ONLY a JSON array of strings, the same length and order as the input array. No commentary, no code fences.',
    'Rules:',
    '- Keep every {placeholder} exactly as written. Never translate or reorder the braces content.',
    '- Keep numbers, URLs, file extensions (.pdf), HTML tags and entities exactly as written.',
    '- Keep product and brand names untranslated: LeafLock PDF, LeafLock, PDF, OCR, Bates, Google, Resend.',
    '- Be literal and precise about privacy and legal claims: do not strengthen, soften or add promises. "Never uploaded" must stay "never uploaded".',
    '- Match the register of the English: short UI labels stay short; sentences stay sentences.',
    '- Use the glossary below for these terms; they must be consistent everywhere.',
    `Glossary (English -> ${locale.name}):`,
    ...Object.entries(glossary).map(([term, note]) => `  ${term}: ${note}`),
  ].join('\n');
  const reply = await ask(system, JSON.stringify(batch.map((item) => item.text)));
  const parsed = parseJsonArray(reply);
  if (parsed.length !== batch.length) throw new Error(`expected ${batch.length} strings, got ${parsed.length}`);
  return parsed;
}

async function main() {
  const exportTo = option('export');
  if (exportTo) {
    const strings = leaves(await loadEnglish()).map((item) => item.text);
    await writeFile(exportTo, JSON.stringify(strings), 'utf8');
    console.log(`Exported ${strings.length} strings to ${exportTo}`);
    return;
  }

  const patchFrom = option('patch');
  if (patchFrom) {
    const patch = JSON.parse(await readFile(patchFrom, 'utf8'));
    const english = await loadEnglish();
    const all = leaves(english);
    for (const [code, strings] of Object.entries(patch)) {
      const locale = localeRegistry.find((item) => item.code === code);
      if (!locale || locale.code === 'en') {
        console.error(`--patch: "${code}" is not a translated locale.`);
        process.exit(2);
      }
      const outFile = path.join(root, 'src/i18n', locale.path, 'index.ts');
      const existing = (await import(`${pathToFileURL(outFile).href}?t=${Date.now()}`)).default;
      // Start from English, lay the locale's current strings over it, then the patch, so the file keeps every key.
      const result = structuredClone(english);
      for (const item of all) {
        const have = getAt(existing, item.trail);
        if (typeof have === 'string') setAt(result, item.trail, have);
      }
      const failed = [];
      for (const [dotted, text] of Object.entries(strings)) {
        const item = all.find((entry) => entry.trail.join('.') === dotted);
        if (!item) {
          failed.push({ trail: dotted, issues: ['no such English string'] });
          continue;
        }
        const issues = problems(item.text, text);
        if (issues.length === 0) setAt(result, item.trail, text);
        else failed.push({ trail: dotted, issues });
      }
      await writeCatalogue(result, failed, outFile, 'in-session translation (scripts/translate.mjs --patch)');
      if (failed.length > 0) process.exitCode = 1;
    }
    return;
  }

  const code = option('locale');
  const locale = localeRegistry.find((item) => item.code === code);
  if (!locale || locale.code === 'en') {
    console.error(`--locale must be one of: ${localeRegistry.filter((item) => item.code !== 'en').map((item) => item.code).join(', ')}`);
    process.exit(2);
  }

  const english = await loadEnglish();
  const importFrom = option('import');
  if (importFrom) {
    const incoming = JSON.parse(await readFile(importFrom, 'utf8'));
    const all = leaves(english);
    if (!Array.isArray(incoming) || incoming.length !== all.length) {
      console.error(`Expected an array of ${all.length} strings, got ${Array.isArray(incoming) ? incoming.length : typeof incoming}.`);
      process.exit(2);
    }
    const result = structuredClone(english);
    const failed = [];
    all.forEach((item, index) => {
      const issues = problems(item.text, incoming[index]);
      if (issues.length === 0) setAt(result, item.trail, incoming[index]);
      else failed.push({ trail: item.trail.join('.'), issues });
    });
    await writeCatalogue(result, failed, path.join(root, 'src/i18n', locale.path, 'index.ts'), 'in-session translation (scripts/translate.mjs --import)');
    return;
  }
  const outFile = path.join(root, 'src/i18n', locale.path, 'index.ts');
  const glossary = JSON.parse(await readFile(path.join(root, 'scripts/translate-glossary.json'), 'utf8'));

  // Resume: keep strings an earlier run already translated, unless --force.
  let existing = null;
  if (!flag('force')) {
    try {
      const module = await import(`${pathToFileURL(outFile).href}?t=${Date.now()}`).catch(() => null);
      existing = module?.default ?? null;
    } catch {
      existing = null;
    }
  }

  const all = leaves(english);
  const todo = all.filter((item) => {
    const have = existing ? getAt(existing, item.trail) : undefined;
    return !(typeof have === 'string' && have !== item.text);
  });
  const words = todo.reduce((sum, item) => sum + item.text.split(/\s+/).length, 0);
  console.log(`${locale.name}: ${all.length} strings, ${todo.length} to translate (~${words} words, ~${Math.round(words * 1.6 * 2)} tokens in+out).`);
  if (flag('dry-run')) return;
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set.');
    process.exit(2);
  }

  const result = structuredClone(english);
  if (existing) for (const item of all) {
    const have = getAt(existing, item.trail);
    if (typeof have === 'string') setAt(result, item.trail, have);
  }

  const failed = [];
  for (let start = 0; start < todo.length; start += BATCH_SIZE) {
    const batch = todo.slice(start, start + BATCH_SIZE);
    let out;
    for (let attempt = 1; attempt <= 2 && !out; attempt++) {
      try {
        out = await translateBatch(batch, locale, glossary);
      } catch (error) {
        console.error(`  batch ${start / BATCH_SIZE + 1} attempt ${attempt}: ${error.message}`);
      }
    }
    batch.forEach((item, index) => {
      const text = out?.[index];
      const issues = out ? problems(item.text, text) : ['batch failed'];
      if (issues.length === 0) setAt(result, item.trail, text);
      else failed.push({ trail: item.trail.join('.'), issues });
    });
    console.log(`  ${Math.min(start + BATCH_SIZE, todo.length)}/${todo.length}`);
  }

  await writeCatalogue(result, failed, outFile, `${MODEL}`);
}

async function writeCatalogue(result, failed, outFile, source) {
  await mkdir(path.dirname(outFile), { recursive: true });
  const header =
    `// Machine-translated from src/i18n/en by ${source}. Do not edit by hand:
` +
    `// a hand edit is overwritten by the next --force run. Fix the glossary or the English instead.
` +
    `// Strings that failed validation are left in English; see the run log.
`;
  await writeFile(outFile, `${header}export default ${JSON.stringify(result, null, 2)};
`, 'utf8');
  console.log(`Wrote ${path.relative(root, outFile)}`);
  if (failed.length > 0) {
    console.log(`${failed.length} string(s) left in English:`);
    for (const item of failed.slice(0, 40)) console.log(`  ${item.trail}: ${item.issues.join(', ')}`);
  }
}

await main();
