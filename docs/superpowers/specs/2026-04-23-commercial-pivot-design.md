# Commercial pivot — IdeaStud.io

**Date:** 2026-04-23
**Status:** Spec — ready for implementation plan
**Scope:** Pivot the site from a CV-first portfolio to a commercial vitrine: new home featuring six services, dedicated per-service pages, a dedicated "Mes réalisations" page with filters, the CV relocated to its own page with two static PDF downloads, and path-based URL internationalization (FR/EN).

## Context

The current site (Blazor WebAssembly, .NET 9) renders a bilingual CV at `/`. Content is driven by static JSON under `wwwroot/data/` and localized via `i18n/{fr,en}.json`. The visual layer (cinematic) is being transformed in a parallel spec (`2026-04-22-cinematic-redesign-design.md`) — atmosphere direction B, Three.js + GSAP motion engine, SCSS design system, five acts on a single page.

The present spec is **content, information architecture, and routing**. It coexists with the cinematic spec: it does not redefine the motion engine, the palette, typography, or the chapter/stage components; it consumes them. Coordination is in parallel (decision B during brainstorming): the cinematic session is expected to adjust its implementation to target the *new* home (commercial vitrine) and the CV page rather than the legacy single-page CV.

## Goals

- Reposition the site commercially: homepage showcases six services as equal offerings with a dominant call-to-action toward Calendly.
- Make the CV a dedicated page at `/fr/cv` / `/en/resume`, with downloadable PDF in each language.
- Create a "Mes réalisations" surface with both a teaser on the home and a filterable full page.
- Introduce six dedicated service pages, indexable by search engines with unique slugs per language.
- Internationalize URLs end-to-end (language prefix + translated slugs).
- Preserve the content pipeline (JSON + i18n) and the existing SEO/structured-data approach.

## Non-goals

- No backend, no API. `IdeaStudio.Apis` stays dormant in this phase.
- No contact form. Primary CTA is the external Calendly link.
- No change to the Resume/Experience/TrainingCenter data model or their JSON files.
- No PDF generation pipeline; the two PDF files are produced and maintained outside the site.
- No cinematic motion work: palette, typography, WebGL engine, chapter/stage components, and design-system SCSS are defined and implemented by the parallel cinematic spec. This spec only **uses** them.
- No analytics, no tracking.
- No filter URL persistence (state stays in-memory for v1).

## Design direction

Visual: locked to the cinematic spec (direction B, dark deep, palette in `--ink-*`, `--azure`, `--cyan`, `--teal`, `--mint`, typography Inter Variable + JetBrains Mono). All new components are styled against the tokens exposed by the cinematic SCSS design system.

Editorial tone on the commercial surfaces: direct, confident, service-oriented. Copywriting is drafted at implementation time and validated by Andrés.

## Information architecture

### Route map

All routes are path-prefixed by language. `/` redirects to `/fr`.

| Component              | FR route                    | EN route                    |
| ---------------------- | --------------------------- | --------------------------- |
| Home                   | `/fr`                       | `/en`                       |
| Services hub           | `/fr/services`              | `/en/services`              |
| Service page (dynamic) | `/fr/services/{slug-fr}`    | `/en/services/{slug-en}`    |
| Réalisations           | `/fr/realisations`          | `/en/projects`              |
| CV                     | `/fr/cv`                    | `/en/resume`                |
| Mentions légales       | `/fr/mentions-legales`      | `/en/legal`                 |
| Confidentialité        | `/fr/confidentialite`       | `/en/privacy`               |

Service slugs:

| # | FR                         | EN                          |
| - | -------------------------- | --------------------------- |
| 1 | `consultant-dotnet-azure`  | `dotnet-azure-consulting`   |
| 2 | `techlead`                 | `tech-lead`                 |
| 3 | `formateur`                | `trainer`                   |
| 4 | `vibe-coding`              | `vibe-coding`               |
| 5 | `applications-mobiles`     | `mobile-apps`               |
| 6 | `sites-internet`           | `websites`                  |

### Legacy redirects

Old URLs must redirect (301) to the new localized equivalents:

| Legacy                    | Target                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| `/`                       | `/fr` (or `/en` via `Accept-Language` later — v1 is always `/fr`)  |
| `/andres-talavera-resume` | `/fr/cv`                                                           |
| `/privacy`                | `/fr/confidentialite`                                              |
| `/legal`                  | `/fr/mentions-legales`                                             |
| Any URL with `?culture=fr`| Equivalent FR-prefixed URL                                         |
| Any URL with `?culture=en`| Equivalent EN-prefixed URL                                         |

Implementation preferred: `staticwebapp.config.json` route rules (Azure Static Web Apps). Fallback: a small `LegacyRedirect.razor` component wired in `App.razor`'s `NotFound` branch that maps known legacy paths and calls `NavigationManager.NavigateTo(replacement, replaceHistoryEntry: true)`.

### Navigation (all pages, via `MainLayout`)

- **Left**: logo `IdeaStud.io` → home in current language.
- **Center-left**: `Services` · `Réalisations` (or `Projects`) · `CV` (or `Resume`) — labels from i18n.
- **Right**: FR/EN selector + CTA button `Réserver 30 min →` (Calendly external link, `target="_blank" rel="noopener"`).

The FR/EN selector calls `CultureService.SwitchTo(other)`, which looks up the equivalent route via `LocalizedRoute` and navigates.

### Footer (all pages)

Four blocks:

1. **Services** — six links to service pages.
2. **Liens** — Home, Réalisations, CV (+ two PDF download buttons FR/EN).
3. **Me suivre** — LinkedIn, GitHub, email `mailto:`.
4. **Légal** — Mentions légales, Confidentialité, © IdeaStud.io.

### Page composition

Each page is a sequence of `ChapterSection` (cinematic component). Acts per page:

- **Home (`/{lang}`)**: 4 acts — Commercial hero, Services grid, Réalisations teaser, CTA Calendly.
- **Service page**: 4 acts — Service hero, Highlights, UseCases + FAQ, CTA Calendly.
- **Services hub**: 3 acts — Hub hero, Services grid, CTA Calendly.
- **Réalisations**: 2 acts — Filters + Grid, CTA Calendly.
- **CV**: 5 acts — Hero (name + PDF buttons), About, Experiences (pinned horizontal from cinematic), Training, CTA Calendly (replaces the legacy `ContactSection` that is removed).
- **Legal / Privacy**: plain layout, no CTA section.

## URL internationalization

### Language detection

`CultureService` is rewritten to read the current culture from the **first path segment** (`/fr/...` → `fr`, `/en/...` → `en`). Query param `?culture=` is no longer authoritative; when present on a legacy URL it triggers a redirect to the prefixed equivalent.

Order of detection on first load:

1. First path segment if `fr` or `en`.
2. Otherwise redirect `/` to `/fr`.

No cookie/localStorage persistence in v1 (the URL itself is the source of truth).

### Route registration

Each page component declares one `@page` per language, both routed to the same component. Examples:

```razor
@* Pages/Cv.razor *@
@page "/fr/cv"
@page "/en/resume"

@* Pages/Realisations.razor *@
@page "/fr/realisations"
@page "/en/projects"

@* Pages/Services/ServicePage.razor *@
@page "/fr/services/{slug}"
@page "/en/services/{slug}"
```

For service pages, the `{slug}` parameter is resolved against `Service.Slug` in the JSON of the current culture; if no match, the component redirects to the localized services hub.

### Localized route helper

A small static service provides the translated route for a known page id:

```csharp
public interface ILocalizedRoute
{
    string For(string pageId, string? cultureName = null);
    string Translate(string currentPath, string targetCulture);
    string? MatchPageId(string path); // returns pageId or null
}
```

`pageId` values: `"home"`, `"services.hub"`, `"services.page"` (+ slug), `"realisations"`, `"cv"`, `"legal"`, `"privacy"`.

The route table lives in a single static dictionary (not i18n JSON) to keep build-time constants and make refactoring obvious:

```csharp
private static readonly IReadOnlyDictionary<(string PageId, string Culture), string> Routes = new Dictionary<...>
{
    [("home", "fr")] = "/fr",
    [("home", "en")] = "/en",
    [("cv", "fr")] = "/fr/cv",
    [("cv", "en")] = "/en/resume",
    // ...
};
```

Language switch: `Translate(currentPath, targetCulture)` matches the current path via `MatchPageId`, extracts dynamic segments (e.g. service slug), resolves the target slug from the JSON of the target culture, and returns the new path.

### Internal linking

All internal links use `ILocalizedRoute.For(pageId)` rather than literal paths, including `MainLayout` nav, footer links, `Home.razor` CTAs, and `RealisationsTeaser` ("See all") button. This is enforced by a test (grep-style) that no new `.razor`/`.cs` file contains hardcoded `/fr/` or `/en/` literals outside `ILocalizedRoute` implementation and `@page` directives.

## Data models

### `Models/Service.cs`

```csharp
public record Service(
    string Slug,
    string Title,
    string Kicker,
    string Tagline,
    string IconId,
    string Summary,
    IReadOnlyList<string> Highlights,
    IReadOnlyList<UseCase> UseCases,
    IReadOnlyList<FaqEntry> Faq,
    string? CtaLabel,
    int Order);

public record UseCase(string Title, string Description);
public record FaqEntry(string Question, string Answer);
```

Storage: `wwwroot/data/services-fr.json` and `wwwroot/data/services-en.json`, each a JSON array of six `Service` entries. Slugs differ per language as per the table above. `IconId` is a string key (e.g. `"consulting"`, `"techlead"`, `"training"`, `"vibe"`, `"mobile"`, `"web"`) that maps to a custom SVG file under `wwwroot/images/icons/services/{id}.svg` — inlined at render time (not background-image) for color control and accessibility.

### `Models/Realisation.cs`

```csharp
public record Realisation(
    string Slug,
    string Title,
    string Client,
    string Summary,
    string ImageUrl,
    string ImageAlt,
    string LiveUrl,
    RealisationType Type,
    IReadOnlyList<string> Technologies,
    DateOnly CompletedOn,
    int DisplayOrder);

public enum RealisationType
{
    SiteVitrine,
    ApplicationWeb,
    ApplicationMobile,
    ApiBackend,
    Formation,
    Autre
}
```

Storage: `wwwroot/data/realisations-fr.json`, `wwwroot/data/realisations-en.json`. Tri effectif : `DisplayOrder` ascendant, puis `CompletedOn` descendant.

Initial dataset to seed at step 4 (confirmed content from Andrés):

- `monseigneurchampagne` — Monseigneur Champagne — `https://www.monseigneurchampagne.com`
- `coronaclubnobless` — Corona Club Noblesse — `https://www.coronaclubnobless.ch`
- `krosquare` — Krosquare — `https://www.krosquare.fr`
- `ideastudio` — IdeaStud.io (self) — `https://www.ideastud.io`

Client, summary, type, technologies, completion date, and screenshots are provided by Andrés at implementation time.

### Existing models — unchanged

`Resume`, `Experience`, `TrainingCenter`, `PersonalInformation`, `AboutSection`, `Extensions`, and all fields on `SchemaOrg` already in use. Only new records are added to `SchemaOrg` (see SEO below).

## i18n additions

New keys in `wwwroot/i18n/{fr,en}.json`. Route strings are NOT in i18n (they live in `LocalizedRoute`); only UI labels go here.

```text
Nav.Services, Nav.Realisations, Nav.Cv, Nav.BookCall
Home.HeroKicker, Home.HeroTitle, Home.HeroLead, Home.HeroCtaPrimary, Home.HeroCtaSecondary
Home.ServicesTitle, Home.ServicesLead
Home.RealisationsTitle, Home.RealisationsLead, Home.RealisationsSeeAll, Home.RealisationsSeeMore, Home.RealisationsSeeLess
Home.CtaTitle, Home.CtaLead, Home.CtaButton
Services.HubTitle, Services.HubLead
Service.HighlightsTitle, Service.UseCasesTitle, Service.FaqTitle, Service.ReadMore
Realisations.PageTitle, Realisations.PageLead
Realisations.FilterByTech, Realisations.FilterByType, Realisations.Clear, Realisations.ResultsCount, Realisations.NoResults
Realisations.TypeSiteVitrine, Realisations.TypeApplicationWeb, Realisations.TypeApplicationMobile, Realisations.TypeApiBackend, Realisations.TypeFormation, Realisations.TypeAutre
Cv.DownloadPdfFr, Cv.DownloadPdfEn, Cv.PdfSectionTitle
Footer.Services, Footer.Links, Footer.Follow, Footer.Legal, Footer.Copyright
NotFound.Title, NotFound.Lead, NotFound.BackHome
```

Text content for services (`Service.Summary`, `Highlights`, `UseCases`, `Faq`) lives in the JSON of each language, not in i18n.

## Components

### New components (`Components/`)

Home:

- `CommercialHero.razor` — kicker, display title, lead, two CTAs (Calendly primary + `#services` anchor secondary).
- `ServicesGrid.razor` — responsive grid of six `ServiceCard`.
- `ServiceCard.razor` — icon (inlined SVG), kicker, title, tagline, link to `/services/{slug}` in current culture.
- `RealisationsTeaser.razor` — three latest cards + inline "Voir plus" toggle (mimics current experience toggle pattern) + "Voir toutes mes réalisations" → `/realisations`.
- `RealisationCard.razor` — image (lazy), title, client, technology chips, external-link overlay.

Service page:

- `ServiceHero.razor` — kicker, title, tagline, CTA Calendly.
- `ServiceHighlights.razor` — list of bullets from `Service.Highlights`.
- `ServiceUseCases.razor` — cards rendered from `Service.UseCases`.
- `ServiceFaq.razor` — native `<details>/<summary>` accordion rendered from `Service.Faq`.

Réalisations page:

- `RealisationsFilters.razor` — two groups of chips (`<button aria-pressed>`) for technologies and types; multi-select; internal state `HashSet<string>` + `HashSet<RealisationType>`; result count and Clear button.
- `RealisationsGrid.razor` — filtered grid; empty state with a localized message and Clear button.

Commun:

- `CtaCalendlySection.razor` — full-width CTA (`ChapterSection`) reused at the bottom of Home, Service, Services hub, Réalisations, and CV.
- `PdfDownloadButton.razor` — parameters: `Language` (`"fr"|"en"`), `Label`, `FileName`. Renders `<a href download>` to the static PDF.
- `LegacyRedirect.razor` — invoked from `App.razor` NotFound branch to map legacy paths to their new equivalents (fallback when static-web-app routing rules don't catch a case).

### Refactored components

- `MainLayout.razor` — new nav structure, integrates Calendly CTA, uses `ILocalizedRoute` for all internal links, hooks `NavigationManager.LocationChanged` to notify `ICinemaEngine` of route changes.
- `FooterSection.razor` — four blocks per spec; uses `ILocalizedRoute` for links; hosts two `PdfDownloadButton` instances.
- `SocialNetworksComponent.razor` — kept, but scoped to footer only.
- `CultureSelector.razor` — calls `CultureService.SwitchTo(other)`, which computes the target path via `ILocalizedRoute.Translate` and navigates.
- `CultureService` (implementation) — reads culture from URL path first segment; `SwitchTo(culture)` navigates to the translated equivalent of the current path.

### Removed components

- `ContactSection.razor` — superseded by `CtaCalendlySection` (primary CTA) + footer contact block.

### Components imported from cinematic spec (not redefined here)

- `ChapterSection.razor` — used as wrapper for every act on every page.
- `CinemaStage.razor` — mounted in `MainLayout`.
- `MotionReveal.razor` — used where punctual reveals are desired (e.g. service highlights, réalisation grid enter).
- `TechConstellation.razor` — used on `/cv` only (not on the commercial home, because the home's subject is services, not tech expertise).

### Pages

- `Pages/Home.razor` — `@page "/fr"`, `@page "/en"`.
- `Pages/Cv.razor` — `@page "/fr/cv"`, `@page "/en/resume"`. Content migrated from the existing `Pages/Index.razor`.
- `Pages/Services/ServicesHub.razor` — `@page "/fr/services"`, `@page "/en/services"`.
- `Pages/Services/ServicePage.razor` — `@page "/fr/services/{slug}"`, `@page "/en/services/{slug}"`. Single component resolves the `Service` via `(culture, slug)`; unknown slug redirects to services hub in current culture.
- `Pages/Realisations.razor` — `@page "/fr/realisations"`, `@page "/en/projects"`.
- `Pages/Legal.razor` — `@page "/fr/mentions-legales"`, `@page "/en/legal"`.
- `Pages/Privacy.razor` — `@page "/fr/confidentialite"`, `@page "/en/privacy"`.
- The old `Pages/Index.razor` is deleted; root redirect is handled by `staticwebapp.config.json` (or `LegacyRedirect.razor` fallback).

## Behaviors

### CV PDF download

- Two static files ship in `wwwroot/`: `cv-andres-talavera-fr.pdf` and `cv-andres-talavera-en.pdf`.
- `PdfDownloadButton` renders `<a href="/cv-andres-talavera-{lang}.pdf" download>` with a localized label.
- Both buttons appear (a) in a dedicated block after the CV hero on `/cv` and (b) in the footer on every page.
- The *content* of each PDF is language-fixed (the FR PDF is always the French CV, regardless of the site's active culture); only the *label* adapts. Both buttons are always visible — visitors can grab either language from either site culture.
- PDF maintenance is manual and external to the site build.

### Réalisations "See more" on home

- Three cards visible by default, sorted per `Realisation` sort rules.
- A "Voir plus" button reveals the remaining home-visible cards (e.g. up to six — cap locked at implementation; if the JSON has more than six, the extras are only on `/realisations`).
- A distinct "Voir toutes mes réalisations →" CTA navigates to the localized Réalisations page.

### Filters on `/realisations`

- Two filter groups: **Technologies** (set of strings derived from the union of all `Realisation.Technologies` in the current-culture JSON) and **Types** (enum `RealisationType`).
- Multi-select within each group (OR), AND between groups.
- State held in component-local fields (`HashSet<string>`, `HashSet<RealisationType>`).
- Clicking an active chip deselects it.
- A "Clear filters" button appears when any filter is active.
- Results count updates live.
- Empty state shown when no result matches; displays localized message and a Clear button.
- No URL persistence of filters in v1.

### Calendly CTA

- Link: `https://calendly.com/andres-talavera/30min`.
- Rendered as `<a target="_blank" rel="noopener">` with `aria-label` indicating an external popup.

### Inter-page navigation

- Blazor client-side routing; the `CinemaStage` canvas persists across navigations.
- `MainLayout` subscribes to `NavigationManager.LocationChanged` and calls a new method on the cinematic engine (`ICinemaEngine.OnRouteChangedAsync(string path)`) so the cinematic session can implement scene transitions on its side. Default behaviour (if not implemented yet by the cinematic session): no-op.

### 404

- `App.razor`'s `NotFound` template invokes `LegacyRedirect.razor`: if the path is a known legacy, navigate to the mapped replacement with `replaceHistoryEntry: true`. Otherwise render a minimal 404 block (localized title, lead, back-to-home link) in the current culture (detected from URL prefix if present, else fallback `fr`).

### Service page slug miss

- If `ServicePage` receives a `{slug}` not present in the current-culture services JSON, redirect to `/fr/services` or `/en/services` with `replaceHistoryEntry: true`.

## SEO

### Per-page metadata (via `SeoHead`)

Each page passes its own `Title`, `Description`, `CanonicalUrl`, `OgImage`, `Locale`, `HreflangUrls` (both language equivalents + `x-default` pointing to FR home), and `StructuredData`.

FR baseline titles (EN equivalents produced at implementation):

- `/fr` — `Andrés Talavera — Consultant .NET & Azure, Techlead, Formateur | IdeaStud.io`
- `/fr/services` — `Services — Conseil, techlead, formation, apps et sites | IdeaStud.io`
- `/fr/services/{slug-fr}` — `{Service.Title} — Andrés Talavera | IdeaStud.io`
- `/fr/realisations` — `Réalisations — Projets .NET, Azure, web | IdeaStud.io`
- `/fr/cv` — current home title kept, moved to this page.

Description strings derived from each page's lead text or (for services) `Service.Tagline`.

### Structured data

New records added to `Models/SchemaOrg.cs`:

- `ProfessionalService` (for the home) — provider = `Person` record already produced, `areaServed` = `"Lyon, France"`, `hasOfferCatalog` pointing to the six `Service` entries.
- `Service` (for each service page) — `provider`, `name`, `description`, `areaServed`.
- `CollectionPage` (for `/realisations`) — list of `CreativeWork` items (one per `Realisation`).
- `CreativeWork` — optional, per `Realisation`.

Emitted JSON-LD per page:

- Home: `Person` + `WebSite` + `BreadcrumbList` + `ProfessionalService`.
- Service page: `Service` + `BreadcrumbList`.
- Services hub: `BreadcrumbList` + list of `Service`.
- Réalisations: `CollectionPage` + `BreadcrumbList`.
- CV: `Person` complete (current behaviour) + `BreadcrumbList`.

### `sitemap.xml`

Static file regenerated manually. Every page has two URLs (FR + EN) with `xhtml:link rel="alternate" hreflang="fr|en|x-default"`. Full list: home, services hub, six services, réalisations, cv, legal, privacy, times two = 22 URLs.

### `robots.txt`, `llms.txt`, `ai.txt`

- `robots.txt` — sitemap pointer kept.
- `llms.txt` — updated with sections "Services" (six entries with short description) and "Réalisations" (current list with live URLs).
- `ai.txt` — minor reference update.

## Accessibility

- Each page has exactly one `<h1>` in its hero; acts use `<h2>`; subsections use `<h3>`.
- Filter chips are `<button>` with `aria-pressed`; groups wrapped in `<fieldset><legend>`.
- FAQ uses native `<details>/<summary>`; no custom keyboard handling needed.
- Calendly link carries `aria-label` that mentions "ouvre un nouvel onglet" (or "opens a new tab").
- Réalisation cards are `<article>` elements; images require non-empty `alt` (the `Realisation.ImageAlt` field is validated at load — a component-level log warning fires if empty).
- Language switcher exposes `aria-label="Change language / Changer de langue"` and both current and target languages.
- `prefers-reduced-motion` and WebGL fallbacks are handled entirely by the cinematic engine; no additional work here.
- Focus states and skip-link inherited from the cinematic design system.

## Testing

Extended in `IdeaStudio.Website.Tests`:

- **Routing** — each new route renders without exception; legacy paths (`/`, `/andres-talavera-resume`, `/privacy`, `/legal`, `?culture=…`) route or redirect to the expected localized path.
- **Localized routes** — for every page id, `ILocalizedRoute.For(pageId, culture)` returns the expected path in both cultures. `Translate(currentPath, targetCulture)` returns a valid path. Round-trip: `MatchPageId(For(id))` returns `id`.
- **Services** — `ServicePage` for every known FR and EN slug renders the associated title; an unknown slug routes to the correct language's services hub.
- **Home** — presence of six service cards, three réalisation cards, Calendly CTA pointing to `https://calendly.com/andres-talavera/30min`.
- **Réalisations** — applying a technology filter reduces the grid; applying a type filter reduces it; combined filters apply AND between groups; the Clear button resets to all.
- **PDF download** — both PDF buttons render on `/cv` and in the footer; `href` matches `/cv-andres-talavera-fr.pdf` or `/cv-andres-talavera-en.pdf`.
- **i18n** — every new i18n key used in a component exists in `fr.json` and `en.json` (parameterized test that scans components for `GetString("...")` and checks both files).
- **SEO** — each page produces non-empty `Title` and `Description` in both languages, and at least one JSON-LD block.
- **No hardcoded paths** — a test greps `/Pages` and `/Components` for string literals matching `/fr/` or `/en/` and fails if any appear outside `ILocalizedRoute` implementation and `@page` directives.

No visual regression tests (consistent with the cinematic spec).

## Migration plan

Eight steps, each independently mergeable. Between steps the site remains functional.

### Step 0 — URL i18n foundation

- Rewrite `CultureService` to read culture from URL path segment.
- Add `ILocalizedRoute` + implementation + static route table.
- Update `CultureSelector` to compute the translated path and navigate.
- Add `staticwebapp.config.json` redirect rules (or `LegacyRedirect.razor`) for legacy URLs.
- Update every existing internal link (including `Privacy`, `Legal`, current `Index.razor`) to use `ILocalizedRoute`.
- Rename `Privacy` and `Legal` routes to `/{lang}/confidentialite` and `/{lang}/mentions-legales`.
- The site still shows the CV at what is now `/fr/cv` (and `/en/resume`); the home is still the CV.

Fully shippable: visitors land on `/fr/cv` by default; old links redirect; switching language works.

### Step 1 — Data models + JSON scaffolding

- Add `Models/Service.cs`, `Models/Realisation.cs` (+ records, enum).
- Add `services-{fr,en}.json` and `realisations-{fr,en}.json` with placeholder entries.
- No UI change yet.

### Step 2 — Split `Index` into `Home` + `Cv`

- Create `Pages/Home.razor` (`@page "/fr"`, `@page "/en"`) as a placeholder "Bientôt" screen in cinematic chapter frame.
- Create `Pages/Cv.razor` (`@page "/fr/cv"`, `@page "/en/resume"`) containing the full current `Index.razor` content.
- Delete `Pages/Index.razor`.
- Root `/` and all legacy aliases redirect (already set up in step 0, update the targets).

After this step the home is a placeholder, the CV is at its final URL, nav still points to both.

### Step 3 — Nav, footer, PDF

- Refactor `MainLayout` per spec (logo, three nav items, language selector, Calendly CTA).
- Refactor `FooterSection` into four blocks.
- Add `PdfDownloadButton`.
- Place both buttons on `/cv` and in the footer (drop the two static PDFs into `wwwroot/`).
- Add all `Nav.*`, `Footer.*`, `Cv.DownloadPdf*` i18n keys.

### Step 4 — Commercial home

- Implement `CommercialHero`, `ServicesGrid`, `ServiceCard`, `RealisationsTeaser`, `RealisationCard`, `CtaCalendlySection`.
- Populate `services-{fr,en}.json` with the six services — at minimum `Slug`, `Title`, `Kicker`, `Tagline`, `IconId`, `Order`. `Summary`, `Highlights`, `UseCases`, `Faq` may still be placeholders at this step.
- Populate `realisations-{fr,en}.json` with the four initial entries (Monseigneur Champagne, Corona Club Noblesse, Krosquare, IdeaStud.io). Screenshots and full data provided by Andrés.
- Add the custom SVG icons for the six services under `wwwroot/images/icons/services/`.
- Wire `Home.razor` to compose the four acts.

After this step, `/` is the new commercial home, but service cards link to pages that don't exist yet (temporary 404 for `/fr/services/{slug}`).

### Step 5 — Services pages

- Implement `ServicePage`, `ServicesHub`, `ServiceHero`, `ServiceHighlights`, `ServiceUseCases`, `ServiceFaq`.
- Complete `services-{fr,en}.json` with real `Summary`, `Highlights`, `UseCases`, `Faq` for every service in both languages (copywriting validated by Andrés).
- Unknown-slug redirect to localized hub.

### Step 6 — Réalisations full page

- Implement `Pages/Realisations.razor`, `RealisationsGrid`, `RealisationsFilters`.
- Confirm the four initial réalisations are complete (client, summary, type, technologies, date, screenshot).
- The "Voir toutes mes réalisations" link on the home begins to land on a real page.

### Step 7 — SEO, structured data, sitemap, tests

- Extend `Models/SchemaOrg.cs` with `ProfessionalService`, `Service`, `CollectionPage`, `CreativeWork`.
- Wire per-page `SeoHead` with proper metadata and structured data for every new page.
- Regenerate `sitemap.xml` to include all 22 URLs with `hreflang`.
- Update `llms.txt` and `ai.txt`.
- Add every test from the Testing section.
- Manual regression pass: Lighthouse on the main pages, keyboard navigation across filters and menus, FR/EN switch on each page.

## Coordination with the cinematic spec

Running in parallel (decision B in brainstorming). Assumptions this spec makes:

1. Steps 0-2 do not depend on cinematic. They touch routing, data, and page boundaries only.
2. From step 3 onward, this spec **consumes** cinematic components: `ChapterSection`, `CinemaStage`, `MotionReveal`, `TechConstellation`, design-system SCSS tokens and classes. If a cinematic component is not yet available when a step needs it, a minimal stub is provided in this spec's code (semantic `<section>`, no animation) that the cinematic session replaces later without consumer-side changes.
3. The cinematic spec currently assumes a single page (`Index.razor`) with five acts on `/`. Now that `/` is the new commercial home and `/cv` is the CV, the cinematic session must treat the five-act narrative as applying to `/cv` (not `/`) and handle additional pages (`/`, `/services/{slug}`, `/realisations`, `/services` hub) as independent narratives using the same building blocks.
4. `TechConstellation` moves from the former home hero to the `/cv` hero.
5. `ICinemaEngine` is expected to gain an `OnRouteChangedAsync(string path)` hook that `MainLayout` calls on `NavigationManager.LocationChanged`. Default implementation may be a no-op.

Action on spec approval: notify the cinematic session to rebase their work on the new route model and the new home/CV split before they invest effort in the old single-page structure.

## Deferred decisions (resolved at implementation)

- **Custom SVG icon design** for the six services (icon primitives, stroke weight). Produced at step 4.
- **Exact copywriting** for service summaries, highlights, use cases, FAQ in both languages. First drafts proposed at step 5, validated by Andrés.
- **Screenshots and full metadata** for the four initial réalisations. Gathered at step 4.
- **Cinematic treatment** of each new page (scroll orchestration, reveals, stage transitions). Handled entirely by the cinematic session following approval of this spec.
- **`Accept-Language` based root redirect**. v1 always redirects `/` to `/fr`. If metrics later justify auto-detection, add it as a separate iteration.
- **Filter URL persistence** on `/realisations`. Out of scope; can be added later without refactoring (local state → query string).
- **Analytics / Calendly click tracking**. Out of scope.

## Appendix — resources provided

- Calendly link: `https://calendly.com/andres-talavera/30min`
- Initial réalisations:
  - `https://www.monseigneurchampagne.com`
  - `https://www.coronaclubnobless.ch`
  - `https://www.krosquare.fr`
  - `https://www.ideastud.io`
- Cinematic parallel spec: `docs/superpowers/specs/2026-04-22-cinematic-redesign-design.md`
