# V2 — from scratch

**Author:** Claude (with Andrés)
**Date:** 2026-04-24
**Status:** Plan — awaiting approval before execution.

## Why

After 20+ iterative phases the site is incoherent: markup from Phase D, SCSS from Phase C, leftover partials from Phase 3, broken CV timeline, shader fallback showing instead of cosmic backdrop. Every refactor left scaffolding behind.

Andrés's brief, distilled across several sessions:

- **Wow — cosmique.** The visual moment must impress. Clients should want a site like this.
- **Luxe, simple, animé.** Editorial confidence. Not dev-portfolio template.
- **Fluide, rapide, performant.** No stutters on scroll. Bundle tight.
- **SEO / GEO / AEO ready.** Google + AI search engines quote the site.
- **Responsive impeccable.** Mobile and touch have zero friction, no half-pinned scroll hacks.

Non-negotiable: **start from zero**. No more patching the existing CSS/markup — every inconsistency compounds.

## How I'll hold the line this time

1. **One design system, one pass.** No partials layered over partials. Everything lives under a single `design/` SCSS tree. If a rule isn't in that tree, it doesn't exist.
2. **Every page same rhythm.** Kicker → display → lead → content-in-rules. No exceptions, no one-offs. Predictability is what makes an editorial site feel designed.
3. **Validation gates.** After each phase I run `dotnet build && dotnet test`, then `gzip -c cinema.bundle.js | wc -c`, then read the compiled CSS to verify the rules I wrote are actually in the output. No "I hope it works" commits.
4. **No new feature adds during V2.** If it's not on this page, it doesn't get built. If Andrés wants polish after V2 ships, Phase E starts clean.

## Teardown — day zero

Delete every file in these directories except the ones listed to keep.

### `wwwroot/scss/` — delete everything except:
- `styles.scss` (rewritten as a clean @use chain)
- `tokens/_colors.scss`, `tokens/_space.scss`, `tokens/_type.scss`, `tokens/_motion.scss` (rewritten)
- `tokens/service-accents.scss` (delete — no longer used)

### `wwwroot/src/cinema/` — delete everything except:
- `backdrop-shader.js` (the cosmic shader — keep, already good)
- `scene-theme.js` (keep — sets `data-scene` attribute for minor per-page tint)
- `index.js` (rewritten as a thin orchestrator)

Kill `interactions/cursor.js`, `interactions/reveals.js`, `interactions/magnetic.js`, `interactions/sticky-hero.js`, `interactions/hero-stage.js`, `interactions/view-transition.js`. Start fresh.

### `Components/` — delete:
- `HomeIntroHero.razor`, `HeroSection.razor` — replaced by a single `Hero.razor`.
- `EditorialServicesStrip.razor` — replaced by a single `ServicesList.razor`.
- `ServicesGrid.razor`, `RealisationsGrid.razor`, `RealisationsTeaser.razor` — replaced by purpose-built page sections.
- `ExperienceTimeline.razor` — replaced by a single `Timeline.razor`.
- `MotionReveal.razor`, `RevealText.razor`, `RevealWords.razor` — replaced by a single `Reveal.razor` that wraps in `[data-reveal]`.
- `CinemaStage.razor` — doesn't exist anymore, confirm deleted.
- `Card.razor` — folded into purpose-built components per context.

### `Pages/` — rewrite, don't delete:
- `Home.razor`, `Cv.razor`, `Services.razor`, `ServiceDetail.razor`, `Realisations.razor`, `Legal.razor`, `Privacy.razor` — keep the file names and route attributes, rewrite the body.

### Tests — keep as-is:
- `BundleBudgetTests.cs` (raise cap to 80 KB)
- `IntegrationTests.cs`, `RealisationFilterTests.cs`, `LocalizedRouteTests.cs`, `HardcodedPathsTests.cs` — untouched.

## Design tokens

### Colors

```scss
// tokens/_colors.scss
$bg:          #05050a;  // deep space
$bg-deep:     #020205;
$surface:     #0d0d15;  // card, details, modal
$fg:          #f2eee6;  // warm cream — the lead voice
$fg-muted:    #8a8578;  // secondary copy
$fg-faint:    #5a5448;  // tertiary, de-emphasized
$accent:      #f3c577;  // brass amber — the ONLY brand color
$accent-deep: #c79958;
$rule:        rgba(242, 238, 230, 0.08);
$ring:        rgba(243, 197, 119, 0.65);  // focus ring
```

### Type

```scss
// tokens/_type.scss
$font-sans:  'Inter', system-ui, -apple-system, sans-serif;
$font-serif: 'Instrument Serif', 'Times New Roman', serif;
$font-mono:  'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;

// Sizes — clamp(min, preferred, max)
$fs-display: clamp(3.5rem, 9vw,  8rem);    // hero name
$fs-hero:    clamp(2.75rem, 6.5vw, 5.5rem); // page hero title
$fs-title:   clamp(2rem, 4.5vw,  3.6rem);  // chapter title
$fs-heading: clamp(1.5rem, 3vw,  2.4rem);  // sub-section
$fs-lead:    clamp(1.125rem, 1.4vw, 1.3rem);
$fs-body:    1.0625rem;
$fs-small:   0.875rem;
$fs-mono:    0.8125rem;

$lh-display: 0.95;
$lh-title:   1.05;
$lh-body:    1.65;

$ls-display: -0.025em;
$ls-title:   -0.015em;
$ls-kicker:  0.22em;
```

### Space

```scss
// tokens/_space.scss
$s-1: 0.25rem;  $s-2: 0.5rem;   $s-3: 0.75rem;   $s-4: 1rem;
$s-5: 1.5rem;   $s-6: 2rem;     $s-7: 3rem;      $s-8: 4rem;
$s-9: 6rem;     $s-10: 8rem;    $s-11: 12rem;

$container: 1200px;
$container-narrow: 880px;
$container-wide: 1440px;

$section-y: clamp(4rem, 8vw, 8rem);
$chapter-y: clamp(6rem, 12vw, 12rem);
```

### Motion

```scss
// tokens/_motion.scss
$ease-out:   cubic-bezier(0.2, 0.8, 0.2, 1);
$ease-in:    cubic-bezier(0.8, 0.2, 1, 0.2);
$ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

$t-fast: 180ms;
$t-med:  340ms;
$t-slow: 720ms;
```

## Design system — final layout

```
wwwroot/scss/
├── tokens/                         (the 4 files above)
├── base/
│   ├── _reset.scss                 modern normalize, box-sizing, etc.
│   ├── _root.scss                  :root custom property declarations
│   ├── _typography.scss            base html, body, heading, link type
│   ├── _backdrop.scss              #backdrop-canvas + #backdrop-fallback
│   └── _a11y.scss                  focus ring, skip link, sr-only
├── layout/
│   ├── _container.scss             .ds-container (3 widths)
│   ├── _section.scss               .ds-section, .ds-section--spacious
│   ├── _stack.scss                 .ds-stack (flex column), gap variants
│   └── _grid.scss                  .ds-grid--cols-N utility grids
├── components/
│   ├── _header.scss                .ds-header masthead
│   ├── _footer.scss                .ds-footer
│   ├── _hero.scss                  .ds-hero (single component, used everywhere)
│   ├── _kicker.scss                .ds-kicker (tiny mono uppercase)
│   ├── _display.scss               .ds-display (serif italic giant)
│   ├── _lead.scss                  .ds-lead, .ds-body
│   ├── _button.scss                .ds-btn + --primary/--ghost/--pill/--sm
│   ├── _link.scss                  .ds-link underline animation + arrow
│   ├── _list.scss                  .ds-list (editorial numbered list for services)
│   ├── _tag.scss                   .ds-tag (mono pill)
│   ├── _card.scss                  .ds-card (used only for AboutSection + Training)
│   ├── _timeline.scss              .ds-timeline (CV experiences)
│   ├── _rule.scss                  .ds-rule (1px divider variants)
│   ├── _reveal.scss                [data-reveal] + [data-reveal-step=N]
│   ├── _cursor.scss                custom dot cursor
│   └── _progress.scss              read-progress bar
└── styles.scss                     single @use chain, ordered
```

**Zero duplicated rules.** Anywhere a `.ds-display` applies, the definition lives in `_display.scss` and nowhere else.

## Pages — specs

### Shared rhythm

Every page follows:

```
[ masthead — sticky, mono wordmark + nav + amber CTA ]

[ HERO ]
  kicker (mono, tiny, uppercase — e.g. "· Chapter II · Services")
  display title (serif italic, giant, 1-3 lines)
  lead paragraph (sans, larger, max 58ch)
  (optional) hero actions — numbered link list OR single CTA

[ CONTENT CHAPTERS ]
  each chapter starts with:
    kicker
    title (serif italic, smaller than hero)
  separated from previous by 1px rule + generous padding

[ CTA BAND ]
  serif "Travaillons ensemble" + mini paragraph + amber pill

[ footer — mono, 4 columns: brand, sitemap, contact, legal ]
```

No page breaks this rhythm.

### Home `/fr` + `/en`

1. **Hero** — kicker "— CONSULTANT · TECHLEAD · FORMATEUR", display "Andrés / Talavera" on two lines, lead "Je transforme des idées en logiciels qui marchent. .NET, Azure, mobile, web — à Lyon et à distance.", three numbered links (01 LinkedIn, 02 GitHub, 03 Rencontrer — last one is the amber pill).

2. **What I do** — kicker "Services", title "Six façons de collaborer", followed by the editorial numbered list (01-06) of services. Each row: index (mono) · title (serif italic) · tagline (sans) · arrow (→). Hover: row indents 1rem, arrow slides, title color shifts to accent.

3. **Selected work** — kicker "Réalisations", title "Projets récents", three project tiles in a grid. Each tile: image (16:10 aspect), type (mono), title (serif italic), summary (2 lines sans). Hover: image zooms 3%, title color shifts.

4. **FAQ** — kicker "Questions", title "Les plus demandées", three native `<details>` accordions. Questions hand-picked: "Quels projets acceptes-tu ?", "Tes tarifs ?", "Tu travailles à distance ?" — with concise answers. **This feeds FAQPage JSON-LD for AEO.**

5. **CTA band** — "Travaillons ensemble" serif, one-line pitch, amber pill Calendly button.

6. **Footer** — mono, 4 cols.

### CV `/fr/cv` + `/en/resume` + alias routes already added

1. **Hero** — kicker "— Chapter I · Introduction", display from resume.PersonalInformation.Hero (e.g. "Donnons vie / à l'avenir de votre / entreprise ensemble"), lead from Introduction, language tags (mono).

2. **À propos** — kicker "Chapter II · About", title "Un parcours, / plusieurs angles", 3 AboutSection cards — minimal, 1px rule between each.

3. **Expériences** — kicker "Chapter III · Experiences", title "Ce que j'ai construit", vertical timeline. Each row: left column has giant accent year (serif italic, clamp 3-6rem) + period mono below, right column has role (serif italic) + company line + description paragraphs + tech tags (mono). Year is `position: sticky` on desktop so it scrolls with the card.

4. **Formations** — kicker "Chapter IV · Trainings", title "J'apprends, j'enseigne", list of training centers.

5. **Contact** — kicker "Chapter V · Contact", title "Parlons de votre projet", 3 mono lines with icons + Calendly pill.

6. **Footer**

### Services `/fr/services` + `/en/services`

1. **Hero** — kicker "— Services", display "Six façons / de collaborer", lead positioning Andrés's proposition.

2. **List** — same editorial numbered list as Home's section 2, but this is the primary content. Six rows, rule between, hover indents.

3. **CTA band**

4. **Footer**

### Service detail `/fr/services/{slug}` + `/en/services/{slug}`

1. **Hero** — kicker from service.Kicker, display service.Title (serif italic), lead service.Tagline.

2. **Summary** — single paragraph, `.ds-body`, max 68ch.

3. **Highlights** — kicker "Ce que vous obtenez", title "Concrètement", bulleted list with amber bullets.

4. **Use cases** — kicker "Cas d'usage", title "Où ça a fonctionné", 2-col grid of minimal cards.

5. **FAQ** — kicker "Questions fréquentes", title "Ce que les clients demandent", native `<details>` accordions. **Feeds FAQPage JSON-LD.**

6. **CTA band** — with service.CtaLabel if present.

7. **Footer**

### Realisations `/fr/realisations` + `/en/projects` + alias routes already added

1. **Hero** — kicker "— Projets", display "Réalisations récentes" / "Recent projects", lead.

2. **Filters** — small chip bar: tech chips + type chips, mono, amber when active.

3. **Grid** — 2-col (desktop) / 1-col (mobile) tile grid. Each tile has image (lazy loaded), type+year mono, title serif italic, summary 2 lines, tech tags mono. Hover: image zoom.

4. **Empty state** if filtered to zero — "Rien ne correspond. Voir tous les projets →".

5. **CTA band**

6. **Footer**

### Legal / Privacy `/fr/mentions-legales` + `/en/legal` + `/fr/confidentialite` + `/en/privacy`

Long-form text pages. Kicker + display + single wide column (max 68ch) of body copy. No cards, no grids. Just typography.

## Cosmic WebGL backdrop

Already landed in commit `d2fcb39`. Keep. Single full-viewport fragment shader — three star layers with twinkle, domain-warped fBm nebula with amber + violet, radial rotation, shooting stars every ~12s. Accepts `--ds-accent` / `--ds-bg` from CSS for consistency.

Validation: open Safari in low-power mode → backdrop must still render. Open on an M1 → rAF must hit 60 fps. Drop pixel ratio cap from 2 to 1.5 if mobile GPUs stutter.

## Tiny JS runtime

`wwwroot/src/cinema/index.js` — ~40 LOC:

```js
import { boot as bootBackdrop } from './backdrop-shader.js';
import { enable as enableCursor } from './interactions/cursor.js';
import { attach as attachReveals } from './interactions/reveals.js';
import { attach as attachStickyHero } from './interactions/sticky-hero.js';

let booted = false;
let shader = null;

export async function initialize() {
  if (booted) return;
  booted = true;
  shader = bootBackdrop();
  enableCursor();
  attachReveals();
  attachStickyHero();
}

// Called by PageScene after route changes. Re-runs attachers that need
// to observe new DOM nodes.
export async function applyTheme(scene) {
  document.documentElement.dataset.scene = scene;
  attachReveals();
  attachStickyHero();
}

export async function dispose() {
  shader?.shutdown();
  booted = false;
}
```

**Interactions — each module under 50 LOC:**

- `interactions/cursor.js` — single 12px amber dot, lags 0.22, mix-blend-difference, disabled on touch + reduced-motion.
- `interactions/reveals.js` — single IO + MutationObserver, toggles `is-revealed` on `[data-reveal]`. No variants, no stagger calculation in JS (SCSS reads `--reveal-step` from inline style).
- `interactions/sticky-hero.js` — toggles `html.is-past-hero` when `#home-intro-hero` exits viewport.

Hero entrance GSAP timeline: **drop it**. CSS `@keyframes` + `animation-delay` stagger does the same job without GSAP. Saves ~28 KB gzip.

## Bundle budget

**Target: 35-45 KB gzip.**

Composition:
- backdrop-shader.js ~2.5 KB
- cursor + reveals + sticky-hero ~1 KB
- Blazor runtime / interop glue (unavoidable)
- No GSAP, no Three.js, no any JS animation library

If bundle ≤ 45 KB and the cosmic shader holds 60 fps on mid-range, we're done.

## SEO / GEO / AEO

### Meta (per page via `SeoHead.razor` — already emits most of this)
- `<title>`, `<meta name="description">`, `<link rel="canonical">`.
- `<link rel="alternate" hreflang="…">` for fr / en / x-default.
- Open Graph: og:title, og:description, og:image, og:image:alt, og:type, og:url, og:locale, og:site_name.
- Twitter: card=summary_large_image, site, creator, title, description, image.
- Speakable selectors (already present).

### JSON-LD per page
- **Home**: Person + ProfessionalService + WebSite (+ SearchAction) + BreadcrumbList + **FAQPage** (from the 3 hand-picked questions).
- **CV**: Person (with sameAs LinkedIn + GitHub + canonical site), WebPage (mainEntity=Person), BreadcrumbList.
- **Services hub**: ItemList of Service entries, ProfessionalService, BreadcrumbList.
- **Service detail**: Service (provider=Person, areaServed), **FAQPage** from service.Faq, BreadcrumbList, WebPage.
- **Realisations**: ItemList of CreativeWork entries, BreadcrumbList.
- **Legal / Privacy**: WebPage + BreadcrumbList.

### AEO specifics (Answer Engine Optimization)
- Every page has at least one short, quotable "what", "why", "where" statement in the lead paragraph.
- FAQ sections on Home + each ServiceDetail with direct Q&A sentences (AI search engines favor short declarative answers).
- `wwwroot/llms.txt`: summary + list of services + urls, so LLMs with web access can ground claims.
- `wwwroot/ai.txt`: allow list + contact.

### Sitemap + robots
- `wwwroot/sitemap.xml` lists CANONICAL urls only. Alias routes (`/resume-andres-talavera`, `/portfolio`) are not in the sitemap — their pages emit canonical link pointing at the primary URL.
- `wwwroot/robots.txt` allows everything + references sitemap.

## Execution order

### V2-1 — Teardown + tokens (30 min)
1. Delete the files listed in the teardown section.
2. Write the 4 token files.
3. Write `_root.scss` + `_reset.scss` + `_typography.scss` + `_a11y.scss` + `_backdrop.scss`.
4. Write `styles.scss` with a minimal @use chain (tokens + base only).
5. `dotnet build`. Verify 0 errors. Site will render broken — expected.
6. Verify compiled CSS contains the new `:root` custom props.
7. Commit: `refactor(v2): teardown + tokens + base`.

### V2-2 — Layout + primitives (45 min)
1. Write `layout/_container.scss`, `_section.scss`, `_stack.scss`, `_grid.scss`.
2. Write `components/_header.scss`, `_kicker.scss`, `_display.scss`, `_lead.scss`, `_button.scss`, `_link.scss`, `_rule.scss`, `_reveal.scss`, `_cursor.scss`, `_progress.scss`.
3. Rewrite `MainLayout.razor` with the new masthead markup.
4. Rewrite `wwwroot/src/cinema/interactions/*` — cursor, reveals, sticky-hero.
5. Rewrite `wwwroot/src/cinema/index.js` to the 40-LOC shape above.
6. `dotnet build`. `grep "ds-header" styles.min.css` — verify rules present.
7. Commit: `feat(v2): layout + primitive components`.

### V2-3 — Hero + Home page (45 min)
1. Write `components/_hero.scss`, `_list.scss`, `_tag.scss`.
2. Create `Components/Hero.razor` — single reusable hero (parameters: Kicker, Title, Subtitle, Lead, Actions RenderFragment).
3. Create `Components/ServicesList.razor`.
4. Rewrite `Pages/Home.razor` using Hero + ServicesList + inline FAQ + CTA.
5. Add `Home.Faq.Q1/A1/Q2/A2/Q3/A3` i18n keys (fr + en).
6. `dotnet build && dotnet run`. **Open browser. Verify hero looks right.** No iterations beyond this point without visual validation.
7. Commit: `feat(v2): hero + home`.

### V2-4 — CV page + timeline (60 min)
1. Write `components/_timeline.scss`, `_card.scss`.
2. Create `Components/Timeline.razor` (replaces ExperienceTimeline).
3. Create new reusable card for About + Training.
4. Rewrite `Pages/Cv.razor` using Hero + Timeline + About grid + Training grid + Contact section.
5. Add FAQ for CV (2-3 questions — "Es-tu disponible ?", "Travailles-tu en remote ?", "Quels types de missions ?").
6. `dotnet build && dotnet run`. **Browser check.**
7. Commit: `feat(v2): cv page`.

### V2-5 — Services hub + Service detail (45 min)
1. Rewrite `Pages/Services.razor` using Hero + ServicesList + CTA.
2. Rewrite `Pages/ServiceDetail.razor` with magazine layout.
3. Verify FAQPage JSON-LD emitted on every service detail.
4. **Browser check.**
5. Commit: `feat(v2): services + detail`.

### V2-6 — Realisations (30 min)
1. Write `components/_tile.scss` (the project tile).
2. Rewrite `Pages/Realisations.razor` with Hero + filters + grid + empty state + CTA.
3. **Browser check.**
4. Commit: `feat(v2): realisations`.

### V2-7 — Legal + Privacy + SEO/AEO polish (30 min)
1. Rewrite `Pages/Legal.razor` + `Pages/Privacy.razor` as long-form typography.
2. Regenerate `sitemap.xml` with canonical URLs only (already close — verify).
3. Rewrite `wwwroot/llms.txt` with V2 structure + FAQ style summaries.
4. Rewrite `wwwroot/ai.txt`.
5. `dotnet build && dotnet test`.
6. Commit: `feat(v2): legal + privacy + SEO assets`.

### V2-8 — Final pass (30 min)
1. Run Lighthouse in Release build locally. Target: Perf ≥90, A11y ≥95, BP ≥95, SEO=100.
2. Run axe DevTools. Zero critical violations.
3. Test in Safari low-power mode — backdrop should still render.
4. Test reduced-motion — everything static, no errors.
5. Test keyboard-only navigation — every CTA reachable.
6. Commit: `chore(v2): audit + polish`.
7. Push `version-2` to origin (already done earlier in the session).

## Validation gates

Before EACH commit:
1. `dotnet build IdeaStudio.sln` — 0 errors, 0 warnings
2. `dotnet test IdeaStudio.sln` — all pass
3. `gzip -c IdeaStudio.Website/wwwroot/js/cinema.bundle.js | wc -c` — report number
4. Read the compiled `styles.min.css` — grep for the specific rules I just wrote
5. `dotnet run` — open the affected page in a real browser — confirm the render matches intent

**If any gate fails, stop and diagnose. Don't commit "hopeful" code.**

## What NOT to do this time

- No layered SCSS partials that reference each other across 3 levels.
- No "keep for backward compat" escape hatches.
- No adding "wow" features before the base works visually.
- No dispatching 10 agents in parallel and hoping they converge.
- No shipping without a browser check.

## Budget for the whole V2

~5-6 hours of focused execution, split over 8 validation-gated commits. Each commit is small enough to revert cleanly.

When the org usage limit resets, I execute V2-1 first. No mega-dispatch. Step by step, with browser validation between each.
