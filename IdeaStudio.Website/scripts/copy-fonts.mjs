import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const FONTS_OUT = 'wwwroot/fonts';

// @fontsource-variable/inter ships one latin wght-normal variable file;
// find it dynamically because the filename encodes a version hash.
async function findFile(dir, predicate) {
  const entries = await readdir(dir);
  const match = entries.find(predicate);
  if (!match) throw new Error(`No matching font file in ${dir}`);
  return join(dir, match);
}

const interDir  = 'node_modules/@fontsource-variable/inter/files';
const monoDir   = 'node_modules/@fontsource/jetbrains-mono/files';
const serifDir  = 'node_modules/@fontsource/instrument-serif/files';

const interSrc  = await findFile(interDir,  f => f.includes('latin-wght-normal.woff2'));
const monoSrc   = await findFile(monoDir,   f => f.includes('latin-400-normal.woff2'));
// Editorial display — italic only, following the same self-host pattern as the other faces.
const serifSrc  = await findFile(serifDir,  f => f.includes('latin-400-italic.woff2'));

const targets = [
  [interSrc, join(FONTS_OUT, 'inter-variable.woff2')],
  [monoSrc,  join(FONTS_OUT, 'jetbrains-mono.woff2')],
  [serifSrc, join(FONTS_OUT, 'instrument-serif-italic.woff2')],
];

for (const [src, dst] of targets) {
  await mkdir(dirname(dst), { recursive: true });
  await copyFile(src, dst);
  console.log(`✓ ${src} → ${dst}`);
}
