import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Roadmap Phase 3: a guide answers its query in the first two sentences, so it can be quoted
 * by a person skimming or by an assistant. The answer is a paragraph that opens the body,
 * before any scene-setting. A guide with no answer is the drift this catches.
 */
const dir = 'src/content/guides/en';

describe('guides open with a direct answer', () => {
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    it(file, () => {
      const text = readFileSync(join(dir, file), 'utf8').replace(/\r\n/g, '\n');
      const body = text.replace(/^---\n[\s\S]*?\n---\n+/, '');
      const first = body.split('\n\n')[0] ?? '';
      expect(first.startsWith('**Short answer:** '), `${file} must open with **Short answer:**`).toBe(true);
      // Two sentences at most: count full stops that end a sentence, not those inside file names or numbers.
      const sentences = first.replace(/\*\*Short answer:\*\*/, '').match(/[.!?](\s|$)/g) ?? [];
      expect(sentences.length, `${file}'s short answer should be one or two sentences`).toBeLessThanOrEqual(2);
    });
  }
});
