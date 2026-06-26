// Build-time static metadata shells for the CSR-only Blazor WASM site.
//
// The app renders client-side, so crawlers / LinkedIn / Slack / Facebook that read
// only the served HTML (no JS) get the bare wwwroot/index.html shell with FR-baseline
// metadata for every route. This script clones index.html into one physical file per
// top-level localized route (e.g. wwwroot/en/services/index.html) with a route-correct
// <head>: <title>, description, canonical, hreflang alternates (fr/en/x-default),
// Open Graph + Twitter tags, og:locale, <html lang>, and JSON-LD where applicable.
//
// Netlify serves an existing file before the SPA fallback (`/* -> /index.html 200`,
// no `force`), so these shells are served at their paths and the SPA still handles
// every unmatched route. On Netlify the heavier puppeteer pass (scripts/prerender.mjs)
// overwrites these with fully-rendered HTML when it succeeds; when it fails these
// remain as the crawler-correct fallback. Locally (dotnet build) only this pass runs.
//
// Data-driven: the route list and FR/EN URL map are parsed from the canonical source,
// Services/ILocalizedRoute.cs (StaticRoutes); localized section labels come from
// wwwroot/i18n/{fr,en}.json. SEO copy per pageId lives in the SEO table below — new
// static routes are still emitted with a sensible fallback (and logged), never skipped.
//
// Idempotent. NEVER writes back to the source wwwroot/index.html (read-only template);
// only writes <culture>/.../index.html subfolders. Usage:
//   node scripts/prerender-shells.mjs [outputWwwroot]   (defaults to ./wwwroot)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const sourceWwwroot = path.join(projectRoot, 'wwwroot');
const outRoot = path.resolve(process.argv[2] || sourceWwwroot);

const ORIGIN = 'https://ideastud.io';
const OG_IMAGE = `${ORIGIN}/images/andres-talavera.jpeg`;
const OG_IMAGE_ALT = 'Andrés Talavera — Consultant .NET & Azure';
const JOB_TITLE = {
  fr: 'Consultant .NET & Azure, techlead et formateur',
  en: '.NET & Azure consultant, tech lead and trainer',
};
const OG_LOCALE = { fr: 'fr_FR', en: 'en_US' };

// Per-pageId SEO copy. Editorial, intentionally hand-written (titles/descriptions are
// not derivable from the route map). Keyed by the pageId emitted in StaticRoutes.
// `og` profile|website. `schema` opts a page into JSON-LD (see jsonLdFor).
const SEO = {
  home: {
    og: 'profile', schema: ['WebSite', 'Person'],
    fr: {
      title: 'IdeaStud.io — Andrés Talavera, Consultant .NET & Azure',
      description: 'Andrés Talavera — Consultant .NET & Azure, techlead, formateur. Lyon et à distance.',
    },
    en: {
      title: 'IdeaStud.io — Andrés Talavera, .NET & Azure Consultant',
      description: 'Andrés Talavera — .NET & Azure consultant, tech lead and trainer. Lyon and remote.',
    },
  },
  'services.hub': {
    og: 'website',
    fr: {
      title: 'Services — Conseil .NET & Azure, techlead, formation | IdeaStud.io',
      description: "Conseil en architecture .NET/Azure, accompagnement techlead et formation sur mesure. Des plateformes qui tiennent la charge et restent maintenables.",
    },
    en: {
      title: 'Services — .NET & Azure consulting, tech lead, training | IdeaStud.io',
      description: 'Architecture consulting for .NET/Azure, tech-lead mentoring and tailored training. Platforms that scale and stay maintainable.',
    },
  },
  training: {
    og: 'website',
    fr: {
      title: 'Formations .NET, C# moderne, Blazor & Azure | IdeaStud.io',
      description: "Formations sur mesure en .NET, C# moderne, Blazor et Azure, animées par un consultant qui code encore. En présentiel à Lyon ou à distance.",
    },
    en: {
      title: 'Training — .NET, modern C#, Blazor & Azure | IdeaStud.io',
      description: 'Tailored training in .NET, modern C#, Blazor and Azure, taught by a consultant who still ships code. On-site in Lyon or remote.',
    },
  },
  about: {
    og: 'profile', schema: ['Person'],
    fr: {
      title: 'À propos — Andrés Talavera | IdeaStud.io',
      description: "Parcours, valeurs et façon de travailler d'Andrés Talavera, consultant .NET & Azure, techlead et formateur basé à Lyon.",
    },
    en: {
      title: 'About — Andrés Talavera | IdeaStud.io',
      description: 'Background, values and way of working of Andrés Talavera — .NET & Azure consultant, tech lead and trainer based in Lyon.',
    },
  },
  faq: {
    og: 'website',
    fr: {
      title: 'Questions fréquentes | IdeaStud.io',
      description: 'Réponses aux questions courantes sur mes missions de conseil .NET/Azure, le techlead, la formation et les modalités de collaboration.',
    },
    en: {
      title: 'Frequently asked questions | IdeaStud.io',
      description: 'Answers to common questions about my .NET/Azure consulting, tech-lead engagements, training and how we can work together.',
    },
  },
  contact: {
    og: 'website',
    fr: {
      title: 'Contact | IdeaStud.io',
      description: 'Discutons de votre projet .NET/Azure, techlead ou formation. Contact direct, à Lyon ou à distance.',
    },
    en: {
      title: 'Contact | IdeaStud.io',
      description: "Let's talk about your .NET/Azure, tech-lead or training project. Get in touch — Lyon or remote.",
    },
  },
  blog: {
    og: 'website',
    fr: {
      title: 'Blog — .NET, Azure, IA & qualité logicielle | IdeaStud.io',
      description: "Articles sur le développement .NET et Azure, l'architecture, l'IA dans le code et la qualité logicielle, par Andrés Talavera.",
    },
    en: {
      title: 'Blog — .NET, Azure, AI & software quality | IdeaStud.io',
      description: 'Articles on .NET and Azure development, architecture, AI-assisted coding and software quality, by Andrés Talavera.',
    },
  },
  realisations: {
    og: 'website',
    fr: {
      title: 'Réalisations & études de cas | IdeaStud.io',
      description: "Sélection de projets .NET/Azure et études de cas : plateformes web, applications cloud-native et produits SaaS conçus avec mes clients.",
    },
    en: {
      title: 'Projects & case studies | IdeaStud.io',
      description: 'Selected .NET/Azure projects and case studies: web platforms, cloud-native applications and SaaS products built with my clients.',
    },
  },
  cv: {
    og: 'profile',
    fr: {
      title: 'CV — Andrés Talavera, Consultant .NET & Azure | IdeaStud.io',
      description: "Parcours, expériences et compétences d'Andrés Talavera, consultant .NET & Azure, techlead et formateur. Plus de 15 ans d'expérience.",
    },
    en: {
      title: 'Resume — Andrés Talavera, .NET & Azure Consultant | IdeaStud.io',
      description: 'Experience and skills of Andrés Talavera — .NET & Azure consultant, tech lead and trainer. 15+ years building software.',
    },
  },
  legal: {
    og: 'website',
    fr: {
      title: 'Mentions légales | IdeaStud.io',
      description: "Mentions légales du site IdeaStud.io : éditeur, hébergement et informations réglementaires.",
    },
    en: {
      title: 'Legal notice | IdeaStud.io',
      description: 'Legal notice for IdeaStud.io: publisher, hosting and regulatory information.',
    },
  },
  privacy: {
    og: 'website',
    fr: {
      title: 'Politique de confidentialité | IdeaStud.io',
      description: "Comment IdeaStud.io traite vos données personnelles, les cookies et la mesure d'audience, conformément au RGPD.",
    },
    en: {
      title: 'Privacy policy | IdeaStud.io',
      description: 'How IdeaStud.io handles your personal data, cookies and analytics, in line with the GDPR.',
    },
  },
};

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Parses StaticRoutes from ILocalizedRoute.cs into { pageId, culture, path }[].
function parseStaticRoutes(source) {
  const re = /\[\(\s*"([^"]+)"\s*,\s*"(fr|en)"\s*\)\]\s*=\s*"([^"]+)"/g;
  const routes = [];
  let m;
  while ((m = re.exec(source)) !== null) {
    routes.push({ pageId: m[1], culture: m[2], path: m[3] });
  }
  return routes;
}

function pathFor(routes, pageId, culture) {
  const hit = routes.find((r) => r.pageId === pageId && r.culture === culture);
  return hit ? hit.path : null;
}

function alternatesFor(routes, pageId) {
  const fr = pathFor(routes, pageId, 'fr');
  const en = pathFor(routes, pageId, 'en');
  const alts = [];
  if (fr) alts.push({ lang: 'fr', url: ORIGIN + fr });
  if (en) alts.push({ lang: 'en', url: ORIGIN + en });
  if (fr) alts.push({ lang: 'x-default', url: ORIGIN + fr });
  return alts;
}

function jsonLdFor(pageId, culture, canonical) {
  const seo = SEO[pageId];
  if (!seo || !seo.schema) return [];
  const blocks = [];
  for (const type of seo.schema) {
    if (type === 'WebSite') {
      blocks.push({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'IdeaStud.io',
        url: canonical,
        inLanguage: culture,
      });
    } else if (type === 'Person') {
      blocks.push({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Andrés Talavera',
        url: canonical,
        image: OG_IMAGE,
        jobTitle: JOB_TITLE[culture],
        worksFor: { '@type': 'Organization', name: 'IdeaStud.io', url: ORIGIN },
      });
    }
  }
  return blocks.map((b) => JSON.stringify(b));
}

function replaceOnce(html, find, repl, label) {
  const first = html.indexOf(find);
  if (first === -1) throw new Error(`Template anchor missing (${label}): ${find}`);
  if (html.indexOf(find, first + find.length) !== -1) {
    throw new Error(`Template anchor not unique (${label}): ${find}`);
  }
  return html.slice(0, first) + repl + html.slice(first + find.length);
}

// Exact anchors in wwwroot/index.html. If the template changes, these throw loudly
// rather than silently emitting stale metadata.
const A = {
  htmlOpen: '<html lang="fr" data-motion="">',
  title: '<title>IdeaStud.io — Andrés Talavera</title>',
  description:
    '<meta name="description" content="Andrés Talavera — Consultant .NET & Azure, techlead, formateur. Lyon et à distance." />',
  ogType: '<meta property="og:type" content="profile" />',
  ogTitle: '<meta property="og:title" content="IdeaStud.io — Andrés Talavera" />',
  ogDescription:
    '<meta property="og:description" content="Andrés Talavera — Consultant .NET & Azure, techlead, formateur. Lyon et à distance." />',
  ogUrl: '<meta property="og:url" content="https://ideastud.io/" />',
  twitterTitle: '<meta name="twitter:title" content="IdeaStud.io — Andrés Talavera" />',
  twitterDescription:
    '<meta name="twitter:description" content="Andrés Talavera — Consultant .NET & Azure, techlead, formateur. Lyon et à distance." />',
  injectBefore: '    <!-- Base href.',
};

function buildShell(template, { pageId, culture, route, routes, i18n }) {
  const seo = SEO[pageId];
  const canonical = ORIGIN + route;
  const labelKey = `Nav.${pageId.replace(/^(\w)/, (c) => c.toUpperCase()).replace('.hub', '')}`;
  const fallbackLabel = i18n[culture] && i18n[culture][labelKey];
  const meta = seo
    ? seo[culture]
    : {
        title: fallbackLabel ? `${fallbackLabel} | IdeaStud.io` : 'IdeaStud.io — Andrés Talavera',
        description:
          culture === 'fr'
            ? 'Andrés Talavera — Consultant .NET & Azure, techlead, formateur. Lyon et à distance.'
            : 'Andrés Talavera — .NET & Azure consultant, tech lead and trainer. Lyon and remote.',
      };
  const ogType = (seo && seo.og) || 'website';
  const title = meta.title;
  const description = meta.description;

  let html = template;
  html = replaceOnce(html, A.htmlOpen, `<html lang="${culture}" data-motion="">`, 'html lang');
  html = replaceOnce(html, A.title, `<title>${escapeAttr(title)}</title>`, 'title');
  html = replaceOnce(
    html,
    A.description,
    `<meta name="description" content="${escapeAttr(description)}" />`,
    'description'
  );
  html = replaceOnce(html, A.ogType, `<meta property="og:type" content="${ogType}" />`, 'og:type');
  html = replaceOnce(
    html,
    A.ogTitle,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    'og:title'
  );
  html = replaceOnce(
    html,
    A.ogDescription,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    'og:description'
  );
  html = replaceOnce(
    html,
    A.ogUrl,
    `<meta property="og:url" content="${escapeAttr(canonical)}" />`,
    'og:url'
  );
  html = replaceOnce(
    html,
    A.twitterTitle,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    'twitter:title'
  );
  html = replaceOnce(
    html,
    A.twitterDescription,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    'twitter:description'
  );

  const lines = [];
  lines.push(`    <link rel="canonical" href="${escapeAttr(canonical)}" />`);
  for (const { lang, url } of alternatesFor(routes, pageId)) {
    lines.push(`    <link rel="alternate" hreflang="${lang}" href="${escapeAttr(url)}" />`);
  }
  lines.push(`    <meta property="og:locale" content="${OG_LOCALE[culture]}" />`);
  lines.push(`    <meta property="og:image:alt" content="${escapeAttr(OG_IMAGE_ALT)}" />`);
  for (const block of jsonLdFor(pageId, culture, canonical)) {
    lines.push(`    <script type="application/ld+json">${block}</script>`);
  }
  const injected = lines.join('\n') + '\n\n' + A.injectBefore;
  html = replaceOnce(html, A.injectBefore, injected, 'inject point');

  return html;
}

async function main() {
  const template = await readFile(path.join(sourceWwwroot, 'index.html'), 'utf8');
  const routeSource = await readFile(
    path.join(projectRoot, 'Services', 'ILocalizedRoute.cs'),
    'utf8'
  );
  const routes = parseStaticRoutes(routeSource);
  if (routes.length === 0) throw new Error('No StaticRoutes parsed from ILocalizedRoute.cs');

  const readJson = async (p) =>
    JSON.parse((await readFile(p, 'utf8')).replace(/^﻿/, ''));
  const i18n = {
    fr: await readJson(path.join(sourceWwwroot, 'i18n', 'fr.json')),
    en: await readJson(path.join(sourceWwwroot, 'i18n', 'en.json')),
  };

  const emitted = [];
  const fallbacks = [];
  for (const { pageId, culture, path: route } of routes) {
    const html = buildShell(template, { pageId, culture, route, routes, i18n });
    const outDir = path.join(outRoot, route.replace(/^\//, ''));
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, 'index.html'), html, 'utf8');
    emitted.push(route);
    if (!SEO[pageId]) fallbacks.push(`${route} (${pageId})`);
  }

  console.log(`prerender-shells: ${emitted.length} static metadata shells written under ${outRoot}`);
  for (const route of emitted) console.log(`  ✓ ${route}`);
  if (fallbacks.length) {
    console.log(`prerender-shells: ${fallbacks.length} route(s) used fallback metadata (add SEO entries):`);
    for (const f of fallbacks) console.log(`  • ${f}`);
  }
}

main().catch((e) => {
  console.error('prerender-shells failed:', e.message);
  process.exit(1);
});
