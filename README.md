# IdeaStudio Website

Code for https://ideastud.io. Blazor WebAssembly site inspired by Microsoft Fluent 2, implemented with Bootstrap 5.3.

## Design

- Inspired by Microsoft Fluent 2 Design
- Implemented with Bootstrap `5.3`
- Key Bootstrap variables overridden to align with Fluent 2
- Print stylesheet for high-quality PDF export

## Tech stack

- .NET `9` + ASP.NET Core Blazor WebAssembly
- Bootstrap `5.3`
- SCSS (compiled to `wwwroot/css`)
- JSON content per language in `wwwroot/data`

## Getting started

Prerequisites:

- .NET SDK `9.x`

Run locally:

- `cd IdeaStudio.Website`
- `dotnet restore`
- `dotnet watch run`
- Open the served URL from the console output.

Build (Release):

- `dotnet publish -c Release`
- Published assets under `IdeaStudio.Website/bin/Release/net9.0/publish/wwwroot`

Optional (SCSS):

- Edit `wwwroot/scss/styles.scss` and recompile using your preferred Sass workflow or VS Code extension.

## Project layout

- `IdeaStudio.Website/` Blazor WASM project
- `wwwroot/data/` localized content (`resume-en.json`, 1 JSON per language)
- `wwwroot/css/` generated CSS (`styles.min.css`, `print.min.css`)
- `wwwroot/js/` site JS (`animations.js`)
- `Services/` light services (lazy loading, SEO)
- `Shared/` reusable UI components
- `Pages/` routed pages

## Release history

### v3.0

Highlights:

- Printing version OK (PDF export)
- Updated to .NET `9`
- Added lazy loading
- Reorganized models
- One JSON per language (ready; English available)
- Various optimizations
- Improved design, UI, and UX (animations, delays, styles, etc.)
- Bootstrap variables tuned to match Microsoft Fluent 2

Next steps (planned after v3 → v4):

- Add French and a localization system
- Improve texts for SEO
- Contact form with CAPTCHA
- Create APIs (use SWA features)
- Add unit tests

### v2

Highlights:

- Switched from Fluent UI components to custom Bootstrap (performance)
- Fixed “get training centers”
- Note: .NET 9 was initially blocked by Azure Static Web Apps, so v2 used .NET 8 (later upgraded in v3)

Next steps (planned after v2, partially delivered in v3):

- Migrate to .NET 9 once supported by SWA
- Printing/PDF improvements
- Lazy loading and model reorganization
- Prepare localization (1 JSON per language)
- Contact form, APIs, and unit tests

### v1

Highlights:

- Upgraded to .NET `8`
- Based on Microsoft Fluent 2 Design System
- Used Fluent UI Blazor
- Known issue: `GetTrainingCenters` API didn’t work

Next steps (planned after v1, partially delivered in v2/v3):

- Fix `GetTrainingCenters` API
- Improve performance (evaluate Bootstrap vs. Fluent UI)
- Prepare AOT compilation
- Improve design and print experience
- Add tests

### v0

Highlights:

- First version with Bootstrap `5.3` and ASP.NET Blazor (.NET `7`)

## Information

- Branching: `main` is production (single-branch workflow)
- GitHub Issues: up to date and used for tracking
- Deployment target: Azure Static Web Apps
- CI: GitHub Action runs on PRs to `main`
- Integrations: Copilot and SoundCloud configured

## Contribute

- Branch naming: `feature/describe-your-feature-in-6-words`
- Coding guidelines:
  - Use modern C#/.NET (C# with .NET `9`)
  - Prefer spans, source generators, and performance-minded patterns
  - Enable and respect nullable reference types
  - Keep components small and reusable
  - Follow Bootstrap 5 and Fluent 2 alignment already in variables
- Before committing:
  - `dotnet restore`
  - `dotnet build -c Release`
  - `dotnet format` (if available)
- Pull requests:
  - Target `main`
  - Link related Issues
  - Include tests when adding features (unit tests coming in v4)
  - Update docs/README when behavior or structure changes

## FAQ

### Why Blazor?

- Full-stack development with C#
- Reusable code across projects
- WebAssembly for near-native performance

### Why a single branch?

- Simplicity. CI validates via integration and unit tests on PRs to `main`.

### How do I run it locally?

- `cd IdeaStudio.Website && dotnet watch run`

### How do I export to PDF?

- Use the browser’s print dialog and “Save as PDF”. The `print.min.css` styles are optimized for export.

### How is lazy loading implemented?

- Via a small service and placeholder components to defer non-critical content and assets until needed.

### How do I add a new language?

- Add a new file under `wwwroot/data/` (e.g., `resume-fr.json`)
- Mirror the structure of `resume-en.json`
- Wire up the language selection in the app (localization system planned in v4)

### Where are images and data stored?

- Images: `wwwroot/images/`
- Localized content: `wwwroot/data/`

### What about SEO?

- Ongoing improvements planned in v4 (content quality, metadata, performance budgets).
