---
project: IdeaStudio
type: blazor-wasm
framework: .NET 10
description: Editorial portfolio site (Blazor WASM) with custom SCSS design system and a JS cinema bundle
---

# IdeaStudio - Portfolio

## Overview

Blazor WebAssembly (.NET 10) editorial portfolio. AOT-compiled in Release.
Custom SCSS design system (no Bootstrap, no component library) and a small
JS "cinema" bundle (esbuild, GSAP) for reveals/cursor/magnetic interactions.
Multilingual: French and English are first-class (per-culture routes and JSON).

## Solution Structure

```text
IdeaStudio.sln
├── IdeaStudio.Website/                 # Main Blazor WASM application
│   ├── Components/                     # Reusable Razor components
│   │   ├── ActionRow.razor             #   CTA pair / button row
│   │   ├── CardGrid.razor              #   Grid wrapper for tiles
│   │   ├── ChapterBand.razor           #   Section header band
│   │   ├── CtaBand.razor               #   Footer-adjacent CTA
│   │   ├── CultureSelector.razor       #   FR/EN switch
│   │   ├── EditorialList.razor         #   Editorial bulleted list
│   │   ├── Footer.razor
│   │   ├── GlCanvas.razor              #   Mount point for JS cinema runtime
│   │   ├── Hero.razor
│   │   ├── LegacyRedirect.razor        #   Old-URL → localized URL redirector
│   │   ├── LocalizedComponent.cs       #   Base class for localized components
│   │   ├── Masthead.razor              #   Top nav pill
│   │   ├── Progress.razor              #   Scroll progress bar
│   │   ├── ProjectTile.razor
│   │   ├── QABlock.razor
│   │   ├── ResumeBand.razor
│   │   ├── Reveal.razor                #   Scroll-reveal wrapper
│   │   ├── RevealChars.razor           #   Per-char text reveal
│   │   ├── SeoHead.razor
│   │   ├── SignatureName.razor         #   Animated signature display
│   │   ├── TeachList.razor
│   │   └── Timeline.razor
│   ├── Models/
│   │   ├── AboutSection.cs
│   │   ├── Experience.cs
│   │   ├── Extensions.cs
│   │   ├── PersonalInformation.cs
│   │   ├── Realisation.cs              #   Portfolio item
│   │   ├── Resume.cs
│   │   ├── SchemaOrg.cs
│   │   ├── Service.cs                  #   Editorial service offering
│   │   └── TrainingCenter.cs
│   ├── Pages/
│   │   ├── Home.razor                  #   /fr  /en
│   │   ├── Cv.razor                    #   /fr/cv  /en/resume (+ legacy aliases)
│   │   ├── Services.razor              #   /fr/services  /en/services
│   │   ├── ServiceDetail.razor         #   /{culture}/services/{slug}
│   │   ├── Realisations.razor          #   /fr/realisations  /en/projects (+ /portfolio aliases)
│   │   ├── Privacy.razor               #   /fr/confidentialite  /en/privacy
│   │   ├── Legal.razor                 #   /fr/mentions-legales  /en/legal
│   │   └── ProtoSignature.razor        #   /proto/signature (internal preview)
│   ├── Services/                       # Interfaces + implementations live together
│   │   ├── IContentGateway.cs          #   + JsonContentGateway (reads wwwroot/data/*.json)
│   │   ├── ICultureService.cs          #   + CultureService
│   │   ├── ILazyLoadingService.cs      #   + LazyLoadingService
│   │   ├── ILocalizationService.cs     #   + LocalizationService (i18n strings)
│   │   ├── ILocalizedRoute.cs          #   + LocalizedRoute (FR/EN URL map)
│   │   ├── ISceneTheme.cs              #   JS-interop wrapper for the cinema runtime
│   │   ├── ISlugService.cs             #   + SlugService (source-generated regex)
│   │   ├── ISlugTranslator.cs          #   + SlugTranslator (FR↔EN service slug)
│   │   ├── CinemaSceneConfig.cs
│   │   ├── RealisationFilter.cs
│   │   └── SceneTheme.cs
│   ├── wwwroot/
│   │   ├── css/                        # Compiled (styles.min.css) — do not hand-edit
│   │   ├── scss/                       # base/, components/, layout/, tokens/, utilities/, styles.scss
│   │   ├── src/cinema/                 # JS source bundled by esbuild → js/cinema.bundle.js
│   │   ├── js/                         # Compiled (cinema.bundle.js) — do not hand-edit
│   │   ├── data/                       # services-{fr,en}.json, realisations-{fr,en}.json, resume-{fr,en}.json
│   │   ├── i18n/                       # en.json, fr.json (UI strings)
│   │   ├── fonts/                      # Inter Variable, JetBrains Mono — self-hosted
│   │   ├── images/, *.pdf
│   │   ├── index.html, llms.txt, ai.txt, robots.txt, sitemap.xml
│   │   └── staticwebapp.config.json    # Azure SWA routing + 301 redirects
│   ├── scripts/copy-fonts.mjs          # Copies font assets out of node_modules
│   ├── App.razor, MainLayout.razor, _Imports.razor
│   ├── LoggerExtensions.cs             # [LoggerMessage] source-generated logging
│   ├── Program.cs
│   ├── package.json                    # esbuild + sass build pipeline
│   └── fly.toml                        # Fly.io deploy (staged; SWA is currently live)
├── IdeaStudio.Website.Tests/           # xUnit + Moq + Coverlet
│   ├── BundleBudgetTests.cs            #   cinema.bundle.js gzipped ≤ 50 KB
│   ├── HardcodedPathsTests.cs
│   ├── IntegrationTests.cs
│   ├── LocalizedRouteTests.cs
│   └── RealisationFilterTests.cs
└── IdeaStudio.Apis/                    # Minimal-API host (scaffold only — no endpoints yet)
    └── Api/, Application/, Domain/, Infrastructure/   # Clean Architecture folders w/ READMEs
```

> `IdeaStudio.Website.Models` was removed — the directory still exists with empty `bin/obj` but has no `.csproj`. Models live inside `IdeaStudio.Website/Models/`.

## Build & Test Commands

```bash
# Build entire solution (also runs `npm install` + `npm run build` for the website)
dotnet build IdeaStudio.sln

# Build website only
dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj

# Run tests (requires the cinema bundle to exist — `dotnet build` first)
dotnet test IdeaStudio.sln

# Run the website (hot reload)
dotnet watch run --project IdeaStudio.Website/IdeaStudio.Website.csproj

# Frontend asset pipeline only
cd IdeaStudio.Website
npm run build                    # copy-fonts + sass + esbuild
npm run watch-compile-styles     # SCSS watch
npm run watch-compile-scripts    # esbuild watch
```

**Build pipeline gotcha:** `IdeaStudio.Website.csproj` has an MSBuild `BeforeBuild` target (`NpmRunBuild`) that runs `npm run build`. The first `dotnet build` therefore needs Node.js available. CI inputs/outputs are tracked so subsequent builds are no-op when nothing changed.

**Release builds AOT-compile** (`RunAOTCompilation=true` when `Configuration=Release`) and require the `wasm-tools` workload locally:

```bash
dotnet workload install wasm-tools
```

## Component Conventions

- Pages use `@page` and live in `Pages/`. Most pages are bilingual — declare both `/fr/...` and `/en/...` routes on the same component (see `Services.razor`, `Cv.razor`).
- Reusable components live in `Components/`.
- Components needing i18n inherit `LocalizedComponent` (see `Components/LocalizedComponent.cs`).
- Scroll reveal: wrap content in `<Reveal>` (block-level fade/slide) or `<RevealChars Text="…" />` (per-character reveal).
- The cinema runtime (cursor halo, reveals observer, magnetic, sticky-hero) is mounted once via `<GlCanvas />` in `MainLayout.razor` and driven by `ISceneTheme.InitializeAsync()`. Pages do not declare per-page scenes; they apply a scene theme by setting the `data-scene` attribute via `ISceneTheme.ApplyAsync(...)`.
- Use `[Parameter]` for component parameters, `@inject` for DI.
- Code-behind in `.cs` is allowed (see `LocalizedComponent.cs`). Most components use single-file Razor.

## Service Pattern

- Interface + implementation live in the same file under `Services/` (e.g. `IContentGateway.cs` defines both `IContentGateway` and `JsonContentGateway`).
- All services are registered in `Program.cs` as scoped.
- Content reads go through `IContentGateway` (currently JSON-backed via `ILazyLoadingService` + `wwwroot/data/`); a future HTTP gateway can be swapped at DI registration.
- URLs are localized via `ILocalizedRoute.For(pageId, culture)` — never hard-code `/fr/...` paths in components. Service slugs are translated across cultures via `ISlugTranslator`.
- JS interop is concentrated in `SceneTheme` — components should call `ISceneTheme`, not `IJSRuntime` directly.

## Test Conventions

- xUnit + Moq, coverage via Coverlet.
- `BundleBudgetTests` enforces `wwwroot/js/cinema.bundle.js` gzipped ≤ 50 KB. If a change blows the budget, profile before raising it.
- `HardcodedPathsTests` greps the codebase for non-localized URLs — go through `ILocalizedRoute` instead.
- `LocalizedRouteTests`, `RealisationFilterTests` cover the corresponding services.
- `IntegrationTests` boots the published WASM static output and validates routes/assets.
- Naming: `MethodName_Scenario_ExpectedResult`.

## Multilingual Support

- UI strings: `wwwroot/i18n/en.json`, `wwwroot/i18n/fr.json` — loaded by `LocalizationService`.
- Content data: `wwwroot/data/{services,realisations,resume}-{fr,en}.json` — read via `IContentGateway`.
- Routes are the canonical FR/EN map in `LocalizedRoute.StaticRoutes` (e.g. `cv` → `/fr/cv` and `/en/resume`). `CultureSelector` uses `ILocalizedRoute.Translate(currentPath, targetCulture)` to swap cultures while preserving the page.
- `LegacyRedirect` (mounted in `App.razor` `<NotFound>`) maps old non-localized URLs to their localized equivalents.

## Design System

- Source of truth for visuals: `DESIGN.md` at the repo root (Techno-Iridescent V3) — mirrors `wwwroot/scss/tokens/`.
- Dark-first; pure `#000` is banned. Iridescent gradient used as a single shared object across SCSS and the cinema runtime.
- Type: Inter Variable + JetBrains Mono, self-hosted in `wwwroot/fonts/` (copied from npm by `scripts/copy-fonts.mjs`).
