# IdeaStudio Website

Blazor WebAssembly site for https://ideastud.io.

- Client-only Blazor WebAssembly (.NET 9)
- Bootstrap 5.3 + SCSS pipeline
- Localized JSON content per language
- Optimized print styles and lazy loading
- Azure Static Web Apps deployment

## Features

- Fluent 2-inspired design via tuned Bootstrap 5 variables
- High-quality print/PDF export
- Lazy loading of non-critical content/assets
- Lightweight services (SEO, lazy loading, animations)
- JSON content per language (English ready; more languages planned)
- CI-friendly structure with tests

## Tech stack

- .NET 9
- ASP.NET Core Blazor WebAssembly
- Azure Functions v4
- Bootstrap 5.3
- SCSS compilation
- GitHub Actions for CI/CD
- Azure Static Web Apps for hosting

## Repository structure

- /IdeaStudio.Website
  - /Components _Shared components_
  - /Models _Records to modelize JSON data into C#_
  - /Pages _Application pages_
  - /Properties _Project properties - for Visual Studio_
  - /Services _Implemented services - SEO, Lazy loading, ..._
  - /Shared _Shared components_
  - /wwwroot
    - /css _Generated CSS files_
    - /data _JSON files to deserve data_
    - /images _Media items for website (images, videos, ...)_
    - /js _Javascript home made scripts_
    - /scss _SCSS files to generate styles_
- /IdeaStudio.Website.Tests _Unit tests project_

## Getting started

Prerequisites:

- .NET SDK 9.x
  - macOS: Prefer installation via Homebrew with command `brew install --cask dotnet-sdk`
  - Others: Download and follow instructions from [Microsoft](https://dotnet.microsoft.com/download):
- Node.js (optional, for Sass): `brew install node`
  - Sass compiler: `npm i -D sass` (in `IdeaStudio.Website` folder)
- VS Code (recommended)
  - Extensions: "C# Dev Kit", "EditorConfig", ".NET Test Explorer", optional “Live Sass Compiler”

Clone and restore:

- `git clone https://github.com/andrestalavera/ideastudio.git`
- `cd ideastudio/IdeaStudio.Website`
- `dotnet restore`

Run locally:

- `dotnet watch run` to run with hotreload and restart features.
- Open the served URL shown in the console.

> Use `dotnet run` to run only.

Build (Release):

- `dotnet publish -c Release`
- Output: `IdeaStudio.Website/bin/Release/net9.0/publish/wwwroot`

SCSS workflow (optional):

- Source: `wwwroot/scss/styles.scss`
- One-off compile: `npx sass wwwroot/scss/styles.scss wwwroot/css/styles.min.css --style=compressed --no-source-map`
- Watch mode: `npx sass --watch wwwroot/scss:wwwroot/css --style=compressed`

Optional workloads/tools:

- AOT toolchain (not used for SWA; optional local testing): `dotnet workload install wasm-tools`
- Code formatter: `dotnet tool install -g dotnet-format`

## Tests

- Run all tests: `dotnet test`
- With coverage (Coverlet): `dotnet test /p:CollectCoverage=true`
- What’s covered:
  - Unit tests (e.g., extensions and model helpers)
  - Light integration tests hosting the WASM static output to validate core routes/assets

## Git workflow

- Single branch: `main` is production
- Use short-lived feature branches for changes:
  - Branch: `feature/<5-words-description>`
  - Keep PRs small and focused
- PRs to main:
  - CI runs build and tests
  - Link related GitHub Issues
  - Update README/docs when structure or behavior changes
- Releases:
  - Tag commits for notable releases (e.g., v3.0)
  - Changelog tracked in README “Release history”

## Deployment (Azure Static Web Apps)

This project targets Azure Static Web Apps (SWA). SWA serves the Blazor WASM app as static assets.

### [`azure-static-web-apps-nice-hill-0b1c51e03.yml` workflow](.github/workflows/azure-static-web-apps-nice-hill-0b1c51e03.yml)

- Triggered on push/PR to main
- Publishes to net9.0/publish/wwwroot
- Deploys to SWA with the token

## Print/PDF export

- Use the browser print dialog
- The print version is optimized via CSS (in `styles.min.css` (generated from `styles.scss`))

## Lazy loading and FrozenDictionary

Lazy loading defers non-critical content to keep the initial payload small and speed up First Contentful Paint.

- Service: `ILazyLoadingService` + `LazyLoadingService` coordinates deferred loads
- Placeholders: `PlaceholderComponent.razor` shows skeletons/spinners
- Images/components: Render only when in viewport or after a small delay
- Data lookups: Use `FrozenDictionary` for fast, immutable lookups
- Zero lock contention, near-ideal dictionary lookups
- Great fit for data that never changes at runtime

## Release history

> Consult [Issues](https://github.com/andrestalavera/ideastudio/issues) page for next steps.

### v0

- Initial version with Bootstrap 5.3 + Blazor (.NET 7)
- Data

### v1

- Based on Microsoft Fluent 2
- Fluent UI components for Blazor library (abandon of Bootstrap)

### v2

- Switched from Fluent UI components to Bootstrap
- Fixes
- .NET 8 with AOT (removed)
- Basic Fluent 2 Design implementation for Boostrap

### v3

- Printing version OK (Chromium and Firefox)
- Updated to .NET 9
- Added lazy loading
- Reorganized models
- One JSON per language (English ready)
- Tuned Bootstrap variables for Fluent 2

## Information

- Branching: `main` is production (single-branch workflow)
- GitHub Issues: used for tracking
- Deployment: Azure Static Web Apps
- CI: GitHub Actions on PRs to `main`
- Integrations: Copilot and SoundCloud

## Contribute

- Branch naming: `feature/describe-your-feature-in-6-words`
- Coding guidelines:
  - Modern C# (.NET 9), nullable enabled
  - Prefer spans/alloc-free paths and source generators when reasonable
  - Keep components small and composable
  - Bootstrap 5 aligned to Fluent 2 variables
- Before committing:
  - `dotnet restore`
  - `dotnet build -c Release`
  - `dotnet format` (if installed)
- Pull requests:
  - Target `main`
  - Link Issues
  - Include/update tests for features
  - Update README when needed

## FAQ

### Why Blazor?

- C# end-to-end
- Shared code with other internal C# projects
- WebAssembly for near-native performance in the browser

### Why not AOT?

Azure Static Web Apps’ standard build environment (Oryx) doesn’t support the full WebAssembly AOT toolchain for .NET 9. Prebuilding the app with AOT and pushing static files can work in other hosts, but for SWA this project ships IL (no AOT). Outcome: smaller CI complexity and reliable deployments.

### How do I export to PDF?

Open the browser print dialog or call `window.print()`. Print-specific styles are applied automatically. Core tokens are in `styles.min.css` (from `styles.scss`), and print overrides are in `print.min.css`.

### How is lazy loading implemented?

Non-critical content is wrapped in placeholders and rendered once visible. Static lookups rely on `FrozenDictionary` to minimize runtime cost. This keeps first render fast while ensuring subsequent interactions are snappy.

### Where are data and images stored?

- JSON content: `wwwroot/data/`
- Images: `wwwroot/images/`
- Videos: `wwwroot/images/`

### What about SEO?

- Titles/metadata are handled by a small SEO service. Ongoing improvements target content quality, metadata, and performance budgets.

### Architecture type?

Client-only SPA (Blazor WebAssembly). No server rendering. Assets are static and CDN-friendly.

### Why Bootstrap instead of Fluent UI components?

Smaller runtime, fewer dependencies, and tighter control over critical CSS. We emulate Fluent 2 through variable overrides.

### Performance choices?

Lazy loading, minimized CSS/JS, `FrozenDictionary` for static lookups, minimal allocations in components, and deferring non-critical animations.

### State management?

Local component state with parameters/cascading values where needed; no heavy global state library.

### Internationalization?

Content per language in JSON. A full localization system (v4) will add switching, formatting, and pluralization.

### Testing strategy?

Unit tests for models/helpers; light integration tests validating static site boot and asset availability. Coverage supported via Coverlet.

### Security posture?

Pure static hosting on SWA minimizes attack surface. No secrets in client code; CSP and headers can be enforced at the edge if required.

### Build/release

GitHub Actions build on PRs and main; SWA upload with prebuilt artifacts to avoid Oryx limitations and ensure .NET 9 compatibility.

## Troubleshooting

- dotnet not found (macOS):
  - Reinstall SDK via Homebrew or Microsoft installer. Ensure `/usr/local/share/dotnet` is on PATH.
- Build fails for SCSS:
  - Install Sass locally: `npm i -D sass` and run `npx sass ...`
- SWA deploy fails (Oryx):
  - Ensure `skip_app_build: true` and deploy the published `wwwroot`.
- Blank page after deploy:
  - Confirm the workflow points to `IdeaStudio.Website/bin/Release/net9.0/publish
