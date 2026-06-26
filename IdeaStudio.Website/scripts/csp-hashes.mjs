// Computes the CSP sha256 source hashes for every inline <script> block in
// wwwroot/index.html (the ones without a `src` attribute). Browsers hash the
// EXACT bytes between <script> and </script> — whitespace included — so this is
// the single source of truth for the `script-src 'sha256-...'` entries in
// netlify.toml. Run it whenever an inline bootstrap script changes:
//
//   node scripts/csp-hashes.mjs
//
// then paste the printed `'sha256-...'` values into the CSP `script-src` list.

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const indexHtml = path.resolve(here, '..', 'wwwroot', 'index.html');

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

function hasSrc(attrs) {
  return /\bsrc\s*=/.test(attrs);
}

function sha256(content) {
  return "'sha256-" + createHash('sha256').update(content, 'utf8').digest('base64') + "'";
}

const html = await readFile(indexHtml, 'utf8');
const hashes = [];
let match;
let index = 0;
while ((match = SCRIPT_RE.exec(html)) !== null) {
  const [, attrs, body] = match;
  if (hasSrc(attrs)) continue;
  index += 1;
  hashes.push({ index, hash: sha256(body) });
}

if (hashes.length === 0) {
  console.error('No inline scripts found — check the index.html path.');
  process.exit(1);
}

console.log(`Inline <script> blocks hashed: ${hashes.length}`);
for (const { index: i, hash } of hashes) {
  console.log(`  #${i}  ${hash}`);
}
console.log('\nscript-src additions:');
console.log('  ' + hashes.map((h) => h.hash).join(' '));
