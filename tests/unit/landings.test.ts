import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { en } from '../../src/i18n/en';
import { landingsMore } from '../../src/i18n/en/landingsMore';
import { isEnglishOnly, landingPage } from '../../src/i18n/landingPage';
import { landings, tools } from '../../src/tools/registry';

const contentPages = readdirSync('src/content/pages/en').map((file) => file.replace(/\.md$/, ''));
const otherRoutes = ['guides', 'compare', 'pricing', 'tools', 'login', 'account', 'dashboard', 'verify', 'business', 'help', 'about', 'contact'];

describe('landing pages', () => {
  it('have a unique id and a unique slug that no tool, page or route already uses', () => {
    const ids = landings.map((landing) => landing.id);
    const slugs = landings.map((landing) => landing.slug);
    expect(new Set(ids).size, 'duplicate landing id').toBe(ids.length);
    expect(new Set(slugs).size, 'duplicate landing slug').toBe(slugs.length);
    const taken = new Set<string>([...tools.map((tool) => tool.slug), ...contentPages, ...otherRoutes]);
    for (const slug of slugs) expect(taken.has(slug), `${slug} collides with a tool, page or route`).toBe(false);
  });

  it('point at a real tool', () => {
    const toolIds = new Set<string>(tools.map((tool) => tool.id));
    for (const landing of landings) expect(toolIds.has(landing.toolId), `${landing.id} -> ${landing.toolId}`).toBe(true);
  });

  it('all have text, and the English-only ones live in landingsMore and nowhere else', () => {
    const translatedIds = Object.keys(en.landings).sort();
    const englishOnlyIds = landings.filter((landing) => 'enOnly' in landing).map((landing) => landing.id).sort();
    expect(Object.keys(landingsMore).sort(), 'landingsMore must hold exactly the enOnly landings').toEqual(englishOnlyIds);
    expect(translatedIds, 'en.landings must hold exactly the translated landings').toEqual(
      landings.filter((landing) => !('enOnly' in landing)).map((landing) => landing.id).sort(),
    );
    for (const landing of landings) {
      const page = landingPage('en', landing.id);
      expect(page.title, `${landing.id} title`).toBeTruthy();
      expect(page.howTo.length, `${landing.id} how-to steps`).toBeGreaterThanOrEqual(3);
      expect((page.faq ?? []).length, `${landing.id} FAQ`).toBeGreaterThanOrEqual(3);
      expect(isEnglishOnly(landing.id)).toBe('enOnly' in landing);
    }
  });

  it('read the same in every language for an English-only landing', () => {
    for (const landing of landings.filter((item) => 'enOnly' in item)) {
      expect(landingPage('de', landing.id).title).toBe(landingPage('en', landing.id).title);
    }
  });

  it('have their own title, meta title and meta description', () => {
    const seen = new Map<string, string>();
    for (const landing of landings) {
      const page = landingPage('en', landing.id);
      for (const [field, value] of [['title', page.title], ['metaTitle', page.metaTitle], ['metaDescription', page.metaDescription]] as const) {
        const key = `${field}:${value}`;
        expect(seen.get(key), `${landing.id} repeats ${field} of ${seen.get(key)}`).toBeUndefined();
        seen.set(key, landing.id);
      }
      expect(page.metaDescription.length, `${landing.id} meta description length`).toBeGreaterThanOrEqual(80);
      expect(page.metaDescription.length, `${landing.id} meta description length`).toBeLessThanOrEqual(175);
    }
  });

  it('keep a size landing’s preset in step with its slug', () => {
    for (const landing of landings) {
      const match = /^compress-pdf-to-(\d+)(kb|mb)$/.exec(landing.slug);
      if (!match) continue;
      expect('preset' in landing ? landing.preset : undefined, landing.slug).toEqual({
        mode: 'size',
        size: match[1],
        unit: match[2]!.toUpperCase(),
      });
      expect(landingPage('en', landing.id).title, landing.slug).toContain(`${match[1]} ${match[2]!.toUpperCase()}`);
    }
  });
});
