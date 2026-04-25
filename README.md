# IdeaStudio Website

Editorial portfolio for [ideastud.io](https://ideastud.io).

- Client-only Blazor WebAssembly (.NET 10), AOT-compiled in Release
- Custom SCSS design system (no Bootstrap, no component library)
- Small JS "cinema" bundle (esbuild + GSAP) for reveals, cursor and magnetic interactions
- Bilingual (French + English) — per-culture routes and per-language JSON content
- Published as static files (Azure Static Web Apps; Fly.io target staged)

## Features

- Techno-iridescent dark design system (see [DESIGN.md](DESIGN.md))
- Per-character signature reveal hero with sticky behaviour
- Localized URL map with FR↔EN slug translation for service detail pages
- Self-hosted variable fonts (Inter Variable, JetBrains Mono)
- Light services (lazy-loading, content gateway, localization, scene theme, slug translation)
- Per-culture content JSON (`services-{lang}.json`, `realisations-{lang}.json`, `resume-{lang}.json`)
- Print/PDF-friendly resume export
- Bundle-budget test pinning the JS cinema bundle to ≤ 50 KB gzipped
- xUnit + Moq + Coverlet test suite (integration, route, filter, paths, bundle)
- GitHub Actions → Azure Static Web Apps deploy

## Tech stack

- .NET 10 + ASP.NET Core Blazor WebAssembly
- WebAssembly AOT (Release)
- Markdig (markdown), Microsoft.Extensions.Localization, Application Insights (worker)
- SCSS via Sass; JS bundled with esbuild
- GSAP (animation), modern-normalize
- Inter Variable + JetBrains Mono (`@fontsource-variable/inter`, `@fontsource/jetbrains-mono`)
- xUnit, Moq, Coverlet
- GitHub Actions for CI/CD; Azure Static Web Apps for hosting
- `IdeaStudio.Apis` — minimal-API host scaffolded for future endpoints (no endpoints yet)

## Repository structure

- `IdeaStudio.Website/` — Blazor WASM app
  - `Components/` — Razor components (Hero, Masthead, Footer, Reveal, RevealChars, GlCanvas, …)
  - `Models/` — POCOs deserialized from per-language JSON (Resume, Service, Realisation, …)
  - `Pages/` — Routable pages (Home, Cv, Services, ServiceDetail, Realisations, Privacy, Legal, …)
  - `Services/` — Interfaces + implementations (IContentGateway, ILocalizedRoute, ISceneTheme, ICultureService, …)
  - `wwwroot/`
    - `scss/` — Source SCSS (tokens/, base/, components/, layout/, utilities/)
    - `css/` — Compiled CSS (do not hand-edit)
    - `src/cinema/` — JS source (engine, interactions, passes, shaders, signature, utils)
    - `js/` — Compiled JS (`cinema.bundle.js`, do not hand-edit)
    - `data/` — Per-culture content JSON
    - `i18n/` — UI string bundles (en.json, fr.json)
    - `fonts/`, `images/`, `*.pdf`
    - `staticwebapp.config.json` — Azure SWA routing + 301 redirects
  - `scripts/copy-fonts.mjs` — Stages variable fonts out of `node_modules/`
  - `package.json` — esbuild + sass build pipeline
  - `fly.toml` — Fly.io deploy (staged)
- `IdeaStudio.Website.Tests/` — xUnit test project (BundleBudget, HardcodedPaths, Integration, LocalizedRoute, RealisationFilter)
- `IdeaStudio.Apis/` — Minimal-API host (Clean Architecture folder scaffold; no endpoints yet)
- `DESIGN.md` — Design system source of truth

## Getting started

Prerequisites (macOS):

- .NET SDK 10.x
  - macOS: `brew install --cask dotnet-sdk` (or via [Microsoft installer](https://dotnet.microsoft.com/download))
- Node.js 20+: `brew install node` — required for the SCSS/JS pipeline that runs as part of `dotnet build`
- (Release/local AOT only) `dotnet workload install wasm-tools`
- VS Code (recommended) with extensions: "C# Dev Kit", "EditorConfig", ".NET Test Explorer"

Clone and restore:

```bash
git clone https://github.com/andrestalavera/ideastudio.git
cd ideastudio
dotnet restore
```

Run locally:

```bash
dotnet watch run --project IdeaStudio.Website/IdeaStudio.Website.csproj
```

> The first build runs `npm install` + `npm run build` automatically (MSBuild `BeforeBuild` target). Subsequent builds skip when SCSS/JS sources are unchanged.

Build (Release, AOT):

```bash
dotnet publish IdeaStudio.Website/IdeaStudio.Website.csproj -c Release
# Output: IdeaStudio.Website/bin/Release/net10.0/publish/wwwroot
```

Frontend asset pipeline (when iterating on styles/JS without restarting `dotnet`):

```bash
cd IdeaStudio.Website
npm run watch-compile-styles    # SCSS watch → wwwroot/css/styles.min.css
npm run watch-compile-scripts   # esbuild watch → wwwroot/js/cinema.bundle.js
```

## Tests

```bash
dotnet test                                  # all tests
dotnet test /p:CollectCoverage=true          # with Coverlet coverage
```

What's covered:

- Unit tests for localized routing and realisation filtering
- A "no hardcoded paths" guard that fails the build if non-localized URLs leak into components
- A bundle-budget test that fails if `cinema.bundle.js` exceeds 50 KB gzipped
- Integration tests that boot the WASM static output and validate routes/assets

> The bundle-budget test requires `dotnet build` (or `npm run build`) to have produced `cinema.bundle.js` first.

## Git workflow

- `main` is production
- Short-lived feature branches: `feature/<5-words-description>`
- PRs target `main`; CI runs build + tests
- Tag notable releases (e.g. `v3.x`); release notes live in this README

## Deployment

### Azure Static Web Apps (current)

`.github/workflows/azure-static-web-apps-nice-hill-0b1c51e03.yml`

- Triggered on push/PR to `main`
- Publishes the AOT'd output at `IdeaStudio.Website/bin/Release/net10.0/publish/wwwroot`
- Deploys via the SWA token

### Fly.io (staged)

`IdeaStudio.Website/fly.toml` is committed (region `cdg`, app `ideastudio-website`) but the Azure SWA workflow remains the live deploy target.

## Print / PDF export

Open the browser print dialog (or call `window.print()`). Print-specific styles are baked into the compiled SCSS. A pre-built resume PDF is also shipped at `wwwroot/resume-{en,fr}.pdf`.

## Lazy loading

Lazy loading defers non-critical content to keep the initial payload small.

- `ILazyLoadingService` coordinates deferred JSON/data loads
- `IContentGateway` (currently `JsonContentGateway`) is the abstraction pages consume — swap to an HTTP-backed gateway via DI without touching pages
- `FrozenDictionary` is used for static, immutable lookups (zero lock contention, near-ideal lookup cost)

## Release history

> Track work via [Issues](https://github.com/andrestalavera/ideastudio/issues).

### v0

- Initial Blazor (.NET 7) + Bootstrap 5.3

### v1

- Microsoft Fluent 2 + Fluent UI components for Blazor

### v2

- Switched from Fluent UI components back to Bootstrap; basic Fluent 2 via Bootstrap variables; .NET 8

### v3

- .NET 9 → .NET 10, AOT in Release
- Bootstrap removed in favour of a custom SCSS design system (Techno-Iridescent — see DESIGN.md)
- esbuild + GSAP "cinema" runtime for reveals, cursor, magnetic and signature interactions; JS bundle pinned ≤ 50 KB gzipped
- Self-hosted Inter Variable + JetBrains Mono
- Bilingual routing via `ILocalizedRoute`; per-culture content JSON; FR↔EN service-slug translation
- `IContentGateway` abstraction for content reads
- Test suite expanded (bundle budget, hardcoded paths, localized route, realisation filter)

## Information

- Branching: `main` is production
- GitHub Issues for tracking
- CI: GitHub Actions on PRs to `main`
- Hosting: Azure Static Web Apps

## Contribute

- Branch naming: `feature/describe-your-feature-in-6-words`
- Coding guidelines:
  - Modern C# (.NET 10), nullable enabled, `latest` analysis level
  - Prefer source-generated paths (regex, logging via `[LoggerMessage]`)
  - Keep components small; route URLs through `ILocalizedRoute`, never hard-code `/fr/...`
  - Tokens/typography/colour come from the SCSS design system — see `DESIGN.md`
- Before committing:
  - `dotnet restore`
  - `dotnet build -c Release`
  - `dotnet test`
- Pull requests:
  - Target `main`
  - Link Issues
  - Include/update tests for behaviour changes
  - Update README/DESIGN.md/CLAUDE.md when structure or conventions change

## FAQ

### Why Blazor?

C# end-to-end and WebAssembly performance in the browser. Shared types across `IdeaStudio.Website`, the future `IdeaStudio.Apis`, and the test project.

### Why AOT now?

The Oryx limitation that previously blocked AOT on Azure SWA no longer applies for our build — the GitHub Actions workflow runs `dotnet publish -c Release` ourselves and uploads the prebuilt artifacts (`skip_app_build: true`), so we control the toolchain. AOT is enabled via `RunAOTCompilation` in `IdeaStudio.Website.csproj` for `Configuration=Release` and requires `dotnet workload install wasm-tools` locally.

### How do I export to PDF?

Open the browser print dialog or call `window.print()`. Pre-built resume PDFs are also shipped at `wwwroot/resume-{en,fr}.pdf`.

### How is lazy loading implemented?

Content is read through `IContentGateway` (JSON-backed today) which defers fetches via `ILazyLoadingService`. Static lookups use `FrozenDictionary`.

### Where are data and images stored?

- Content JSON: `IdeaStudio.Website/wwwroot/data/`
- UI strings: `IdeaStudio.Website/wwwroot/i18n/`
- Images / videos: `IdeaStudio.Website/wwwroot/images/`
- Fonts: `IdeaStudio.Website/wwwroot/fonts/`

### What about SEO?

`SeoHead.razor` emits titles/metadata; `Models/SchemaOrg.cs` builds JSON-LD payloads. `wwwroot/sitemap.xml`, `robots.txt`, `llms.txt`, `ai.txt` ship at the root.

### Architecture type?

Client-only SPA (Blazor WebAssembly). No server rendering. CDN-friendly static assets.

### Why no Bootstrap / Fluent UI?

The editorial direction (see DESIGN.md) calls for a bespoke dark-first system with a single iridescent gradient and asymmetric layouts. A component library would fight the design rather than carry it. Smaller runtime and tighter control over critical CSS as a side-effect.

### Performance choices?

AOT in Release; lazy-loaded content; minified single-file CSS and JS bundles; `FrozenDictionary` for static lookups; bundle-budget test gating regressions; minimal allocations in components.

### State management?

Local component state, parameters, cascading values; no global store. Cross-cutting state (current culture, scene theme) lives in scoped services.

### Internationalization?

French and English are first-class. UI strings come from `wwwroot/i18n/{lang}.json` via `LocalizationService`; URLs are mapped per-culture via `ILocalizedRoute`; service slugs translate FR↔EN via `ISlugTranslator`. Adding a new language means adding the JSON files and route entries.

### Testing strategy?

xUnit + Moq with Coverlet coverage. Unit tests for routing/filters; a guard that greps for hardcoded paths; a bundle-budget test; integration tests over the published WASM output.

### Security posture?

Pure static hosting; no secrets in client code. CSP and headers can be enforced at the SWA edge if needed.

### Build/release

`dotnet build` triggers the npm pipeline (`npm install` + `npm run build`) via the `NpmRunBuild` MSBuild target before the .NET build. Release builds AOT-compile. GitHub Actions deploys the prebuilt `publish/wwwroot` to SWA.

## Troubleshooting

- **`dotnet` not found (macOS):** Reinstall SDK via Homebrew or the Microsoft installer; ensure `/usr/local/share/dotnet` is on `PATH`.
- **First build fails on `npm`:** Install Node.js 20+ (`brew install node`). The `NpmRunBuild` MSBuild target needs `npm` on `PATH`.
- **AOT Release build fails locally:** Run `dotnet workload install wasm-tools`.
- **`BundleBudgetTests` fails with "Bundle not built":** Run `dotnet build` (or `cd IdeaStudio.Website && npm run build`) before `dotnet test`.
- **`HardcodedPathsTests` fails:** A component is using a literal `/fr/...` or `/en/...`. Route through `ILocalizedRoute.For(pageId, culture)` instead.
- **SWA deploy fails on Oryx:** Ensure `skip_app_build: true` and that the workflow uploads the prebuilt `publish/wwwroot`.
- **Blank page after deploy:** Confirm the workflow points to `IdeaStudio.Website/bin/Release/net10.0/publish`.
