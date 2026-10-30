import { zipSync, type Zippable } from 'fflate';
import type { OpContext, OutputFile } from '../types';

export interface ZipArgs {
  files: OutputFile[];
  outputName: string;
}

/** Bundles several outputs into one .zip. PDFs and images are already compressed, so entries are stored as-is. */
export async function zip({ files, outputName }: ZipArgs, _ctx: OpContext): Promise<OutputFile[]> {
  const entries: Zippable = {};
  for (const file of files) {
    entries[uniqueName(file.name, entries)] = [file.bytes, { level: 0 }];
  }
  return [{ name: outputName, bytes: zipSync(entries) as Uint8Array<ArrayBuffer>, type: 'application/zip' }];
}

/** "a.pdf", "a.pdf" → "a.pdf", "a (2).pdf" */
function uniqueName(name: string, taken: Zippable): string {
  if (!(name in taken)) return name;
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let n = 2; ; n++) {
    const candidate = `${stem} (${n})${ext}`;
    if (!(candidate in taken)) return candidate;
  }
}
