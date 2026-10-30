/**
 * Decodes HEIC/HEIF photos with libheif, compiled to WebAssembly.
 *
 * **Why this is not a worker operation, and not a bundler import.** Two separate
 * constraints land on the same answer:
 *
 * 1. `src/lib/pdf/ops/imagesToPdf.ts` runs in the job worker, which Vite builds as `iife`
 *    — a format that cannot code-split, so an import there is *inlined* and 1.5MB of
 *    codec joins the chunk every tool fetches (`docs/process.md` §1). So the decode
 *    happens here, on the main thread, before the bytes ever reach the worker.
 * 2. libheif is **LGPL-3.0**. Keeping the loader a plain script and the codec a separate
 *    `.wasm`, both copied into `public/vendor/libheif/` by `integrations/vendor-assets.mjs`,
 *    keeps it a genuinely replaceable component rather than something fused into our own
 *    build — the condition that makes an LGPL library usable in a closed product
 *    (`docs/TODO.md` §6a).
 *
 * Both files are served from our own origin, so `connect-src 'self'` is untouched; the
 * CSP already allows `'wasm-unsafe-eval'` for pdf.js and tesseract, which is what lets
 * the codec compile. Nothing is fetched until someone actually converts a HEIC.
 *
 * Decode only — libheif-js ships no encoder, which is also the materially lower-risk
 * side of the HEVC patent question recorded in `docs/TODO.md` §6a.
 */

/** The shape of the global the vendored script installs. Only what we call is typed. */
interface HeifImage {
  get_width(): number;
  get_height(): number;
  display(target: { data: Uint8ClampedArray; width: number; height: number }, done: (result: unknown) => void): void;
}
interface HeifModule {
  HeifDecoder: new () => { decode(bytes: Uint8Array): HeifImage[] };
}

const VENDOR = '/vendor/libheif';

let modulePromise: Promise<HeifModule> | undefined;

/** `true` when the bytes start with an ISO base-media `ftyp` box naming a HEIF brand. */
export function isHeic(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const tag = String.fromCharCode(...bytes.subarray(4, 8));
  if (tag !== 'ftyp') return false;
  const brand = String.fromCharCode(...bytes.subarray(8, 12));
  return ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1', 'heif'].includes(brand);
}

/**
 * Loads the vendored codec once: the loader script, then its `.wasm` as bytes we fetch
 * ourselves. Both come from our own origin, so nothing here touches `connect-src 'self'`.
 */
function loadLibheif(): Promise<HeifModule> {
  modulePromise ??= (async () => {
    const factory = await loadFactory();
    // The codec bytes are fetched here rather than left to emscripten's own `locateFile`
    // resolution, which resolved them against the page and 404'd. Handing over
    // `wasmBinary` takes the guesswork out, and a same-origin fetch is exactly what
    // `connect-src 'self'` allows.
    const wasmBinary = await fetch(`${VENDOR}/libheif.wasm`).then((response) => {
      if (!response.ok) throw new Error(`libheif.wasm: ${response.status}`);
      return response.arrayBuffer();
    });
    return factory({ wasmBinary });
  })();
  modulePromise.catch(() => {
    modulePromise = undefined;
  });
  return modulePromise;
}

type HeifFactory = (options: object) => Promise<HeifModule>;

/** Adds the vendored loader as a script tag — it is a classic Emscripten script, so it
 * cannot be `import`ed, and the CSP blocks `eval`. It installs a `libheif` global. */
function loadFactory(): Promise<HeifFactory> {
  const existing = (window as unknown as { libheif?: HeifFactory }).libheif;
  if (existing) return Promise.resolve(existing);

  return new Promise<HeifFactory>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${VENDOR}/libheif.js`;
    script.onload = () => {
      const factory = (window as unknown as { libheif?: HeifFactory }).libheif;
      if (factory) resolve(factory);
      else reject(new Error('libheif loaded but exposed no module'));
    };
    script.onerror = () => reject(new Error('libheif failed to load'));
    document.head.appendChild(script);
  });
}

export interface DecodedImage {
  /** PNG or JPEG bytes, ready for `imagesToPdf` to embed like any other photo. */
  bytes: Uint8Array;
  type: 'image/jpeg' | 'image/png';
  width: number;
  height: number;
}

/**
 * Decodes the first image in a HEIC file and re-encodes it as JPEG, which is what a
 * photo out of a phone camera is anyway. A HEIC can hold a burst or a live-photo
 * sequence; only the primary image is taken, which is what every other converter does
 * and what the tool page says.
 */
export async function heicToJpeg(bytes: Uint8Array, quality = 0.92): Promise<DecodedImage> {
  const libheif = await loadLibheif();
  const images = new libheif.HeifDecoder().decode(bytes);
  const image = images[0];
  if (!image) throw new Error('no image in HEIC file');

  const width = image.get_width();
  const height = image.get_height();
  const rgba = new Uint8ClampedArray(width * height * 4);
  await new Promise<void>((resolve, reject) => {
    image.display({ data: rgba, width, height }, (result) => (result ? resolve() : reject(new Error('HEIC decode failed'))));
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('no 2d canvas context');
  context.putImageData(new ImageData(rgba, width, height), 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new Error('could not encode the decoded HEIC');
  return { bytes: new Uint8Array(await blob.arrayBuffer()), type: 'image/jpeg', width, height };
}
