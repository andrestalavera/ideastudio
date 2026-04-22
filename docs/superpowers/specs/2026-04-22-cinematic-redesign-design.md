# Cinematic redesign — IdeaStud.io

**Date:** 2026-04-22
**Status:** Spec — ready for implementation plan
**Scope:** Full visual redesign of the Blazor WASM portfolio with a WebGL hero, scroll-orchestrated chapters, and a custom SCSS design system replacing Bootstrap.

## Context

The current site uses Bootstrap with a simple fade-in animation system. The content model (Resume, Experience, TrainingCenter, i18n, SEO) is mature and must be preserved. The goal is to transform the presentation layer into a signature, editorial, cinema-atmospheric experience while keeping content readable and skimmable for recruiters and training clients.

## Goals

- Signature WebGL hero that reflects Andrés' identity (particles + constellation of technologies + plasma ambient).
- Narrative scroll structure ("cinematic chapters") where each section has a distinct visual treatment.
- One high-intensity "wow" moment: horizontal pinned scroll through the experience timeline.
- Full design system in SCSS replacing Bootstrap, with no new build tooling beyond what fits into the existing MSBuild pipeline.
- Accessibility preserved: semantic HTML, `prefers-reduced-motion` fallback, keyboard nav, screen-reader safe canvas.
- Content pipeline (resume JSON, i18n, SEO) untouched.

## Non-goals

- No change to the Resume/Experience/TrainingCenter data model or JSON files.
- No change to `SeoHead` or structured data.
- No new backend, no CMS.
- No light theme (direction B = dark by default).
- No generative/unpredictable content (ruled out to keep the professional tone).

## Design direction

**B (cinéma atmosphérique) with a C-style pinned moment on the Experiences section.**

- Base: dark deep (navy → ink), atmospheric glows in blue/cyan/teal, subtle green accents.
- Typography: Inter Variable (display + body, weights 300 → 700) + JetBrains Mono (code-like accents, kickers, labels). No serif.
- Palette tokens (locked):
  - `--ink-0` `#020617` (deepest background)
  - `--deep` `#0c4a6e` (navy)
  - `--azure` `#0ea5e9`
  - `--sky` `#7dd3fc`
  - `--cyan` `#67e8f9`
  - `--teal` `#5eead4`
  - `--mint` `#34d399`
  - `--paper` `#f1f5f9` (text on dark)
  - Neutral ink scale `--ink-100` through `--ink-900` for surfaces and text.

## Narrative structure — five acts

1. **Act I — Hero.** Composite WebGL scene: plasma ambient, constellation of technology nodes, particle field that assembles into "Andrés Talavera" with a shimmer. Mouse parallax on three depth layers. Scroll disperses the name and the scene transitions to the next act.
2. **Act II — About.** The constellation nodes zoom forward and morph into the About cards. Faint constellation and plasma persist in the background.
3. **Act III — Experiences.** Horizontal pinned scroll. The vertical scroll input drives a horizontal traversal of the experience stack. Each card enters the active zone (lifted, brighter, full-detail), then recedes into depth as the next one enters. Mobile fallback: vertical reveal, no pin.
4. **Act IV — Training.** Editorial cascade grid. Training centers reveal in a staggered, masked pattern. Layout keeps strong vertical rhythm.
5. **Act V — Contact.** Return to deep dark. Plasma swells back. CTA buttons (LinkedIn, GitHub, Resume download, Meet) sit in glass cards with subtle hover lift.

The constellation remains as a very faint ambient layer through acts II–V so the page feels like one continuous scene.

## Architecture

Three clearly separated layers:

1. **Presentation (Blazor / C#)** — section components, content binding, i18n, routing, SEO.
2. **Motion engine (JavaScript)** — Three.js scene + GSAP ScrollTrigger timelines. Driven by a Blazor service via JS interop.
3. **Design system (SCSS)** — tokens, utilities, component patterns. Compiled via the existing MSBuild target.

```
┌────────────────────────────────────────────────────┐
│ Blazor components (Razor, C#)                      │
│   Index.razor → ChapterSection → cards             │
│   CinemaStage (single <canvas>)                    │
│   ICinemaEngine ─┐                                 │
└──────────────────┼─────────────────────────────────┘
                   │ JS interop
┌──────────────────▼─────────────────────────────────┐
│ cinema.js (Three.js + GSAP)                        │
│   PlasmaLayer · ConstellationLayer · ParticleLayer │
│   ScrollTimeline (per act) + PinnedHorizontalAct   │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ SCSS design system                                  │
│   tokens/  base/  patterns/  utilities/            │
│   compiled → wwwroot/css/styles.min.css            │
└────────────────────────────────────────────────────┘
```

## Components

### New

- **`CinemaStage.razor`** — full-viewport fixed `<canvas>` behind content. Calls `ICinemaEngine.InitializeAsync()` on first render. Forwards `prefers-reduced-motion`, viewport size changes, and culture-change events.
- **`ChapterSection.razor`** — wrapper for each act. Parameters: `Id`, `ActNumber`, `Kicker` (mono label), `Title` (display). Registers itself as a scroll anchor for the engine. Renders `ChildContent` in the chapter body.
- **`ExperienceTimeline.razor`** — replaces the current d-flex/d-none toggle logic. Renders all experiences in a row structure that the engine transforms into a pinned horizontal scroll on desktop and a vertical reveal on mobile.
- **`TechConstellation.razor`** — declarative structure for the constellation: list of `(Id, Label, I18nKey, Position)` nodes. The component doesn't render visually itself; it exposes the data to the engine via `ICinemaEngine.SetConstellation(...)`.
- **`MotionReveal.razor`** — optional wrapper for arbitrary blocks that need a reveal animation (stagger, fade-up, mask). Registers its `ElementReference` with the engine.

### Refactored

- **`HeroSection.razor`** — keeps semantic markup (`h1`, name, intro, i18n languages, print-mode contact details) for SEO and accessibility. The visual (current purple card + background image) is removed; the WebGL scene provides the visual instead.
- **`AboutCard.razor`** — restyled with new tokens (`.card.card--glass`), tilt-on-hover via CSS `transform`, no internal IntersectionObserver.
- **`ExperienceCard.razor`** — restyled, slimmer, tuned for horizontal pinned layout.
- **`TrainingCard.razor`** — restyled.
- **`ContactSection.razor`** — restyled.
- **`SocialNetworksComponent.razor`** — restyled (new button tokens, keeps PDF download added earlier).
- **`FooterSection.razor`** — restyled.
- **`MainLayout.razor`** — navbar restyled (kicker + minimal pill nav), adds `CinemaStage` as a sibling behind the content.
- **`Index.razor`** — restructures the page as a sequence of `ChapterSection` components.

### Removed

- **`AnimatedComponentBase.cs`** — superseded by the central engine.
- **`wwwroot/js/animations.js`** — superseded by `wwwroot/js/cinema.js`.
- **`IAnimationService` + `AnimationService`** — superseded by `ICinemaEngine` + `CinemaEngine`.
- Bootstrap CSS imports in `styles.scss` and the `bootstrap` npm dependency.

### Unchanged

- `ICultureService`, `CultureService`
- `ILocalizationService`, `LocalizationService`
- `ISlugService`, `SlugService`
- `ILazyLoadingService`, `LazyLoadingService`
- `Resume`, `Experience`, `TrainingCenter`, `PersonalInformation`, `AboutSection`, `SchemaOrg`, `Extensions`
- `SeoHead`, `CultureSelector`, `Heading`, `Loading`, `Placeholder`, `SkillBadge`
- `wwwroot/data/resume-*.json`, `wwwroot/i18n/*.json`
- `Pages/Privacy.razor`, `Pages/Legal.razor` (restyled only via new tokens)

## Motion engine

### Technology

- **Three.js** (≈ 150 KB gzip) — WebGL scene, one `WebGLRenderer`, one shared `Scene` and `PerspectiveCamera`.
- **GSAP** + **ScrollTrigger** (≈ 40 KB gzip) — orchestrating DOM reveals and the pinned horizontal scroll.

Source JS lives under `wwwroot/src/` (new folder, not served). Bundled into one `wwwroot/js/cinema.bundle.js` via esbuild, called from a new `npm run compile-scripts` target wired into the existing MSBuild `NpmRunBuild` target. Only the bundle is deployed.

### Scene composition

- **PlasmaLayer** — a single full-screen plane with a fragment shader: simplex-noise-driven plasma in palette colors. Drives ambient brightness per act via a uniform `uActIntensity`. Very cheap on GPU.
- **ConstellationLayer** — `InstancedMesh` of ~20 glowing points, positions fed by `TechConstellation` (randomised around a sphere if positions aren't given). `LineSegments` between selected pairs. DOM overlay for hover labels (mono font, localized via `LocalizationService` keys).
- **ParticleLayer** — single `BufferGeometry` with 30k vertices (5k on mobile). Positions animated by a vertex shader from a `targetBuffer`. Three target configurations:
  - Scattered cloud (default).
  - Text raster of "Andrés Talavera" (generated at init by rendering the name to an off-screen canvas, sampling pixels, converting to positions).
  - Per-section ambient tags (small dotted formations that hint at section themes — optional, implemented last).

### Scroll orchestration

- `cinema.js` exposes `registerChapter({ id, element, act })` called from Blazor via JS interop for each `ChapterSection`.
- For each chapter, a `ScrollTrigger` tween updates the scene uniforms (plasma intensity, constellation opacity, particle target) and triggers DOM reveals inside the chapter (stagger on cards, mask on headings, etc.).
- **Act III (Experiences)** uses ScrollTrigger with `pin: true`, `scrub: 1`, `end: "+=200%"`. The vertical scroll range drives an `x: -100%` translate on the timeline strip. Each card's `z` (depth), `scale`, and `opacity` are interpolated based on its position relative to the active zone.
- `gsap.matchMedia({ "(max-width: 767px)": ... })` disables the pin and uses a simple vertical stagger fallback on touch devices.

### Blazor service

```csharp
public interface ICinemaEngine
{
    Task InitializeAsync(CinemaConfig config);
    Task SetConstellationAsync(IEnumerable<TechNode> nodes);
    Task RegisterChapterAsync(string id, ElementReference element, int act);
    Task SetCultureAsync(string cultureName);
    Task DisposeAsync();
}
```

`CinemaEngine` is a scoped service registered in `Program.cs`. Holds an `IJSObjectReference` to the cinema module. `CinemaStage` owns the lifecycle (init on `OnAfterRenderAsync(firstRender: true)`, dispose on `DisposeAsync`). Culture changes trigger a refresh of constellation labels without recreating the scene.

### Accessibility

- `<canvas>` is `aria-hidden="true"`, the underlying semantic content (name, title, intro, sections) remains fully available to assistive technology.
- `prefers-reduced-motion: reduce` is checked in `cinema.js`; when set, the engine skips the particle animations and the pinned scroll, renders a static gradient background via CSS, and all reveals become instantaneous. Chapter transitions become hard cuts; content is fully usable.
- Skip-link conserved at the top of `MainLayout`.
- Focus rings visible on all interactive elements (buttons, links, CTAs).
- Keyboard navigation: the pinned horizontal timeline is skippable (focus jumps to the next chapter heading; internal card focus uses left/right arrow keys as a progressive enhancement).

## Design system — SCSS structure

```
wwwroot/scss/
  styles.scss              # entry, imports layers in order
  tokens/
    _colors.scss           # palette + ink scale
    _typography.scss       # font families, scale, line-heights
    _space.scss            # 4pt scale, radii, shadows/elevations
    _motion.scss           # easing + durations (also exposed as --vars for JS)
  base/
    _reset.scss            # modern-normalize minimal
    _root.scss             # :root variables, dark theme
    _typography.scss       # display/body/mono styles
  patterns/
    _chapter.scss          # ChapterSection markup
    _card.scss             # glass card base + variants
    _timeline.scss         # ExperienceTimeline layout
    _button.scss           # primary/secondary/ghost/social
    _constellation.scss    # DOM hover labels
    _navbar.scss           # MainLayout nav
    _footer.scss
  utilities/
    _stack.scss            # gap / flow utilities
    _visually-hidden.scss
    _responsive.scss       # breakpoint mixins
```

All tokens exposed as CSS custom properties on `:root`. `cinema.js` reads them at init via `getComputedStyle(document.documentElement)` so the palette stays in one place.

### Fonts

- Inter Variable (weights 300–700) and JetBrains Mono (400), self-hosted from `@fontsource-variable/inter` and `@fontsource/jetbrains-mono`.
- Copied into `wwwroot/fonts/` at build time.
- `font-display: swap`. Preload Inter 400 and 700 + JetBrains Mono 400 via `<link rel="preload">` in the host HTML.
- No Google Fonts (GDPR, offline-friendly).

### Bootstrap removal

- `bootstrap` dependency removed from `package.json`.
- All Bootstrap class usages (`row`, `col-*`, `btn`, `card`, `d-flex`, `container`, `navbar*`, `badge`, `fw-*`) replaced by the new design-system classes or native CSS Grid + Flexbox.
- Print styles and `d-print-*` utilities re-implemented minimally in `utilities/_print.scss` (CV print view must remain functional).

## Performance budget

Targets (measured on a mid-range laptop and a recent phone over Fast 3G):

- Hero animation: **60 fps desktop**, **30 fps mobile acceptable**.
- LCP: **< 2.5 s**.
- Total JS (cinema.bundle.js): **≤ 250 KB gzip**.
- Total CSS (styles.min.css): **≤ 40 KB gzip**.
- Total font payload on initial paint: **≤ 60 KB** (Inter 400 + 700 woff2 subset).

### Fallback tiers

| Condition | Behaviour |
|---|---|
| `prefers-reduced-motion: reduce` | Static CSS gradient, no canvas animation, instant reveals, no pinned scroll |
| `WebGL2` not supported | No canvas, CSS gradient + noise texture fallback, vertical reveals only |
| `max-width: 767px` | Particle count 5k, no pinned scroll, simplified plasma |
| Touch device | No pinned scroll regardless of width |

## Build and tooling

### Dependencies added

```
three                               ^0.170
gsap                                ^3.13
@fontsource-variable/inter          ^5
@fontsource/jetbrains-mono          ^5
esbuild                             ^0.25 (devDependency)
modern-normalize                    ^3
```

### Dependencies removed

```
bootstrap
```

### npm scripts

```
"compile-styles":  "sass wwwroot/scss/styles.scss:wwwroot/css/styles.min.css --style=compressed --update --color"
"compile-scripts": "esbuild wwwroot/src/cinema/index.js --bundle --minify --outfile=wwwroot/js/cinema.bundle.js --format=esm --sourcemap"
"copy-fonts":      "node scripts/copy-fonts.mjs"
"build":           "npm run copy-fonts && npm run compile-styles && npm run compile-scripts"
```

### MSBuild integration

The existing `NpmRunBuild` target calls `npm run build` instead of `npm run compile-styles`. All three sub-scripts run on every .NET build, gated by the existing `Inputs/Outputs` markers extended to include `wwwroot/src/**` and `wwwroot/scss/**`.

## Testing

- **Integration tests (`IntegrationTests.cs`)** — extended to assert the new section ids (`#hero`, `#about`, `#experiences`, `#trainings`, `#contact`) are reachable and content is present in both languages.
- **Unit tests** — new tests for `TechConstellation` data binding and `CinemaEngine` (mock `IJSRuntime`, verify a single `InitializeAsync` call, culture change triggers label refresh).
- **Manual regression pass** before deployment:
  - Both languages render correctly.
  - Keyboard nav reaches every interactive element.
  - `prefers-reduced-motion` disables the animations.
  - CV print view still works (`d-print-*` equivalents).
  - Lighthouse: Perf ≥ 85, A11y ≥ 95, Best Practices ≥ 95, SEO = 100.
- No automated visual-regression tests (out of scope / overkill for a single-page portfolio).

## Migration plan

Seven steps, each independently mergeable. If the work stops at any step, the site remains functional. The implementation plan may split this into two phases — Phase 1 (step 1 alone: design system migration) and Phase 2 (steps 2–7: cinema engine and chapters) — to keep each plan in scope.

1. **Design system SCSS.** Add tokens, base, patterns. Replace Bootstrap class usage on existing components. Remove Bootstrap from package.json. Site re-skinned, no JS change, no animation change.
2. **Cinema engine skeleton.** Add Three.js + GSAP dependencies, esbuild script, `cinema.js` rendering only the plasma layer. Add `CinemaStage` and `ICinemaEngine`. Delete `AnimatedComponentBase`, `animations.js`, `IAnimationService`. Existing reveals replaced by simple CSS transitions for now.
3. **Particle system + name assembly.** Add particle layer with scattered/text-raster target states. Hero name rendered in particles, scatters on scroll.
4. **Constellation layer.** Add `TechConstellation` component + JS layer. DOM hover labels (localized). Constellation persists as ambient through lower sections.
5. **GSAP reveals across sections.** Attach ScrollTriggers to About and Training. Staggered reveals replacing Step 2's CSS transitions.
6. **Pinned horizontal Experiences.** Implement `ExperienceTimeline` with pinned scroll on desktop, vertical fallback on mobile and touch.
7. **Polish.** `prefers-reduced-motion` full path, keyboard nav for the pinned act, focus rings, font preload, SEO check, Lighthouse audit, perf tuning.

## Open decisions deferred to implementation

- Specific easing curves and durations — tuned while implementing, not locked upfront.
- Exact hero particle target layout (kerning of "Andrés Talavera") — validated visually in step 3.
- Node positions of the constellation — start random-on-sphere, adjust visually in step 4.
- Final list of technologies shown on the constellation — pulled from Resume `Skills` or a curated list; decided in step 4 using the actual localized JSON.
