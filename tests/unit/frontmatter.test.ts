import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Content frontmatter is YAML, and an unquoted value that contains a colon followed by a space is not valid YAML:
 * `title: How to flatten a PDF: lock answers` is read as a mapping inside a scalar and `astro check` fails.
 *
 * This happened twice on 21-22 November 2026 (titles, then descriptions) and each time passed every unit test, because
 * no unit test parses the frontmatter. It was found by CI. This test reads the same text and fails with the file and
 * line, so the mistake costs a few seconds locally instead of a CI run.
 */
function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? markdownFiles(full) : full.endsWith('.md') ? [full] : [];
  });
}

describe('content frontmatter', () => {
  it('quotes every top-level value that holds ": " or " #", which plain YAML cannot', () => {
    const problems: string[] = [];
    for (const file of markdownFiles('src/content')) {
      const lines = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
      if (lines[0] !== '---') continue;
      const end = lines.indexOf('---', 1);
      for (let index = 1; index < end; index++) {
        const match = /^([A-Za-z][\w-]*):\s+(.+)$/.exec(lines[index]!);
        if (!match) continue; // indented lines, list items and block text are not top-level scalars
        const value = match[2]!.trim();
        if (/^["'[{|>&*!%@`]/.test(value)) continue; // quoted, flow collection, block scalar or tag
        if (/: |\s#/.test(value)) problems.push(`${file}:${index + 1}  ${match[1]}: ${value.slice(0, 70)}`);
      }
    }
    expect(problems, 'quote these values (wrap them in double quotes)').toEqual([]);
  });
});
