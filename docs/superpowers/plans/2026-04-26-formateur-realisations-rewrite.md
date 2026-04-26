# Formateur + Realisations Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Brasa Geneva to the realisations, rename Krosquare → K-RO SQUARE, recalibrate `completedOn` dates to match real chronology, enrich the `services/formateur` page with shared TeachList + invitation to compose programs from official modules, clarify the CV "J'apprends, j'enseigne" block, and rewrite two transverse `ServiceDetail` kicker/title pairs that affect every service fiche.

**Architecture:** Pure content (JSON) + small Razor edits. No new models, no new services, no new routes. Reuses existing `TeachList.razor` component on the formateur page. Fixes a latent bug along the way: `ServiceDetail.razor` checks `service.Slug == "formateur"` to gate the trainings catalogue, but the EN slug is `"trainer"` — gated sections silently disappear in English.

**Tech Stack:** Blazor WebAssembly (.NET 10), JSON-backed content via `IContentGateway`, `LocalizedComponent` base class for i18n, xUnit for tests, esbuild + sass via `npm run build` (auto-triggered by `dotnet build`).

**Spec:** `docs/superpowers/specs/2026-04-26-formateur-realisations-rewrite-design.md`

---

## File map

**Modify:**
- `IdeaStudio.Website/wwwroot/data/realisations-fr.json` — add Brasa, rename, recalibrate, switch to PNG urls, rewrite summaries
- `IdeaStudio.Website/wwwroot/data/realisations-en.json` — mirror EN
- `IdeaStudio.Website/wwwroot/data/services-fr.json` — rewrite the `formateur` entry (summary, highlights, useCases, faq)
- `IdeaStudio.Website/wwwroot/data/services-en.json` — rewrite the `trainer` entry
- `IdeaStudio.Website/Pages/Home.razor` — point "Voir toutes les formations" to formateur
- `IdeaStudio.Website/Pages/Cv.razor` — retitle "Là où j'ai enseigné." + intro paragraph
- `IdeaStudio.Website/Pages/ServiceDetail.razor` — kicker/title rewrites (transverse), TeachList section (formateur only), fix slug-check bug

**Add to git:**
- `IdeaStudio.Website/wwwroot/images/www.brasageneva.ch.png` (already on disk, untracked)
- `IdeaStudio.Website/wwwroot/images/www.coronaclubnobless.ch.png`
- `IdeaStudio.Website/wwwroot/images/www.ideastud.io.png`
- `IdeaStudio.Website/wwwroot/images/www.krosquare.fr.png`

**Don't touch:** `wwwroot/data/resume-{fr,en}.json`, `wwwroot/data/training-centers-{fr,en}.json`, `wwwroot/data/trainings-{fr,en}.json`, `Components/TeachList.razor`, `Models/TrainingCenter.cs`, `Services/LocalizedRoute.cs`.

---

## Task 1: Stage the new realisation screenshots

**Files:**
- Stage: `IdeaStudio.Website/wwwroot/images/www.brasageneva.ch.png`
- Stage: `IdeaStudio.Website/wwwroot/images/www.coronaclubnobless.ch.png`
- Stage: `IdeaStudio.Website/wwwroot/images/www.ideastud.io.png`
- Stage: `IdeaStudio.Website/wwwroot/images/www.krosquare.fr.png`

- [ ] **Step 1: Verify the four PNGs exist on disk**

```bash
ls -lh IdeaStudio.Website/wwwroot/images/www.*.png
```

Expected: four PNG files listed (brasageneva.ch, coronaclubnobless.ch, ideastud.io, krosquare.fr). If any is missing, stop and ask the user to provide it.

- [ ] **Step 2: Stage and commit the images**

```bash
git add IdeaStudio.Website/wwwroot/images/www.brasageneva.ch.png \
        IdeaStudio.Website/wwwroot/images/www.coronaclubnobless.ch.png \
        IdeaStudio.Website/wwwroot/images/www.ideastud.io.png \
        IdeaStudio.Website/wwwroot/images/www.krosquare.fr.png

git commit -m "$(cat <<'EOF'
chore(images): add www.* realisation screenshots

Live-site screenshots used by the upcoming realisations refresh.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds, four files added.

---

## Task 2: Rewrite `realisations-fr.json`

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/data/realisations-fr.json` (full overwrite)

- [ ] **Step 1: Replace the file with the new content**

```json
[
  {
    "slug": "brasageneva",
    "title": "Brasa Geneva",
    "client": "Brasa Geneva",
    "summary": "Site vitrine d'un club de cigares genevois — identité feutrée, parcours membre, version suisse de l'esprit Corona Club.",
    "imageUrl": "images/www.brasageneva.ch.png",
    "imageAlt": "Capture d'écran du site Brasa Geneva",
    "liveUrl": "https://www.brasageneva.ch",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Netlify"],
    "completedOn": "2026-04-01",
    "displayOrder": 1
  },
  {
    "slug": "ideastudio",
    "title": "IdeaStud.io",
    "client": "Projet personnel",
    "summary": "Le site que vous lisez : portfolio éditorial, fiches de services, blog technique. Blazor WASM AOT, design system maison, design tokens partagés entre SCSS et runtime JS.",
    "imageUrl": "images/www.ideastud.io.png",
    "imageAlt": "Capture d'écran du site IdeaStud.io",
    "liveUrl": "https://www.ideastud.io",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Azure", "Markdig"],
    "completedOn": "2026-02-01",
    "displayOrder": 2
  },
  {
    "slug": "coronaclubnobless",
    "title": "Corona Club Noblesse",
    "client": "Corona Club Noblesse",
    "summary": "Site institutionnel d'un club suisse — rendu élégant, navigation tri-langue, mise en valeur d'une identité héritée.",
    "imageUrl": "images/www.coronaclubnobless.ch.png",
    "imageAlt": "Capture d'écran du site Corona Club Noblesse",
    "liveUrl": "https://www.coronaclubnobless.ch",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor"],
    "completedOn": "2025-12-01",
    "displayOrder": 3
  },
  {
    "slug": "krosquare",
    "title": "K-RO SQUARE",
    "client": "K-RO SQUARE",
    "summary": "Site vitrine et présentation d'offre pour une marque française — direction artistique épurée, mise en scène claire de l'identité.",
    "imageUrl": "images/www.krosquare.fr.png",
    "imageAlt": "Capture d'écran du site K-RO SQUARE",
    "liveUrl": "https://www.krosquare.fr",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Azure"],
    "completedOn": "2025-10-01",
    "displayOrder": 4
  },
  {
    "slug": "monseigneurchampagne",
    "title": "Monseigneur Champagne",
    "client": "Monseigneur Champagne",
    "summary": "Vitrine d'une maison de champagne — identité premium, parcours client soigné jusqu'à la prise de contact.",
    "imageUrl": "images/realisations/monseigneur-champagne.svg",
    "imageAlt": "Capture d'écran du site Monseigneur Champagne",
    "liveUrl": "https://www.monseigneurchampagne.com",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Azure"],
    "completedOn": "2025-08-01",
    "displayOrder": 5
  }
]
```

- [ ] **Step 2: Verify JSON is well-formed**

```bash
python3 -m json.tool IdeaStudio.Website/wwwroot/data/realisations-fr.json > /dev/null && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website/wwwroot/data/realisations-fr.json
git commit -m "$(cat <<'EOF'
content(realisations-fr): add Brasa Geneva, rename K-RO SQUARE, recalibrate dates

Brasa Geneva ships in displayOrder 1 (most recent), Krosquare displayed as
K-RO SQUARE (slug preserved for URL/SEO stability), completedOn dates recast
chronologically (MonSeigneur oldest, Brasa newest). Summaries rewritten in
the editorial tone of resume-fr.json. Image URLs now point to the live-site
PNG screenshots, except MonSeigneur which keeps its SVG illustration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 3: Rewrite `realisations-en.json`

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/data/realisations-en.json` (full overwrite)

- [ ] **Step 1: Replace the file with the EN mirror**

```json
[
  {
    "slug": "brasageneva",
    "title": "Brasa Geneva",
    "client": "Brasa Geneva",
    "summary": "Showcase site for a Geneva-based cigar club — hushed identity, member journey, Swiss take on the Corona Club spirit.",
    "imageUrl": "images/www.brasageneva.ch.png",
    "imageAlt": "Screenshot of the Brasa Geneva website",
    "liveUrl": "https://www.brasageneva.ch",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Netlify"],
    "completedOn": "2026-04-01",
    "displayOrder": 1
  },
  {
    "slug": "ideastudio",
    "title": "IdeaStud.io",
    "client": "Personal project",
    "summary": "The site you're reading: editorial portfolio, service fiches, technical blog. Blazor WASM AOT, in-house design system, design tokens shared between SCSS and the JS runtime.",
    "imageUrl": "images/www.ideastud.io.png",
    "imageAlt": "Screenshot of the IdeaStud.io website",
    "liveUrl": "https://www.ideastud.io",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Azure", "Markdig"],
    "completedOn": "2026-02-01",
    "displayOrder": 2
  },
  {
    "slug": "coronaclubnobless",
    "title": "Corona Club Noblesse",
    "client": "Corona Club Noblesse",
    "summary": "Institutional site for a Swiss club — elegant rendering, tri-language navigation, inherited identity brought into focus.",
    "imageUrl": "images/www.coronaclubnobless.ch.png",
    "imageAlt": "Screenshot of the Corona Club Noblesse website",
    "liveUrl": "https://www.coronaclubnobless.ch",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor"],
    "completedOn": "2025-12-01",
    "displayOrder": 3
  },
  {
    "slug": "krosquare",
    "title": "K-RO SQUARE",
    "client": "K-RO SQUARE",
    "summary": "Showcase and offer-presentation site for a French brand — pared-back art direction, clear staging of the identity.",
    "imageUrl": "images/www.krosquare.fr.png",
    "imageAlt": "Screenshot of the K-RO SQUARE website",
    "liveUrl": "https://www.krosquare.fr",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Azure"],
    "completedOn": "2025-10-01",
    "displayOrder": 4
  },
  {
    "slug": "monseigneurchampagne",
    "title": "Monseigneur Champagne",
    "client": "Monseigneur Champagne",
    "summary": "Showcase site for a champagne house — premium identity, customer journey crafted all the way to first contact.",
    "imageUrl": "images/realisations/monseigneur-champagne.svg",
    "imageAlt": "Screenshot of the Monseigneur Champagne website",
    "liveUrl": "https://www.monseigneurchampagne.com",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Azure"],
    "completedOn": "2025-08-01",
    "displayOrder": 5
  }
]
```

- [ ] **Step 2: Verify JSON is well-formed**

```bash
python3 -m json.tool IdeaStudio.Website/wwwroot/data/realisations-en.json > /dev/null && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website/wwwroot/data/realisations-en.json
git commit -m "$(cat <<'EOF'
content(realisations-en): mirror FR refresh

Same five entries with the same chronology and image URLs as the FR file;
summaries translated in the same editorial tone.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 4: Home — point "Voir toutes les formations" to the formateur fiche

**Files:**
- Modify: `IdeaStudio.Website/Pages/Home.razor:92-93` (link href)
- Modify: `IdeaStudio.Website/Pages/Home.razor:114-141` (private fields + LoadTexts)

- [ ] **Step 1: Add the `trainerSlug` field**

In the `@code { }` block (after `private string allTrainings = "Voir toutes les formations";` at line 130), add:

```csharp
private string trainerSlug = "formateur";
```

- [ ] **Step 2: Set `trainerSlug` per culture in `LoadTexts()`**

After the line `allTrainings = fr ? "Voir toutes les formations" : "See all trainings";` (line 178), add:

```csharp
trainerSlug = fr ? "formateur" : "trainer";
```

- [ ] **Step 3: Update the link markup**

Replace lines 91-95:

```razor
        <p class="ds-chapter-gap" data-reveal>
            <a class="ds-link" href="@LocalizedRoute.For("cv")">
                @allTrainings <span class="ds-link__arrow" aria-hidden="true">→</span>
            </a>
        </p>
```

with:

```razor
        <p class="ds-chapter-gap" data-reveal>
            <a class="ds-link" href="@($"{LocalizedRoute.For("services.hub")}/{trainerSlug}")">
                @allTrainings <span class="ds-link__arrow" aria-hidden="true">→</span>
            </a>
        </p>
```

- [ ] **Step 4: Build the website to catch syntax errors**

```bash
dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: build succeeds (warnings OK, no errors).

- [ ] **Step 5: Commit**

```bash
git add IdeaStudio.Website/Pages/Home.razor
git commit -m "$(cat <<'EOF'
feat(home): link 'Voir toutes les formations' to formateur fiche

The home teaching block now leads to the trainer service page (which
hosts the catalogue) rather than the CV. Slug picked per culture
('formateur' in FR, 'trainer' in EN).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 5: CV — clarify "J'apprends, j'enseigne" → "Là où j'ai enseigné."

**Files:**
- Modify: `IdeaStudio.Website/Pages/Cv.razor:78-84` (markup — add intro paragraph)
- Modify: `IdeaStudio.Website/Pages/Cv.razor:126-174` (fields + LoadTexts)

- [ ] **Step 1: Add the `trainIntro` field**

After the line `private string contactTitle = "Parlons de votre projet.";` (line 141), add:

```csharp
private string trainIntro = "";
```

- [ ] **Step 2: Update `LoadTexts()` — retitle and set the intro**

Replace the line `trainTitle   = fr ? "J'apprends, j'enseigne."         : "I learn, I teach.";` (line 171) with:

```csharp
trainTitle   = fr ? "Là où j'ai enseigné."            : "Where I've taught.";
trainIntro   = fr
    ? "Centres de formation et écoles qui m'ont confié leurs sessions, en présentiel comme en distanciel. Trois décennies de stack Microsoft, transmises à des publics très variés — de l'étudiant Supinfo au développeur senior en reconversion cloud."
    : "Training centres and schools that have trusted me with their sessions, on-site and remote. Three decades of Microsoft stack, passed on to wildly different audiences — from Supinfo students to senior devs reskilling on cloud.";
```

- [ ] **Step 3: Add the intro paragraph in the markup**

Replace lines 79-83:

```razor
    <div class="ds-container">
        <ChapterBand Kicker="@chapterFour" Title="@trainTitle" />
        <div style="margin-block-start: 2.5rem;">
            <TeachList Centers="@trainingCenters" />
        </div>
    </div>
```

with:

```razor
    <div class="ds-container">
        <ChapterBand Kicker="@chapterFour" Title="@trainTitle" />
        <p class="ds-lead" data-reveal style="margin-block-start: 1.5rem;">@trainIntro</p>
        <div style="margin-block-start: 2rem;">
            <TeachList Centers="@trainingCenters" />
        </div>
    </div>
```

- [ ] **Step 4: Build**

```bash
dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add IdeaStudio.Website/Pages/Cv.razor
git commit -m "$(cat <<'EOF'
content(cv): retitle 'J'apprends, j'enseigne' → 'Là où j'ai enseigné'

The block actually lists training centres and schools where Andrés has
taught — the previous title implied a two-way 'I learn / I teach' split
that the data doesn't back up. New intro paragraph spells out the scope
in the editorial tone of resume-fr.json.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 6: ServiceDetail — transverse kicker/title rewrites

**Files:**
- Modify: `IdeaStudio.Website/Pages/ServiceDetail.razor:115-118` (private field defaults)
- Modify: `IdeaStudio.Website/Pages/ServiceDetail.razor:146-149` (LoadTexts assignments)

- [ ] **Step 1: Update the private field defaults**

Replace lines 115-118:

```csharp
    private string highlightsKicker = "Concrètement";
    private string highlightsTitle = "Ce que vous obtenez.";
    private string useCaseKicker = "Cas d'usage";
    private string useCaseTitle = "Où ça a fonctionné.";
```

with:

```csharp
    private string highlightsKicker = "Le périmètre";
    private string highlightsTitle = "Ce que la mission couvre.";
    private string useCaseKicker = "Cas d'usage";
    private string useCaseTitle = "Quand on m'appelle.";
```

- [ ] **Step 2: Update the LoadTexts assignments**

Replace lines 146-149:

```csharp
        highlightsKicker = fr ? "Concrètement" : "Concretely";
        highlightsTitle  = fr ? "Ce que vous obtenez." : "What you get.";
        useCaseKicker    = fr ? "Cas d'usage" : "Use cases";
        useCaseTitle     = fr ? "Où ça a fonctionné." : "Where it worked.";
```

with:

```csharp
        highlightsKicker = fr ? "Le périmètre" : "Scope";
        highlightsTitle  = fr ? "Ce que la mission couvre." : "What the engagement covers.";
        useCaseKicker    = fr ? "Cas d'usage" : "Use cases";
        useCaseTitle     = fr ? "Quand on m'appelle." : "When clients reach out.";
```

- [ ] **Step 3: Build**

```bash
dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add IdeaStudio.Website/Pages/ServiceDetail.razor
git commit -m "$(cat <<'EOF'
content(services): rewrite transverse kickers and titles

'Concrètement / Ce que vous obtenez.' was vague — replaced by 'Le
périmètre / Ce que la mission couvre.' which works for every service
fiche (consultant, techlead, formateur, etc.). 'Cas d'usage / Où ça a
fonctionné.' replaced by 'Cas d'usage / Quand on m'appelle.' — the
former read as too colloquial for an editorial portfolio.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 7: ServiceDetail — TeachList for formateur + fix slug-check bug

**Files:**
- Modify: `IdeaStudio.Website/Pages/ServiceDetail.razor:94-103` (markup: catalogue gate + new TeachList block)
- Modify: `IdeaStudio.Website/Pages/ServiceDetail.razor:106-126` (private fields)
- Modify: `IdeaStudio.Website/Pages/ServiceDetail.razor:142-157` (LoadTexts)
- Modify: `IdeaStudio.Website/Pages/ServiceDetail.razor:159-177` (LoadServiceAsync — load centers)
- Modify: `IdeaStudio.Website/Pages/ServiceDetail.razor:214` (GenerateStructuredData — fix slug check)

The existing condition `service.Slug == "formateur"` only matches in FR — in EN the slug is `"trainer"`, so the catalogue silently disappears. We add a small `IsTrainerService` helper and replace the three call sites.

- [ ] **Step 1: Add the `centers` field and the three new localized strings**

Just after `private IReadOnlyList<Training> trainings = Array.Empty<Training>();` (line 110), insert:

```csharp
    private IReadOnlyList<TrainingCenter> centers = Array.Empty<TrainingCenter>();
```

Just after `private string catalogueTitle = "20 modules pour vos équipes.";` (line 122), insert:

```csharp
    private string centersKicker = "Partenaires";
    private string centersTitle  = "Là où j'ai enseigné.";
    private string centersIntro  = "Centres de formation et écoles qui m'ont confié leurs sessions, en présentiel comme en distanciel.";
```

- [ ] **Step 2: Add the `IsTrainerService` helper**

At the bottom of the `@code { }` block, just after the closing brace of `GenerateStructuredData()` (around line 241), insert:

```csharp
    private static bool IsTrainerService(ServiceModel? svc) =>
        svc is not null && (svc.Slug is "formateur" or "trainer");
```

- [ ] **Step 3: Update `LoadTexts()` to set the new strings per culture**

Just after the existing `catalogueTitle = fr ? "20 modules pour vos équipes." : "20 modules for your teams.";` line (line 153), insert:

```csharp
        centersKicker = fr ? "Partenaires"          : "Partners";
        centersTitle  = fr ? "Là où j'ai enseigné." : "Where I've taught.";
        centersIntro  = fr
            ? "Centres de formation et écoles qui m'ont confié leurs sessions, en présentiel comme en distanciel."
            : "Training centres and schools that have trusted me with their sessions, on-site and remote.";
```

- [ ] **Step 4: Update `LoadServiceAsync()` to load the centers (and use the helper)**

Replace the block (lines 172-176):

```csharp
            if (service.Slug == "formateur")
            {
                trainings = await Content.GetTrainingsAsync(culture);
            }
```

with:

```csharp
            if (IsTrainerService(service))
            {
                trainings = await Content.GetTrainingsAsync(culture);
                centers   = await Content.GetTrainingCentersAsync(culture);
            }
```

- [ ] **Step 5: Insert the new "Centres partenaires" markup section before the catalogue**

In the `else` branch of the `@if (service is null)` block, between the FAQ section (closing `</section>` at line 92) and the `@* Training catalogue (formateur only) *@` comment (line 94), insert:

```razor
    @* Training centres (formateur only) — shared editorial block with the CV page *@
    @if (IsTrainerService(service) && centers.Count > 0)
    {
        <section class="ds-section ds-section--chapter ds-section--bordered">
            <div class="ds-container">
                <ChapterBand Kicker="@centersKicker" Title="@centersTitle" />
                <p class="ds-lead" data-reveal style="margin-block-start: 1.5rem;">@centersIntro</p>
                <div style="margin-block-start: 2rem;">
                    <TeachList Centers="@centers" />
                </div>
            </div>
        </section>
    }

```

- [ ] **Step 6: Update the catalogue gate to use the helper**

Replace line 95:

```razor
    @if (service.Slug == "formateur" && trainings is { Count: > 0 })
```

with:

```razor
    @if (IsTrainerService(service) && trainings is { Count: > 0 })
```

- [ ] **Step 7: Update `GenerateStructuredData()` to use the helper**

Replace line 214:

```csharp
            if (service.Slug == "formateur" && trainings is { Count: > 0 })
```

with:

```csharp
            if (IsTrainerService(service) && trainings is { Count: > 0 })
```

- [ ] **Step 8: Build**

```bash
dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: build succeeds.

- [ ] **Step 9: Commit**

```bash
git add IdeaStudio.Website/Pages/ServiceDetail.razor
git commit -m "$(cat <<'EOF'
feat(formateur): add 'Centres partenaires' block, fix EN slug gate

Trainer fiche now shares the same TeachList component as the CV page,
between Cas d'usage and FAQ, with a short editorial intro. Along the way,
fixes a latent bug where 'service.Slug == \"formateur\"' silently false-d
out in EN (slug is 'trainer'): introduces IsTrainerService(svc) and
applies it to the markup gate, the LoadServiceAsync fetch, and the
JSON-LD course generation. EN visitors finally see the catalogue.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 8: Rewrite the `formateur` entry in `services-fr.json`

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/data/services-fr.json` (the entry at index 2 — `slug: "formateur"`, lines 61-87)

The other six entries in this file are untouched.

- [ ] **Step 1: Replace the formateur entry**

Locate the JSON object whose `"slug"` is `"formateur"` (currently lines 61-87) and replace it entirely with:

```json
  {
    "slug": "formateur",
    "title": "Formateur",
    "kicker": "TRANSMISSION",
    "tagline": "Je forme vos équipes aux fondamentaux et aux pratiques avancées .NET, Azure et web moderne.",
    "iconId": "training",
    "summary": "Plus de 3 000 heures de formation à mon actif, sur deux décennies de stack Microsoft. Auprès de développeurs juniors comme de techleads en quête de recul, dans des écoles (Supinfo, NextFormation) ou de grands centres (ORSYS, IP-Formation, Happly), en présentiel, classe virtuelle ou intra sur-mesure. Vingt modules au catalogue ci-dessous — à prendre tels quels, ou à recomposer ensemble pour bâtir le programme qui colle à votre équipe.",
    "highlights": [
      "ASP.NET Core 10, Blazor 10 (Server, WASM, Hybrid), Entity Framework Core",
      "Azure plateforme et préparation aux examens AZ-204 (développeur) et AZ-400 (DevOps)",
      "Architecture logicielle pragmatique — Clean Architecture, CQRS, event-driven, DDD-lite",
      "Tests automatisés, TDD, snapshot et tests de mutation",
      "DevOps et CI/CD — GitHub Actions, Azure Pipelines, IaC Bicep / Terraform",
      "Vibe coding & IA en équipe — Claude Code, GitHub Copilot, MCP, modèles open-weight en local",
      "Programmes sur-mesure assemblés à partir de plusieurs modules officiels"
    ],
    "useCases": [
      {
        "title": "Inter-entreprise · 3 jours",
        "description": "Sessions catalogue dispensées chez ORSYS, IP-Formation ou en classe virtuelle. Inscriptions individuelles, groupe mixte d'apprenants — Blazor, Azure DevOps, Clean Architecture, AZ-204."
      },
      {
        "title": "Intra sur-mesure",
        "description": "Programme calibré avec vous : audit de besoins préalable, choix des modules, profondeur et exemples adaptés à votre code base."
      },
      {
        "title": "Programme à la carte",
        "description": "Vous partez d'un module officiel comme socle (par exemple AZ-204), on le complète avec deux ou trois modules connexes pour couvrir précisément le périmètre de votre équipe — ni trop court, ni trop long."
      }
    ],
    "faq": [
      { "question": "Quel est votre TJM en formation ?", "answer": "800 € par jour, ou forfait inter / intra selon le format. Devis chiffré sous 24 h à partir d'un brief court." },
      { "question": "Formez-vous à distance ?", "answer": "Oui — classe virtuelle synchrone, exercices en binôme, démos en partage d'écran, retours en direct. La même rigueur qu'en présentiel." },
      { "question": "Êtes-vous certifié ?", "answer": "Microsoft Certified Trainer (MCT) actif, et plusieurs certifications Azure (AZ-204, AZ-400 entre autres). Mes modules de préparation aux examens reposent sur ce vécu." },
      { "question": "Comment construire un programme sur-mesure ?", "answer": "On part d'un module catalogue qui couvre le cœur de votre besoin, on identifie ce qui manque et ce qui est superflu, on emprunte des chapitres aux modules connexes, on cale la durée. Le brief tient en un appel de 30 minutes." },
      { "question": "Quels dispositifs de financement ?", "answer": "Les centres partenaires (ORSYS, IP-Formation, NextFormation) sont Qualiopi : OPCO, CPF entreprise, plan de développement des compétences. En intra direct, je vous oriente vers le dispositif adapté." }
    ],
    "ctaLabel": null,
    "order": 3
  },
```

(Keep the trailing comma — there are entries after this one in the array.)

- [ ] **Step 2: Verify JSON is well-formed**

```bash
python3 -m json.tool IdeaStudio.Website/wwwroot/data/services-fr.json > /dev/null && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Sanity check — make sure the other six entries are untouched**

```bash
python3 -c "import json; data=json.load(open('IdeaStudio.Website/wwwroot/data/services-fr.json')); print(len(data), 'entries:', [s['slug'] for s in data])"
```

Expected: `7 entries: ['consultant-dotnet-azure', 'techlead', 'formateur', 'vibe-coding', 'ia-en-entreprise', 'applications-mobiles', 'sites-internet']`.

- [ ] **Step 4: Commit**

```bash
git add IdeaStudio.Website/wwwroot/data/services-fr.json
git commit -m "$(cat <<'EOF'
content(services-fr/formateur): enrich summary, highlights, useCases, FAQ

Summary now name-checks the centres and audiences and invites teams to
recompose modules into a custom program. Highlights tightened around
concrete tech (ASP.NET Core 10, Blazor 10, Bicep/Terraform, MCP, etc.)
plus an explicit 'programme sur-mesure' line. UseCases gain a third
entry — 'Programme à la carte' — and the FAQ adds two questions
(building a custom program, Qualiopi/OPCO funding).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 9: Rewrite the `trainer` entry in `services-en.json`

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/data/services-en.json` (the entry at index 2 — `slug: "trainer"`, lines 55-81)

The other six entries are untouched.

- [ ] **Step 1: Replace the trainer entry**

Locate the JSON object whose `"slug"` is `"trainer"` (currently lines 55-81) and replace it entirely with:

```json
  {
    "slug": "trainer",
    "title": "Trainer",
    "kicker": "KNOWLEDGE TRANSFER",
    "tagline": "I train your teams on .NET, Azure, and modern web fundamentals and advanced practices.",
    "iconId": "training",
    "summary": "3,000+ hours of training under my belt, across two decades of Microsoft stack. To junior devs and to tech leads stepping back for perspective alike, in schools (Supinfo, NextFormation) or large centres (ORSYS, IP-Formation, Happly), on-site, virtual classroom or bespoke in-house. Twenty modules in the catalogue below — pick them as-is, or let's recompose them into the program that fits your team.",
    "highlights": [
      "ASP.NET Core 10, Blazor 10 (Server, WASM, Hybrid), Entity Framework Core",
      "Azure platform and exam prep — AZ-204 (developer) and AZ-400 (DevOps)",
      "Pragmatic software architecture — Clean Architecture, CQRS, event-driven, DDD-lite",
      "Automated testing, TDD, snapshot and mutation testing",
      "DevOps and CI/CD — GitHub Actions, Azure Pipelines, IaC Bicep / Terraform",
      "Team-grade vibe coding & AI — Claude Code, GitHub Copilot, MCP, on-prem open-weight models",
      "Custom programs assembled from several official modules"
    ],
    "useCases": [
      {
        "title": "Inter-company · 3 days",
        "description": "Catalogue sessions delivered at ORSYS, IP-Formation or in virtual classroom. Individual sign-ups, mixed audience — Blazor, Azure DevOps, Clean Architecture, AZ-204."
      },
      {
        "title": "Bespoke in-house",
        "description": "Program tailored with you: needs assessment up front, module selection, depth and examples adjusted to your code base."
      },
      {
        "title": "À-la-carte program",
        "description": "Start from one official module as the backbone (e.g. AZ-204), add two or three adjacent modules to cover exactly your team's scope — neither too short nor too long."
      }
    ],
    "faq": [
      { "question": "What's your training day rate?", "answer": "800 € per day, or inter / in-house package depending on format. Quoted within 24h from a short brief." },
      { "question": "Remote training?", "answer": "Yes — synchronous virtual classroom, pair exercises, screen-share demos, live feedback. Same rigour as on-site." },
      { "question": "Certified?", "answer": "Active Microsoft Certified Trainer (MCT) and several Azure certifications (AZ-204, AZ-400 among others). My exam-prep modules are grounded in that experience." },
      { "question": "How do you build a custom program?", "answer": "We start from a catalogue module that covers the core of your need, identify what's missing and what's superfluous, borrow chapters from adjacent modules, calibrate duration. The brief takes one 30-minute call." },
      { "question": "What about funding mechanisms?", "answer": "Partner centres (ORSYS, IP-Formation, NextFormation) are Qualiopi-certified: OPCO, CPF entreprise, skills-development plans. For direct in-house, I point you to the right scheme." }
    ],
    "ctaLabel": null,
    "order": 3
  },
```

(Keep the trailing comma.)

- [ ] **Step 2: Verify JSON is well-formed**

```bash
python3 -m json.tool IdeaStudio.Website/wwwroot/data/services-en.json > /dev/null && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Sanity check — make sure the other six entries are untouched**

```bash
python3 -c "import json; data=json.load(open('IdeaStudio.Website/wwwroot/data/services-en.json')); print(len(data), 'entries:', [s['slug'] for s in data])"
```

Expected: `7 entries: ['dotnet-azure-consulting', 'tech-lead', 'trainer', 'vibe-coding', 'ai-enterprise', 'mobile-apps', 'websites']`.

- [ ] **Step 4: Commit**

```bash
git add IdeaStudio.Website/wwwroot/data/services-en.json
git commit -m "$(cat <<'EOF'
content(services-en/trainer): mirror FR enrichment

Same structural changes as the FR entry — five-item FAQ, three useCases
including 'À-la-carte program', enriched highlights and summary —
translated in English with the same editorial tone.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 10: Build the solution and run all tests

**Files:** none (verification step)

- [ ] **Step 1: Full solution build (also runs npm pipeline)**

```bash
dotnet build IdeaStudio.sln
```

Expected: build succeeds, no errors. Warnings about LF/CRLF are benign.

- [ ] **Step 2: Run the full test suite**

```bash
dotnet test IdeaStudio.sln
```

Expected: all tests pass. Concretely the following test files should still be green without modification:

- `BundleBudgetTests` — unaffected (no JS changes).
- `HardcodedPathsTests` — `Home.razor` uses `LocalizedRoute.For(...)` for the new link; the inline `trainerSlug` value (`"formateur"` / `"trainer"`) has no leading slash so it doesn't match the `/(fr|en)/...` regex. Should pass.
- `IntegrationTests` — no route added or removed. Should pass.
- `LocalizedRouteTests` — `LocalizedRoute.cs` is untouched. Should pass.
- `RealisationFilterTests` — uses synthetic in-test data, doesn't load the JSON. Should pass.

- [ ] **Step 3: If any test fails, investigate before committing**

If a test fails:
- Read the failure message and identify the cause.
- Decide whether the test needs updating (legitimate behaviour change) or the implementation needs fixing.
- Loop back into the relevant earlier task; do not "fix" the test by relaxing assertions.
- Commit any test updates with `test:` prefix and a clear explanation.

Expected outcome at end of task: solution builds clean, `dotnet test` reports `Passed!` for every test project.

---

## Task 11: Manual smoke check in the browser

**Files:** none

- [ ] **Step 1: Run the website in watch mode**

```bash
dotnet watch run --project IdeaStudio.Website/IdeaStudio.Website.csproj
```

Wait for `Now listening on: http://localhost:<port>`.

- [ ] **Step 2: Verify the realisations page (FR)**

Open `http://localhost:<port>/fr/realisations`.

Check:
- Brasa Geneva appears first (top-left of the grid).
- K-RO SQUARE shows that name (not "Krosquare").
- IdeaStud.io, Corona Club Noblesse, K-RO SQUARE all show their PNG screenshots; MonSeigneur Champagne keeps its SVG illustration.
- Order top-to-bottom matches the spec table (Brasa → IdeaStud.io → Corona → K-RO → MonSeigneur).

- [ ] **Step 3: Verify the home (FR)**

Open `http://localhost:<port>/fr`.

Check:
- The "Où j'enseigne." section displays training centres.
- The "Voir toutes les formations" link points to `/fr/services/formateur` (hover or right-click → copy link).

- [ ] **Step 4: Verify the formateur fiche (FR)**

Open `http://localhost:<port>/fr/services/formateur`.

Check:
- Hero, summary, "Le périmètre / Ce que la mission couvre." (highlights), "Cas d'usage / Quand on m'appelle." (3 use cases including "Programme à la carte"), **"Partenaires / Là où j'ai enseigné."** with the intro paragraph and `TeachList` grid, FAQ (5 entries), Catalogue (20 modules) — all in this order.

- [ ] **Step 5: Verify the CV (FR)**

Open `http://localhost:<port>/fr/cv`.

Check:
- Chapter IV title is "Là où j'ai enseigné." (was "J'apprends, j'enseigne.").
- An intro paragraph appears between the chapter band and the centres grid.

- [ ] **Step 6: Verify the EN counterparts**

Repeat steps 2-5 on `/en/projects`, `/en`, `/en/services/trainer`, `/en/resume`. Check that:
- The catalogue is now visible on `/en/services/trainer` (this is the bug fix from Task 7).
- The "Centres partenaires" → "Partners / Where I've taught." block is present.
- The home link "See all trainings" goes to `/en/services/trainer`.

- [ ] **Step 7: Stop the dev server**

`Ctrl+C` in the terminal running `dotnet watch`.

- [ ] **Step 8: Final summary commit (only if there is any pending fix from smoke testing)**

If the smoke walk-through revealed a content typo or a small CSS mismatch, fix it and commit with a tight message:

```bash
git add <files>
git commit -m "$(cat <<'EOF'
fix(<area>): <one-line description>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Otherwise no commit is needed — the work is done.

---

## Done

At this point:
- Realisations refresh shipped (Brasa added, K-RO SQUARE renamed, dates aligned, summaries rewritten, PNG screenshots wired up).
- Home points "Voir toutes les formations" to the formateur fiche.
- CV no longer ambiguously says "I learn, I teach"; the section is now "Where I've taught" with a short editorial intro.
- Formateur fiche shares the `TeachList` block with the CV, gains a "Programme à la carte" use case and two new FAQ entries, and finally renders correctly in EN.
- Two transverse kicker/title pairs are revised across every service fiche.

Total expected commits: 9 (one per task in 1-9, plus possibly one fix-up after smoke testing).
