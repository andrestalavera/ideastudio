// prose — enhances a rendered article body (Pages/BlogArticle.razor, via ISceneTheme).
// Kept out of the cinema bundle: only an article page loads it, and mermaid (large)
// is a further dynamic import fetched only when the article holds a diagram.
//
//   enhance(root) -> colours every <code class="language-*"> (highlight.js, a few
//                    grammars), then renders every <pre class="mermaid"> to SVG.
// Diagrams follow the page theme: colours are read from the design tokens and the
// diagrams are drawn again when <html data-theme> changes.

import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import csharp from 'highlight.js/lib/languages/csharp';
import json from 'highlight.js/lib/languages/json';
import powershell from 'highlight.js/lib/languages/powershell';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('json', json);
hljs.registerLanguage('powershell', powershell);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);
hljs.configure({ ignoreUnescapedHTML: true });

let mermaidPromise = null;
let diagramCount = 0;
let themeObserver = null;
const diagrams = new Set(); // { host, source } currently on the page

function highlight(root) {
  for (const code of root.querySelectorAll('pre > code[class*="language-"]')) {
    if (code.dataset.highlighted) continue;
    const lang = /language-([\w-]+)/.exec(code.className)?.[1];
    if (lang && hljs.getLanguage(lang)) hljs.highlightElement(code);
  }
}

function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function loadMermaid() {
  mermaidPromise ??= import('mermaid').then(m => m.default);
  return mermaidPromise;
}

function configure(mermaid) {
  // Nodes sit one step above the frame; the light theme has no such step (both white).
  const surface = token('--bg-surface');
  const raised = token('--bg-raised');
  const node = raised === surface ? token('--bg-deep') : raised;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    htmlLabels: false,
    fontFamily: token('--font-sans'),
    flowchart: { htmlLabels: false, curve: 'basis' },
    themeVariables: {
      fontSize: '15px',
      background: surface,
      primaryColor: node,
      primaryTextColor: token('--fg'),
      primaryBorderColor: token('--ir-duck'),
      secondaryColor: node,
      tertiaryColor: surface,
      lineColor: token('--fg-muted'),
      textColor: token('--fg'),
      edgeLabelBackground: surface,
    },
  });
}

async function draw(mermaid, diagram) {
  try {
    const { svg } = await mermaid.render(`ds-mermaid-${++diagramCount}`, diagram.source);
    diagram.host.innerHTML = svg;
    diagram.host.dataset.processed = 'true';
  } catch (err) {
    // The encoded source stays readable in the <pre> when a diagram cannot render.
    console.warn('[prose] diagram not rendered', err);
  }
}

async function redrawAll() {
  for (const diagram of diagrams) {
    if (!diagram.host.isConnected) diagrams.delete(diagram);
  }
  if (diagrams.size === 0) return;
  const mermaid = await loadMermaid();
  configure(mermaid);
  for (const diagram of diagrams) await draw(mermaid, diagram);
}

async function renderDiagrams(root) {
  const hosts = [...root.querySelectorAll('pre.mermaid:not([data-processed])')];
  if (hosts.length === 0) return;
  const mermaid = await loadMermaid();
  configure(mermaid);
  for (const host of hosts) {
    const diagram = { host, source: host.textContent };
    diagrams.add(diagram);
    await draw(mermaid, diagram);
  }
  themeObserver ??= new MutationObserver(redrawAll);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

export async function enhance(root) {
  if (!root) return;
  highlight(root);
  await renderDiagrams(root);
}
