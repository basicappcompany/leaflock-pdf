import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { localePath } from '../../src/lib/localePath';

describe('localePath', () => {
  it('keeps English paths bare and prefixes the other languages', () => {
    expect(localePath('/login/', '/pricing/')).toBe('/login/');
    expect(localePath('/login/', '/de/pricing/')).toBe('/de/login/');
    expect(localePath('/account/', '/pt-br/merge-pdf/')).toBe('/pt-br/account/');
    expect(localePath('/login/', '/')).toBe('/login/');
    expect(localePath('/login/', '/delete-pdf-pages/')).toBe('/login/');
  });
});

describe('client islands never send a reader to the English page of a localized site', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : /\.(tsx|ts)$/.test(name) ? [path] : [];
    });

  it('has no literal /login/, /account/ or /pricing/ target in a component', () => {
    const offenders: string[] = [];
    for (const file of walk('src/components')) {
      readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
        if (/(href=|href:|Href:|location\.(href|replace)\s*[=(])\s*["'{(]*\s*["']\/(login|account|pricing)\//.test(line)) {
          offenders.push(`${file}:${index + 1}: ${line.trim()}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});
