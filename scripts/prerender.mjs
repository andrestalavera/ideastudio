// Build-time prerender for the Blazor WASM site.
//
// Blazor WASM renders client-side, so social scrapers and non-JS crawlers see an
// empty shell (and first paint is blank until WASM boots). This script boots each
// route in headless Chrome and writes the fully-rendered HTML to the publish output
// as <route>/index.html, so:
//   - crawlers/scrapers get real content + per-page <head> (title, canonical,
//     hreflang, Open Graph, JSON-LD),
//   - first paint shows content immediately, then the WASM app hydrates over it.
//
// Usage: node scripts/prerender.mjs <publishWwwroot>
// Chromium: CHROME_PATH, else a locally installed Chrome/Chromium (manual deploys from a
// workstation), else @sparticuz/chromium-min (Linux CI). Fail-safe: the caller
// (netlify-build.sh) treats any failure as a skip so the SPA still deploys.

import http from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'publish/wwwroot';
const PORT = 8791;
const FN_MODULES = path.resolve('netlify/functions/node_modules');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain',
  '.dll': 'application/octet-stream', '.dat': 'application/octet-stream', '.blat': 'application/octet-stream',
};

async function serve(rootDir) {
  const server = http.createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath = path.join(rootDir, urlPath);
      const isFile = existsSync(filePath) && (await stat(filePath)).isFile();
      if (!isFile) filePath = path.join(rootDir, 'index.html'); // SPA fallback
      const body = await readFile(filePath);
      res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream');
      res.end(body);
    } catch {
      res.statusCode = 404; res.end('not found');
    }
  });
  await new Promise((r) => server.listen(PORT, r));
  return server;
}

function routesFromSitemap(xml) {
  const paths = new Set(['/fr', '/en']);
  const re = /<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g;
  let m;
  while ((m = re.exec(xml))) {
    let p = m[1].replace(/\/$/, '');
    if (p) paths.add(p);
  }
  return [...paths];
}

const LOCAL_CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

// The static index.html template carries generic <meta>/<link> tags; SeoHead appends the
// page-specific ones after them. Keep only the last occurrence of each so scrapers that read
// the first tag get the page's own description, canonical and Open Graph data.
function dedupeHeadTags() {
  const keyOf = (el) => {
    if (el.tagName === 'META') {
      const k = el.getAttribute('name') || el.getAttribute('property');
      return k ? `meta:${k}` : null;
    }
    if (el.tagName === 'LINK' && el.getAttribute('rel') === 'canonical') return 'link:canonical';
    if (el.tagName === 'LINK' && el.getAttribute('rel') === 'alternate' && el.hasAttribute('hreflang')) {
      return `link:alternate:${el.getAttribute('hreflang')}`;
    }
    return null;
  };
  const seen = new Set();
  const nodes = [...document.head.querySelectorAll('meta, link')].reverse();
  for (const el of nodes) {
    const key = keyOf(el);
    if (!key) continue;
    if (seen.has(key)) el.remove();
    else seen.add(key);
  }
}

async function main() {
  const rootDir = path.resolve(ROOT);
  if (!existsSync(path.join(rootDir, 'index.html'))) {
    throw new Error(`No index.html in ${rootDir}`);
  }

  const puppeteer = (await import(path.join(FN_MODULES, 'puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'))).default;
  let executablePath = process.env.CHROME_PATH || LOCAL_CHROME_CANDIDATES.find((p) => existsSync(p));
  let chromiumArgs = ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'];
  if (executablePath) console.log(`prerender: using ${executablePath}`);
  if (!executablePath) {
    const chromium = (await import(path.join(FN_MODULES, '@sparticuz/chromium-min/build/esm/index.js'))).default;
    const pack = process.env.CHROMIUM_PACK_URL
      || 'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar';
    executablePath = await chromium.executablePath(pack);
    chromiumArgs = chromium.args;
  }

  let sitemap = '';
  try { sitemap = await readFile(path.join(rootDir, 'sitemap.xml'), 'utf8'); } catch { /* none */ }
  const routes = routesFromSitemap(sitemap);
  console.log(`prerender: ${routes.length} routes`);

  const server = await serve(rootDir);
  const browser = await puppeteer.launch({ executablePath, args: chromiumArgs, headless: true });
  let ok = 0;
  try {
    for (const route of routes) {
      const page = await browser.newPage();
      try {
        await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'networkidle2', timeout: 45000 });
        await page.waitForSelector('main, .ds-hero, .ds-footer', { timeout: 30000 });
        await new Promise((r) => setTimeout(r, 600));
        await page.evaluate(dedupeHeadTags);
        const html = '<!DOCTYPE html>\n' + (await page.evaluate(() => document.documentElement.outerHTML));
        const outDir = route === '/' ? rootDir : path.join(rootDir, route);
        await mkdir(outDir, { recursive: true });
        await writeFile(path.join(outDir, 'index.html'), html, 'utf8');
        ok++;
        console.log(`  ✓ ${route}`);
      } catch (e) {
        console.log(`  ✗ ${route}: ${e.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`prerender: ${ok}/${routes.length} routes written`);
  if (ok === 0) throw new Error('prerender produced no pages');
  if (ok < routes.length) console.warn(`prerender: WARNING ${routes.length - ok} route(s) not prerendered, crawlers will get the shell for those`);
}

main().catch((e) => { console.error('prerender failed:', e.message); process.exit(1); });
