import { fileURLToPath } from 'node:url';

/**
 * Drops the standard-font metrics we never embed out of the bundle.
 *
 * pdf-lib's `packages/standard-fonts/Font.js` imports the metrics for all fourteen PDF
 * standard fonts eagerly, at the top of the module, and files them in a lookup object.
 * That pattern defeats tree-shaking, so every one of them lands in the job-worker chunk,
 * when this product only ever embeds the four Helvetica weights (`StandardFonts.Helvetica`
 * plus its bold/oblique/bold-oblique siblings, added for `blocksToPdf.ts`'s Office → PDF
 * rendering — update `KEPT` here, not just the call site, the day a fifth one is needed).
 * Dropping the other ten took the worker from 253KB to 168KB gzipped when this first
 * shipped with Helvetica alone; see `docs/design.md` §4c for the measured history.
 *
 * Done with `resolve.alias` rather than a Vite plugin, and that choice is load-bearing.
 * The worker is a `new Worker(new URL('./pdf.worker.ts', …))` import, which Vite bundles
 * in a **separate build with its own plugin list**: a plugin registered in `vite.plugins`
 * never sees the worker's modules, and supplying `vite.worker.plugins` *replaces* that
 * build's whole pipeline rather than adding to it — which silently cost the worker the
 * plugins that handle dependency interop and broke every job with "invalid zlib data".
 * `resolve` is inherited by worker builds, so aliasing reaches the worker without
 * touching how it is built.
 *
 * Each dropped font resolves to `standard-font-stub.json`, a sentinel string, because
 * `Font.js` needs the import to resolve. `Font.load` only reads the value when that font
 * is actually embedded, so an `embedFont(StandardFonts.Courier)` added in future throws
 * rather than quietly drawing wrong glyph widths. pdf-lib's own error there is not
 * especially clear, which is why the guard is a pair of tests:
 * `tests/unit/standardFonts.test.ts` fails if `src/` starts naming another standard font,
 * and `tests/e2e/performance.spec.ts` fails if the stub stops landing in the built
 * chunk — so a dependency bump that renames these files is caught in CI rather than in
 * someone's download.
 *
 * To start using another standard font, move its name from `DROPPED` to `KEPT`.
 */

const KEPT = ['Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique'];

/** Every standard font pdf-lib carries metrics for, as `Font.js` imports them. */
const ALL = [
  'Courier',
  'Courier-Bold',
  'Courier-Oblique',
  'Courier-BoldOblique',
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
  'Times-Roman',
  'Times-Bold',
  'Times-Italic',
  'Times-BoldItalic',
  'Symbol',
  'ZapfDingbats',
];

export const FONT_NOT_BUNDLED = 'LEAFLOCK_STANDARD_FONT_NOT_BUNDLED';

export function standardFonts() {
  const stub = fileURLToPath(new URL('./standard-font-stub.json', import.meta.url));
  const dropped = ALL.filter((name) => !KEPT.includes(name));

  return {
    name: 'leaflock:standard-fonts',
    hooks: {
      /** @param {{ updateConfig: Function, logger: any }} options */
      'astro:config:setup': ({ updateConfig, logger }) => {
        updateConfig({
          vite: {
            resolve: {
              // Exact specifiers, as written in pdf-lib's Font.js, rather than a pattern:
              // this list is the policy, and it should be obvious which fonts are gone.
              alias: dropped.map((name) => ({ find: `./${name}.compressed.json`, replacement: stub })),
            },
          },
        });
        logger.info(`${dropped.length} unused standard fonts dropped from the bundle; keeping ${KEPT.join(', ')}`);
      },
    },
  };
}
