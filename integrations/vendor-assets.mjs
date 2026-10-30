// @ts-check
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, 'public', 'vendor');

/** @param {string} name */
function packageDir(name) {
  return path.dirname(require.resolve(`${name}/package.json`, { paths: [root] }));
}

/**
 * Copies the runtime files that pdf.js and tesseract.js fetch at run time into public/vendor,
 * so they're served from our own origin and the CSP can stay at connect-src 'self'.
 */
async function copyVendorAssets() {
  // Skip when this exact set is already in place; parallel builds would otherwise
  // overwrite files another build is reading (EBUSY on Windows).
  const versions = ['pdfjs-dist', 'tesseract.js', '@tesseract.js-data/eng', 'libheif-js']
    .map((name) => `${name}@${require(`${name}/package.json`).version}`)
    .join('\n');
  const stamp = path.join(outDir, '.versions');
  if ((await readFile(stamp, 'utf8').catch(() => '')) === versions) return false;

  const pdfjs = packageDir('pdfjs-dist');
  for (const dir of ['cmaps', 'iccs', 'standard_fonts', 'wasm']) {
    await cp(path.join(pdfjs, dir), path.join(outDir, 'pdfjs', dir), { recursive: true });
  }

  const tesseract = packageDir('tesseract.js');
  const tesseractCore = path.dirname(require.resolve('tesseract.js-core/package.json', { paths: [tesseract] }));
  await mkdir(path.join(outDir, 'tesseract'), { recursive: true });
  await cp(path.join(tesseract, 'dist', 'worker.min.js'), path.join(outDir, 'tesseract', 'worker.min.js'));
  // The worker picks one of these by CPU features; we only use the LSTM engine.
  for (const file of await readdir(tesseractCore)) {
    if (file.endsWith('-lstm.wasm.js')) {
      await cp(path.join(tesseractCore, file), path.join(outDir, 'tesseract', file));
    }
  }
  const eng = packageDir('@tesseract.js-data/eng');
  await cp(path.join(eng, '4.0.0', 'eng.traineddata.gz'), path.join(outDir, 'tesseract', 'lang', 'eng.traineddata.gz'));

  // libheif is LGPL-3.0, and these two files are copied rather than bundled on purpose:
  // the loader stays a plain script and the codec stays a separate .wasm, so it remains a
  // replaceable component — the condition that makes an LGPL library usable in a closed
  // product (docs/TODO.md §6a). Bundling either one would defeat that, and would also put
  // 1.5MB of codec into a chunk every visitor downloads. The LICENSE ships beside them
  // because the licence requires it.
  const libheif = path.join(packageDir('libheif-js'), 'libheif-wasm');
  await mkdir(path.join(outDir, 'libheif'), { recursive: true });
  for (const file of ['libheif.js', 'libheif.wasm', 'LICENSE']) {
    await cp(path.join(libheif, file), path.join(outDir, 'libheif', file));
  }

  await writeFile(stamp, versions);
  return true;
}

/** @returns {import('astro').AstroIntegration} */
export function vendorAssets() {
  return {
    name: 'leaflock:vendor-assets',
    hooks: {
      'astro:config:setup': async ({ logger }) => {
        if (await copyVendorAssets()) logger.info("Copied pdf.js, tesseract.js and libheif runtime files to public/vendor");
      },
    },
  };
}
