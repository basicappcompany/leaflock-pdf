/// <reference types="node" />
import { readFile } from 'node:fs/promises';
import { test } from '@playwright/test';
import { en } from '../src/i18n/en';
import { landings, tools, toolById } from '../src/tools/registry';

const categoryColor = { organize: '#2a7548', convert: '#1d6fd8', edit: '#b4561b', secure: '#6b3fa0' } as const;

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function template(title: string, subtitle: string, accent: string, logo: string): string {
  return `<!doctype html><html><head><style>
    body { margin: 0; width: 1200px; height: 630px; font-family: 'Segoe UI', system-ui, sans-serif;
      background: #f6f7f4; color: #1b221e; display: flex; flex-direction: column; justify-content: space-between;
      box-sizing: border-box; padding: 72px 80px; border-top: 18px solid ${accent}; }
    .brand { display: flex; align-items: center; gap: 18px; font-size: 38px; font-weight: 700; }
    .brand img { width: 64px; height: 64px; }
    h1 { margin: 0; font-size: 88px; line-height: 1.05; letter-spacing: -1px; }
    p { margin: 22px 0 0; font-size: 36px; line-height: 1.3; color: #4a554e; max-width: 1000px; }
    .promise { font-size: 30px; font-weight: 600; color: ${accent}; }
  </style></head><body>
    <div class="brand"><img src="data:image/svg+xml;base64,${logo}" alt="">LeafLock PDF</div>
    <div><h1>${escape(title)}</h1><p>${escape(subtitle)}</p></div>
    <div class="promise">Private by design · Files never leave your device</div>
  </body></html>`;
}

test('render share images', async ({ page }) => {
  const logo = (await readFile('public/favicon.svg')).toString('base64');
  const images = [
    { file: 'default', title: 'Private PDF tools', subtitle: en.common.site.tagline, accent: '#2a7548' },
    ...tools.map((tool) => ({
      file: tool.slug,
      title: en.tools[tool.id].title,
      subtitle: en.tools[tool.id].summary,
      accent: categoryColor[tool.category],
    })),
    ...landings.map((landing) => ({
      file: landing.slug,
      title: en.landings[landing.id].title,
      subtitle: en.landings[landing.id].summary,
      accent: categoryColor[toolById(landing.toolId).category],
    })),
  ];
  for (const image of images) {
    await page.setContent(template(image.title, image.subtitle, image.accent, logo));
    await page.screenshot({ path: `public/og/${image.file}.png` });
  }
});
