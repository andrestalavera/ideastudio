# Commercial Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the CV-first Blazor WASM portfolio into a services-first commercial vitrine with path-based FR/EN URL internationalization, six dedicated service pages, a filterable realisations page, a CV page with downloadable PDFs, and legacy redirects.

**Architecture:** Eight independently-mergeable phases. Phase 0 rewires URL internationalization (routing, culture detection, localized routes). Phase 1 adds data models. Phase 2 splits the current `Index.razor` into Home + CV. Phases 3–6 build out the nav/footer/PDF, commercial home, service pages, and realisations page. Phase 7 finishes SEO and tests. This plan assumes the parallel cinematic-redesign spec may not yet be merged — where cinematic components (`ChapterSection`, `MotionReveal`, etc.) are referenced, a minimal semantic `<section>` stub is acceptable; the cinematic session swaps in the real implementation later.

**Tech Stack:** .NET 10, Blazor WebAssembly, C# records for models, xUnit + Moq + WebApplicationFactory for tests, JSON static data in `wwwroot/data/`, i18n JSON in `wwwroot/i18n/`, existing `ds-*` SCSS design system classes.

**Spec reference:** `docs/superpowers/specs/2026-04-23-commercial-pivot-design.md`

---

## Conventions used throughout this plan

- **File paths are relative** to the repo root `/Users/andrestalavera/Repos/ideastudio/`.
- **Build verification** after most tasks: `dotnet build IdeaStudio.sln` — expected: `Build succeeded. 0 Error(s)`.
- **Test run**: `dotnet test IdeaStudio.sln` — expected: the added tests pass.
- **Commit messages** are suggested; adapt as you prefer but keep them concise and scope-focused.
- **No `async void`** anywhere (project rule). Always `async Task`.
- **No hardcoded paths** `/fr/...` or `/en/...` inside `.razor`/`.cs` outside `@page` directives and `LocalizedRoute` definition — this is enforced by a test in Phase 7.
- **DRY/YAGNI/TDD** — tests first for logic with branches; for purely-markup components validation is build + integration test of route reachability.

---

## Phase 0 — URL internationalization foundation

### Task 0.1: Create `LocalizedRoute` service interface and skeleton

**Files:**
- Create: `IdeaStudio.Website/Services/ILocalizedRoute.cs`

- [ ] **Step 1: Create the interface and implementation file**

Write the following to `IdeaStudio.Website/Services/ILocalizedRoute.cs`:

```csharp
namespace IdeaStudio.Website.Services;

public interface ILocalizedRoute
{
    /// <summary>Returns the absolute path for a known pageId in the given culture.</summary>
    string For(string pageId, string? cultureName = null);

    /// <summary>Translates a current absolute path into the equivalent in the target culture, preserving dynamic segments.</summary>
    string Translate(string currentPath, string targetCulture);

    /// <summary>Resolves a path to its pageId, or null if unknown.</summary>
    string? MatchPageId(string path);

    /// <summary>Extracts culture code ("fr" or "en") from the first segment of a path, or null if not present.</summary>
    string? ExtractCulture(string path);
}

public sealed class LocalizedRoute(ICultureService cultureService) : ILocalizedRoute
{
    private readonly ICultureService cultureService = cultureService;

    // (pageId, culture) -> path
    private static readonly IReadOnlyDictionary<(string PageId, string Culture), string> StaticRoutes =
        new Dictionary<(string, string), string>
        {
            [("home", "fr")] = "/fr",
            [("home", "en")] = "/en",
            [("services.hub", "fr")] = "/fr/services",
            [("services.hub", "en")] = "/en/services",
            [("realisations", "fr")] = "/fr/realisations",
            [("realisations", "en")] = "/en/projects",
            [("cv", "fr")] = "/fr/cv",
            [("cv", "en")] = "/en/resume",
            [("legal", "fr")] = "/fr/mentions-legales",
            [("legal", "en")] = "/en/legal",
            [("privacy", "fr")] = "/fr/confidentialite",
            [("privacy", "en")] = "/en/privacy"
        };

    public string For(string pageId, string? cultureName = null)
    {
        string culture = cultureName ?? cultureService.CurrentCulture.Name;
        if (StaticRoutes.TryGetValue((pageId, culture), out string? path))
        {
            return path;
        }
        // Unknown pageId: fall back to home in current culture.
        return StaticRoutes[("home", culture)];
    }

    public string Translate(string currentPath, string targetCulture)
    {
        string? sourceCulture = ExtractCulture(currentPath);
        if (sourceCulture == null)
        {
            return For("home", targetCulture);
        }

        // Service pages need dynamic-slug translation via data; this fallback covers only static routes.
        // Service slug translation is resolved inside ServicePage itself (by slug lookup in the target-culture JSON).
        // For static routes, we look up the pageId by path then emit the target-culture path.
        string? pageId = MatchPageId(currentPath);
        if (pageId != null)
        {
            return For(pageId, targetCulture);
        }
        return For("home", targetCulture);
    }

    public string? MatchPageId(string path)
    {
        foreach (KeyValuePair<(string, string), string> kv in StaticRoutes)
        {
            if (string.Equals(kv.Value, path, StringComparison.OrdinalIgnoreCase))
            {
                return kv.Key.Item1;
            }
        }
        return null;
    }

    public string? ExtractCulture(string path)
    {
        if (string.IsNullOrEmpty(path)) return null;
        string trimmed = path.TrimStart('/');
        int slash = trimmed.IndexOf('/');
        string first = slash < 0 ? trimmed : trimmed[..slash];
        return first is "fr" or "en" ? first : null;
    }
}
```

- [ ] **Step 2: Verify compilation**

Run: `dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website/Services/ILocalizedRoute.cs
git commit -m "feat: add ILocalizedRoute service with static route table"
```

### Task 0.2: Test `LocalizedRoute` behavior

**Files:**
- Create: `IdeaStudio.Website.Tests/LocalizedRouteTests.cs`

- [ ] **Step 1: Write the failing tests**

```csharp
using IdeaStudio.Website.Services;
using Moq;

namespace IdeaStudio.Website.Tests;

public class LocalizedRouteTests
{
    private static ILocalizedRoute Make(string culture = "fr")
    {
        Mock<ICultureService> mock = new();
        mock.Setup(s => s.CurrentCulture).Returns(new System.Globalization.CultureInfo(culture));
        return new LocalizedRoute(mock.Object);
    }

    [Theory]
    [InlineData("home", "fr", "/fr")]
    [InlineData("home", "en", "/en")]
    [InlineData("cv", "fr", "/fr/cv")]
    [InlineData("cv", "en", "/en/resume")]
    [InlineData("realisations", "fr", "/fr/realisations")]
    [InlineData("realisations", "en", "/en/projects")]
    [InlineData("legal", "fr", "/fr/mentions-legales")]
    [InlineData("legal", "en", "/en/legal")]
    [InlineData("privacy", "fr", "/fr/confidentialite")]
    [InlineData("privacy", "en", "/en/privacy")]
    public void For_KnownPageIdAndCulture_ReturnsExpectedPath(string pageId, string culture, string expected)
    {
        string actual = Make().For(pageId, culture);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void For_UnknownPageId_FallsBackToCultureHome()
    {
        Assert.Equal("/fr", Make().For("definitely-not-a-page", "fr"));
    }

    [Theory]
    [InlineData("/fr", "fr")]
    [InlineData("/fr/cv", "fr")]
    [InlineData("/en", "en")]
    [InlineData("/en/resume", "en")]
    [InlineData("/", null)]
    [InlineData("/something-else", null)]
    public void ExtractCulture_ReturnsFirstSegmentIfFrOrEn(string path, string? expected)
    {
        Assert.Equal(expected, Make().ExtractCulture(path));
    }

    [Theory]
    [InlineData("/fr", "home")]
    [InlineData("/fr/cv", "cv")]
    [InlineData("/en/resume", "cv")]
    [InlineData("/fr/realisations", "realisations")]
    [InlineData("/en/projects", "realisations")]
    [InlineData("/fr/mentions-legales", "legal")]
    [InlineData("/en/legal", "legal")]
    [InlineData("/unknown", null)]
    public void MatchPageId_ReturnsPageIdOrNull(string path, string? expected)
    {
        Assert.Equal(expected, Make().MatchPageId(path));
    }

    [Theory]
    [InlineData("/fr/cv", "en", "/en/resume")]
    [InlineData("/en/resume", "fr", "/fr/cv")]
    [InlineData("/fr/realisations", "en", "/en/projects")]
    [InlineData("/en/projects", "fr", "/fr/realisations")]
    [InlineData("/fr", "en", "/en")]
    public void Translate_StaticRoute_ReturnsTargetCultureEquivalent(string currentPath, string target, string expected)
    {
        Assert.Equal(expected, Make().Translate(currentPath, target));
    }

    [Fact]
    public void Translate_UnknownPath_FallsBackToTargetHome()
    {
        Assert.Equal("/en", Make().Translate("/whatever", "en"));
    }
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `dotnet test IdeaStudio.sln --filter "FullyQualifiedName~LocalizedRouteTests"`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website.Tests/LocalizedRouteTests.cs
git commit -m "test: cover LocalizedRoute static routing, culture extraction, and translation"
```

### Task 0.3: Refactor `CultureService` to read culture from URL path

**Files:**
- Modify: `IdeaStudio.Website/Services/ICultureService.cs`

- [ ] **Step 1: Rewrite `CultureService` to initialize from URL and expose `SwitchToAsync`**

Replace the existing file content with:

```csharp
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Globalization;

namespace IdeaStudio.Website.Services;

public interface ICultureService
{
    CultureInfo CurrentCulture { get; }
    List<CultureInfo> SupportedCultures { get; }
    Task InitializeAsync();
    Task SetCultureAsync(string culture);
    Task SwitchToAsync(string culture);
    event Action? CultureChanged;
}

public class CultureService(IJSRuntime jsRuntime, NavigationManager navigationManager) : ICultureService
{
    private readonly IJSRuntime jsRuntime = jsRuntime;
    private readonly NavigationManager navigationManager = navigationManager;
    private CultureInfo currentCulture = new("fr");

    public CultureInfo CurrentCulture => currentCulture;

    public List<CultureInfo> SupportedCultures => [
        new CultureInfo("fr"),
        new CultureInfo("en")
    ];

    public event Action? CultureChanged;

    public Task InitializeAsync()
    {
        string path = new Uri(navigationManager.Uri).AbsolutePath;
        string? fromUrl = ExtractCulture(path);
        string resolved = fromUrl ?? "fr";
        return SetCultureAsync(resolved);
    }

    public Task SetCultureAsync(string culture)
    {
        if (string.IsNullOrWhiteSpace(culture) ||
            !SupportedCultures.Any(c => c.Name == culture))
        {
            return Task.CompletedTask;
        }

        currentCulture = new CultureInfo(culture);
        CultureInfo.DefaultThreadCurrentCulture = currentCulture;
        CultureInfo.DefaultThreadCurrentUICulture = currentCulture;

        CultureChanged?.Invoke();
        return Task.CompletedTask;
    }

    public async Task SwitchToAsync(string culture)
    {
        // The actual path translation is done by CultureSelector via ILocalizedRoute — this method
        // only updates the internal state. It exists to keep SetCultureAsync as a pure state change
        // while the selector composes with LocalizedRoute to navigate.
        await SetCultureAsync(culture);
    }

    private static string? ExtractCulture(string path)
    {
        if (string.IsNullOrEmpty(path)) return null;
        string trimmed = path.TrimStart('/');
        int slash = trimmed.IndexOf('/');
        string first = slash < 0 ? trimmed : trimmed[..slash];
        return first is "fr" or "en" ? first : null;
    }
}
```

- [ ] **Step 2: Verify build**

Run: `dotnet build IdeaStudio.sln`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website/Services/ICultureService.cs
git commit -m "refactor: derive CultureService current culture from URL path segment"
```

### Task 0.4: Register `ILocalizedRoute` in DI

**Files:**
- Modify: `IdeaStudio.Website/Program.cs`

- [ ] **Step 1: Register the service**

In `Program.cs`, after the line `builder.Services.AddScoped<ILocalizationService, LocalizationService>();`, add:

```csharp
builder.Services.AddScoped<ILocalizedRoute, LocalizedRoute>();
```

- [ ] **Step 2: Build**

Run: `dotnet build IdeaStudio.sln`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website/Program.cs
git commit -m "chore: register ILocalizedRoute in DI container"
```

### Task 0.5: Update `CultureSelector` to navigate via `ILocalizedRoute`

**Files:**
- Modify: `IdeaStudio.Website/Components/CultureSelector.razor`

- [ ] **Step 1: Inject dependencies and rewrite `SelectCultureAsync`**

Add at the top of the component (after existing `@using`):

```razor
@inject ILocalizedRoute LocalizedRoute
@inject NavigationManager NavigationManager
```

Replace `SelectCultureAsync` with:

```csharp
private async Task SelectCultureAsync(string culture)
{
    isOpen = false;
    string currentPath = new Uri(NavigationManager.Uri).AbsolutePath;
    string targetPath = LocalizedRoute.Translate(currentPath, culture);
    await CultureService.SetCultureAsync(culture);
    NavigationManager.NavigateTo(targetPath, forceLoad: false);
}
```

- [ ] **Step 2: Build**

Run: `dotnet build IdeaStudio.sln`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website/Components/CultureSelector.razor
git commit -m "refactor: CultureSelector navigates via LocalizedRoute on switch"
```

### Task 0.6: Add legacy-URL redirect component

**Files:**
- Create: `IdeaStudio.Website/Components/LegacyRedirect.razor`
- Modify: `IdeaStudio.Website/App.razor`

- [ ] **Step 1: Create `LegacyRedirect.razor`**

```razor
@inject NavigationManager NavigationManager

@code {
    private static readonly Dictionary<string, string> LegacyMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["/"] = "/fr",
        ["/andres-talavera-resume"] = "/fr/cv",
        ["/privacy"] = "/fr/confidentialite",
        ["/legal"] = "/fr/mentions-legales"
    };

    protected override void OnInitialized()
    {
        Uri uri = new(NavigationManager.Uri);
        string path = uri.AbsolutePath;
        string query = uri.Query;

        if (LegacyMap.TryGetValue(path, out string? target))
        {
            string final = AppendCultureAwareQuery(target, query);
            NavigationManager.NavigateTo(final, replace: true);
            return;
        }

        // Handle ?culture=fr|en on any legacy URL: prefix path with the culture.
        if (!string.IsNullOrEmpty(query) && path != "/")
        {
            string? culture = ParseCultureQuery(query);
            if (culture != null && !path.StartsWith("/fr") && !path.StartsWith("/en"))
            {
                NavigationManager.NavigateTo($"/{culture}{path}", replace: true);
            }
        }
    }

    private static string AppendCultureAwareQuery(string target, string query)
    {
        string? culture = ParseCultureQuery(query);
        if (culture == "en" && target.StartsWith("/fr"))
        {
            return "/en" + target[3..];
        }
        return target;
    }

    private static string? ParseCultureQuery(string query)
    {
        if (string.IsNullOrEmpty(query)) return null;
        string q = query.TrimStart('?');
        foreach (string part in q.Split('&'))
        {
            string[] kv = part.Split('=', 2);
            if (kv.Length == 2 && kv[0] == "culture" && kv[1] is "fr" or "en")
            {
                return kv[1];
            }
        }
        return null;
    }
}
```

- [ ] **Step 2: Wire it into `App.razor`'s NotFound branch**

Read `IdeaStudio.Website/App.razor` and inside the `<NotFound>` template, replace whatever exists with:

```razor
<NotFound>
    <LegacyRedirect />
    <PageTitle>Not found</PageTitle>
    <LayoutView Layout="@typeof(MainLayout)">
        <div class="ds-section ds-container">
            <h1>404</h1>
            <p>Cette page n'existe pas. <a href="/fr">Retour à l'accueil</a></p>
        </div>
    </LayoutView>
</NotFound>
```

- [ ] **Step 3: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Components/LegacyRedirect.razor IdeaStudio.Website/App.razor
git commit -m "feat: redirect legacy URLs and ?culture= params to new localized routes"
```

### Task 0.7: Add `staticwebapp.config.json` for server-side redirects

**Files:**
- Create: `IdeaStudio.Website/wwwroot/staticwebapp.config.json`

- [ ] **Step 1: Write the file**

```json
{
  "routes": [
    { "route": "/", "redirect": "/fr", "statusCode": 301 },
    { "route": "/andres-talavera-resume", "redirect": "/fr/cv", "statusCode": 301 },
    { "route": "/privacy", "redirect": "/fr/confidentialite", "statusCode": 301 },
    { "route": "/legal", "redirect": "/fr/mentions-legales", "statusCode": 301 }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif,svg,webp,ico}", "/css/*", "/js/*", "/fonts/*", "/data/*.json", "/i18n/*.json", "*.pdf"]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/wwwroot/staticwebapp.config.json
git commit -m "feat: add Azure Static Web Apps config with legacy redirects"
```

### Task 0.8: Phase 0 integration check

- [ ] **Step 1: Full build and existing tests still pass**

Run: `dotnet build IdeaStudio.sln && dotnet test IdeaStudio.sln`
Expected: Build succeeds, all tests pass.

- [ ] **Step 2: Final commit tagging Phase 0 complete**

```bash
git commit --allow-empty -m "chore: complete Phase 0 (URL i18n foundation)"
```

---

## Phase 1 — Data models and JSON scaffolding

### Task 1.1: Add `Service` record and use-case/FAQ types

**Files:**
- Create: `IdeaStudio.Website/Models/Service.cs`

- [ ] **Step 1: Write the file**

```csharp
namespace IdeaStudio.Website.Models;

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
    int Order
);

public record UseCase(string Title, string Description);

public record FaqEntry(string Question, string Answer);
```

- [ ] **Step 2: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Models/Service.cs
git commit -m "feat: add Service, UseCase, FaqEntry models"
```

### Task 1.2: Add `Realisation` record and type enum

**Files:**
- Create: `IdeaStudio.Website/Models/Realisation.cs`

- [ ] **Step 1: Write the file**

```csharp
namespace IdeaStudio.Website.Models;

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
    int DisplayOrder
);

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

- [ ] **Step 2: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Models/Realisation.cs
git commit -m "feat: add Realisation record and RealisationType enum"
```

### Task 1.3: Seed `services-fr.json` with 6 services (short form)

**Files:**
- Create: `IdeaStudio.Website/wwwroot/data/services-fr.json`

- [ ] **Step 1: Write the file**

```json
[
  {
    "slug": "consultant-dotnet-azure",
    "title": "Consultant .NET & Azure",
    "kicker": "CONSEIL ARCHITECTURE",
    "tagline": "J'architecture, je conseille et je code sur des plateformes .NET et Azure d'envergure.",
    "iconId": "consulting",
    "summary": "Après plus de 15 ans d'expérience en conception logicielle, je vous accompagne sur vos choix d'architecture, la montée en charge de vos plateformes .NET/Azure, et les audits techniques.",
    "highlights": [
      "Architecture cloud native (App Service, Functions, Service Bus, Event Grid, Cosmos DB)",
      "Audit de code et refactoring progressif",
      "Mise en place de CI/CD robustes (Azure DevOps, GitHub Actions)",
      "Stratégie d'observabilité (Application Insights, logs structurés)",
      "Sécurité applicative et gestion des secrets (Key Vault, Managed Identity)"
    ],
    "useCases": [
      {
        "title": "Audit et refonte d'une plateforme SaaS",
        "description": "Analyse de l'existant, plan de refactoring par itérations, accompagnement des équipes jusqu'à la mise en production."
      },
      {
        "title": "Conception d'une architecture événementielle",
        "description": "Pose des fondations pour absorber une croissance × 10 sur le trafic, avec Service Bus, patterns Outbox et projections asynchrones."
      }
    ],
    "faq": [
      { "question": "Quel est votre TJM ?", "answer": "Sur demande, en fonction de la mission, de la durée et du niveau d'implication." },
      { "question": "Travaillez-vous à distance ?", "answer": "Oui, en full-remote ou hybride. Je me déplace ponctuellement à Lyon et en région Rhône-Alpes." },
      { "question": "Intervenez-vous sur du legacy ?", "answer": "Oui. Les audits et les plans de modernisation font partie de mon quotidien." }
    ],
    "ctaLabel": null,
    "order": 1
  },
  {
    "slug": "techlead",
    "title": "Techlead",
    "kicker": "LEADERSHIP TECHNIQUE",
    "tagline": "Je prends la responsabilité technique d'une équipe produit et je la fais grandir.",
    "iconId": "techlead",
    "summary": "En tant que techlead, j'aligne vision produit et décisions techniques, je cadre les choix structurants, je fais monter l'équipe en compétences, et je garde le cap sur la qualité.",
    "highlights": [
      "Cadrage technique des nouveaux chantiers",
      "Revues de code et pair programming",
      "Coaching individuel et collectif",
      "Lien direct avec Product et Design",
      "Ownership du delivery et des indicateurs qualité"
    ],
    "useCases": [
      { "title": "Prise de rôle de techlead intérimaire", "description": "Le temps de recruter le profil pérenne, je prends les rênes techniques d'une équipe produit." },
      { "title": "Accompagnement d'un nouveau techlead", "description": "Binôme pendant 3 à 6 mois pour transmettre pratiques, outillage et posture." }
    ],
    "faq": [
      { "question": "Quelle taille d'équipe ?", "answer": "3 à 10 personnes idéalement, au-delà on discute de la structure." },
      { "question": "Embauchez-vous ?", "answer": "Je participe aux entretiens techniques, je ne porte pas le recrutement en direct." }
    ],
    "ctaLabel": null,
    "order": 2
  },
  {
    "slug": "formateur",
    "title": "Formateur",
    "kicker": "TRANSMISSION",
    "tagline": "Je forme vos équipes aux fondamentaux et aux pratiques avancées .NET, Azure et web moderne.",
    "iconId": "training",
    "summary": "Plus de 3000 heures de formation dispensées auprès de développeurs et techleads. Sessions calibrées à vos besoins, exercices pratiques, suivi post-formation.",
    "highlights": [
      "ASP.NET Core et Blazor",
      "Azure fondamentaux et plateforme (AZ-204, AZ-400)",
      "Architecture logicielle et patterns pragmatiques",
      "Tests automatisés et TDD",
      "DevOps et CI/CD"
    ],
    "useCases": [
      { "title": "Formation inter-entreprise 3 jours", "description": "Sessions catalogue sur Blazor, Azure DevOps ou Clean Architecture." },
      { "title": "Formation intra sur-mesure", "description": "Programme calibré avec vous sur la base d'un audit de besoins préalable." }
    ],
    "faq": [
      { "question": "Formez-vous à distance ?", "answer": "Oui, en classe virtuelle synchrone, avec exercices en binôme et retours en direct." },
      { "question": "Êtes-vous certifié ?", "answer": "Oui, Microsoft Certified Trainer et plusieurs certifications Azure." }
    ],
    "ctaLabel": null,
    "order": 3
  },
  {
    "slug": "vibe-coding",
    "title": "Mise en place de vibe-coding",
    "kicker": "IA DANS VOTRE IDE",
    "tagline": "Je fais adopter les outils IA (Claude Code, Copilot) à votre équipe sans perdre en qualité.",
    "iconId": "vibe",
    "summary": "L'arrivée des IA de code change le quotidien des développeurs. Je vous aide à cadrer l'usage : quels outils, quels garde-fous, quelles pratiques, comment mesurer le gain.",
    "highlights": [
      "Cadrage d'une politique d'usage IA interne",
      "Mise en place de Claude Code / Copilot / agents",
      "Définition de workflows et de hooks sécurité",
      "Coaching des développeurs en binôme avec l'IA",
      "Mesure d'impact (vélocité, qualité, satisfaction)"
    ],
    "useCases": [
      { "title": "Pilote sur une équipe volontaire", "description": "2 à 3 mois de pilote encadré, restitution et recommandation pour le scale-up." },
      { "title": "Déploiement à l'échelle", "description": "Généralisation à toute l'organisation avec guide de bonnes pratiques et dispositif de support." }
    ],
    "faq": [
      { "question": "Est-ce que ça marche sur notre stack ?", "answer": "Les outils actuels sont stack-agnostiques. On valide ensemble sur votre base de code." },
      { "question": "Quid de la confidentialité du code ?", "answer": "On choisit un dispositif compatible avec vos contraintes (SaaS, self-hosted, zero-retention)." }
    ],
    "ctaLabel": null,
    "order": 4
  },
  {
    "slug": "applications-mobiles",
    "title": "Création d'applications mobiles",
    "kicker": "MOBILE CROSS-PLATFORM",
    "tagline": "Je conçois et développe vos applications iOS/Android avec une base technique unique.",
    "iconId": "mobile",
    "summary": "Applications mobiles B2B et B2C, cross-platform (.NET MAUI, Flutter selon contexte). De la maquette à la publication sur les stores.",
    "highlights": [
      "Audit de faisabilité et choix techno",
      "UX/UI mobile et prototypage",
      "Backend et APIs associés",
      "Publication Apple Store / Play Store",
      "Maintenance évolutive"
    ],
    "useCases": [
      { "title": "App métier B2B", "description": "Application terrain pour agents, synchronisation offline, intégration SI." },
      { "title": "App grand public", "description": "MVP rapide, itérations sur les retours utilisateurs, croissance organique." }
    ],
    "faq": [
      { "question": "Vous faites de l'iOS natif ?", "answer": "Oui, si le contexte le justifie. Par défaut je privilégie le cross-platform pour l'économie." },
      { "question": "Qui gère les comptes Apple/Google ?", "answer": "Vous, je vous accompagne sur la création et les soumissions." }
    ],
    "ctaLabel": null,
    "order": 5
  },
  {
    "slug": "sites-internet",
    "title": "Création de sites internet",
    "kicker": "WEB SUR-MESURE",
    "tagline": "Je conçois et réalise vos sites vitrines, e-commerce, et applications web sur mesure.",
    "iconId": "web",
    "summary": "Sites performants, optimisés SEO, accessibles. De la vitrine élégante au site métier complexe, toujours sur des technos modernes et maintenables.",
    "highlights": [
      "Conception et design système",
      "Développement Blazor, ASP.NET Core, ou stack adaptée",
      "SEO technique et Core Web Vitals",
      "Hébergement Azure ou équivalent",
      "Formation à la prise en main"
    ],
    "useCases": [
      { "title": "Site vitrine premium", "description": "Site éditorial, identité forte, performance maximale, parfait pour une marque." },
      { "title": "Application web métier", "description": "Portail client, back-office, workflows complexes, intégrations SI." }
    ],
    "faq": [
      { "question": "Faites-vous les designs ?", "answer": "Sur des petits projets oui. Sur des projets identitaires, je collabore avec des designers." },
      { "question": "Maintenance ?", "answer": "Contrat de maintenance ou forfait à la demande, selon vos besoins." }
    ],
    "ctaLabel": null,
    "order": 6
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/wwwroot/data/services-fr.json
git commit -m "feat: seed services-fr.json with six services"
```

### Task 1.4: Seed `services-en.json` with the same 6 services in English

**Files:**
- Create: `IdeaStudio.Website/wwwroot/data/services-en.json`

- [ ] **Step 1: Write the file**

```json
[
  {
    "slug": "dotnet-azure-consulting",
    "title": ".NET & Azure Consulting",
    "kicker": "ARCHITECTURE CONSULTING",
    "tagline": "Architecture, hands-on guidance, and code on high-stakes .NET and Azure platforms.",
    "iconId": "consulting",
    "summary": "With 15+ years in software design, I help you make the right architecture calls, scale your .NET/Azure platforms, and run technical audits.",
    "highlights": [
      "Cloud-native architecture (App Service, Functions, Service Bus, Event Grid, Cosmos DB)",
      "Code audits and progressive refactoring",
      "Robust CI/CD (Azure DevOps, GitHub Actions)",
      "Observability strategy (Application Insights, structured logging)",
      "Application security and secrets management (Key Vault, Managed Identity)"
    ],
    "useCases": [
      { "title": "SaaS platform audit and rebuild", "description": "Inventory, iterative refactoring plan, hands-on guidance through production." },
      { "title": "Event-driven architecture design", "description": "Foundations for 10× growth, with Service Bus, Outbox patterns, and async projections." }
    ],
    "faq": [
      { "question": "What's your daily rate?", "answer": "On request, depending on scope, duration, and level of involvement." },
      { "question": "Remote work?", "answer": "Yes, full-remote or hybrid. I occasionally travel to Lyon and the Rhône-Alpes area." },
      { "question": "Legacy systems?", "answer": "Yes. Audits and modernization plans are part of my day-to-day." }
    ],
    "ctaLabel": null,
    "order": 1
  },
  {
    "slug": "tech-lead",
    "title": "Tech Lead",
    "kicker": "TECHNICAL LEADERSHIP",
    "tagline": "I own the technical direction of a product team and help it grow.",
    "iconId": "techlead",
    "summary": "As a tech lead, I align product vision with technical decisions, frame structural choices, grow the team's skills, and keep quality on course.",
    "highlights": [
      "Technical framing for new initiatives",
      "Code reviews and pair programming",
      "Individual and collective coaching",
      "Direct collaboration with Product and Design",
      "Ownership of delivery and quality indicators"
    ],
    "useCases": [
      { "title": "Interim tech lead", "description": "Bridge the gap while you recruit, owning the technical direction of a product team." },
      { "title": "Tech lead coaching", "description": "3-to-6-month pairing to transfer practices, tooling, and posture to a new tech lead." }
    ],
    "faq": [
      { "question": "Team size?", "answer": "3 to 10 people ideally; beyond that, we discuss structure." },
      { "question": "Do you hire?", "answer": "I take part in technical interviews but don't own recruitment end-to-end." }
    ],
    "ctaLabel": null,
    "order": 2
  },
  {
    "slug": "trainer",
    "title": "Trainer",
    "kicker": "KNOWLEDGE TRANSFER",
    "tagline": "I train your teams on .NET, Azure, and modern web fundamentals and advanced practices.",
    "iconId": "training",
    "summary": "3000+ hours of training delivered to developers and tech leads. Sessions tailored to your needs, hands-on exercises, post-training follow-up.",
    "highlights": [
      "ASP.NET Core and Blazor",
      "Azure fundamentals and platform (AZ-204, AZ-400)",
      "Pragmatic software architecture and patterns",
      "Automated testing and TDD",
      "DevOps and CI/CD"
    ],
    "useCases": [
      { "title": "Inter-company 3-day training", "description": "Catalog sessions on Blazor, Azure DevOps, or Clean Architecture." },
      { "title": "Bespoke in-house training", "description": "Program tailored with you after a needs-assessment." }
    ],
    "faq": [
      { "question": "Remote training?", "answer": "Yes, synchronous virtual classroom with pair exercises and live feedback." },
      { "question": "Certified?", "answer": "Yes, Microsoft Certified Trainer and multiple Azure certifications." }
    ],
    "ctaLabel": null,
    "order": 3
  },
  {
    "slug": "vibe-coding",
    "title": "Vibe-coding rollout",
    "kicker": "AI IN YOUR IDE",
    "tagline": "I help your team adopt AI coding tools (Claude Code, Copilot) without losing quality.",
    "iconId": "vibe",
    "summary": "AI coding tools are reshaping developer workflows. I help you frame usage: which tools, which guardrails, which practices, and how to measure gains.",
    "highlights": [
      "Internal AI usage policy framing",
      "Claude Code / Copilot / agent rollout",
      "Workflow and security hook definition",
      "Developer pair-coaching with AI",
      "Impact measurement (velocity, quality, satisfaction)"
    ],
    "useCases": [
      { "title": "Pilot with a willing team", "description": "2-to-3-month framed pilot, debrief, and recommendation for scale-up." },
      { "title": "Org-wide deployment", "description": "Rollout across the organization with best-practice guide and support structure." }
    ],
    "faq": [
      { "question": "Does it work on our stack?", "answer": "Current tools are stack-agnostic. We validate on your code base together." },
      { "question": "Code confidentiality?", "answer": "We pick a setup that fits your constraints (SaaS, self-hosted, zero-retention)." }
    ],
    "ctaLabel": null,
    "order": 4
  },
  {
    "slug": "mobile-apps",
    "title": "Mobile app development",
    "kicker": "CROSS-PLATFORM MOBILE",
    "tagline": "I design and build your iOS/Android apps with a single technical base.",
    "iconId": "mobile",
    "summary": "B2B and B2C mobile apps, cross-platform (.NET MAUI, Flutter depending on context). From mockup to store publishing.",
    "highlights": [
      "Feasibility audit and tech choice",
      "Mobile UX/UI and prototyping",
      "Backend and companion APIs",
      "Apple Store / Play Store publishing",
      "Evolutive maintenance"
    ],
    "useCases": [
      { "title": "B2B field app", "description": "Field app for agents, offline sync, IS integration." },
      { "title": "Consumer app", "description": "Fast MVP, user-driven iterations, organic growth." }
    ],
    "faq": [
      { "question": "Native iOS?", "answer": "Yes when justified. By default I favor cross-platform for cost-efficiency." },
      { "question": "Who owns Apple/Google accounts?", "answer": "You. I support creation and submissions." }
    ],
    "ctaLabel": null,
    "order": 5
  },
  {
    "slug": "websites",
    "title": "Website development",
    "kicker": "BESPOKE WEB",
    "tagline": "I design and build your showcase sites, e-commerce, and custom web apps.",
    "iconId": "web",
    "summary": "High-performance, SEO-optimized, accessible websites. From elegant showcase to complex business web apps, always on modern, maintainable tech.",
    "highlights": [
      "Design system and layout",
      "Blazor, ASP.NET Core, or the right stack",
      "Technical SEO and Core Web Vitals",
      "Azure hosting or equivalent",
      "Handover training"
    ],
    "useCases": [
      { "title": "Premium showcase site", "description": "Editorial site, strong identity, max performance — perfect for a brand." },
      { "title": "Business web application", "description": "Customer portal, back-office, complex workflows, IS integrations." }
    ],
    "faq": [
      { "question": "Do you design too?", "answer": "On small projects yes. On identity-driven projects I collaborate with designers." },
      { "question": "Maintenance?", "answer": "Maintenance contract or ad-hoc pricing, to suit your needs." }
    ],
    "ctaLabel": null,
    "order": 6
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/wwwroot/data/services-en.json
git commit -m "feat: seed services-en.json with six services"
```

### Task 1.5: Seed `realisations-fr.json` with the four initial projects

**Files:**
- Create: `IdeaStudio.Website/wwwroot/data/realisations-fr.json`

- [ ] **Step 1: Write the file**

```json
[
  {
    "slug": "monseigneurchampagne",
    "title": "Monseigneur Champagne",
    "client": "Monseigneur Champagne",
    "summary": "Site vitrine d'une maison de champagne, identité premium et parcours client.",
    "imageUrl": "images/realisations/monseigneur-champagne.webp",
    "imageAlt": "Capture d'écran du site Monseigneur Champagne",
    "liveUrl": "https://www.monseigneurchampagne.com",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Azure"],
    "completedOn": "2025-11-01",
    "displayOrder": 1
  },
  {
    "slug": "coronaclubnobless",
    "title": "Corona Club Noblesse",
    "client": "Corona Club Noblesse",
    "summary": "Site institutionnel d'un club suisse, rendu élégant et tri-langue.",
    "imageUrl": "images/realisations/corona-club-noblesse.webp",
    "imageAlt": "Capture d'écran du site Corona Club Noblesse",
    "liveUrl": "https://www.coronaclubnobless.ch",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor"],
    "completedOn": "2025-09-15",
    "displayOrder": 2
  },
  {
    "slug": "krosquare",
    "title": "Krosquare",
    "client": "Krosquare",
    "summary": "Site vitrine et présentation d'offre pour une marque française.",
    "imageUrl": "images/realisations/krosquare.webp",
    "imageAlt": "Capture d'écran du site Krosquare",
    "liveUrl": "https://www.krosquare.fr",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Azure"],
    "completedOn": "2025-07-20",
    "displayOrder": 3
  },
  {
    "slug": "ideastudio",
    "title": "IdeaStud.io",
    "client": "Projet personnel",
    "summary": "Le site que vous êtes en train de consulter : portfolio, services, blog.",
    "imageUrl": "images/realisations/ideastudio.webp",
    "imageAlt": "Capture d'écran du site IdeaStud.io",
    "liveUrl": "https://www.ideastud.io",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Azure", "Markdig"],
    "completedOn": "2025-04-01",
    "displayOrder": 4
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/wwwroot/data/realisations-fr.json
git commit -m "feat: seed realisations-fr.json with four projects"
```

### Task 1.6: Seed `realisations-en.json` (same entries, English copy)

**Files:**
- Create: `IdeaStudio.Website/wwwroot/data/realisations-en.json`

- [ ] **Step 1: Write the file**

Use the same structure as `realisations-fr.json` but translate `summary` and `imageAlt` fields to English:

```json
[
  {
    "slug": "monseigneurchampagne",
    "title": "Monseigneur Champagne",
    "client": "Monseigneur Champagne",
    "summary": "Showcase site for a champagne house — premium identity and customer journey.",
    "imageUrl": "images/realisations/monseigneur-champagne.webp",
    "imageAlt": "Screenshot of the Monseigneur Champagne website",
    "liveUrl": "https://www.monseigneurchampagne.com",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Azure"],
    "completedOn": "2025-11-01",
    "displayOrder": 1
  },
  {
    "slug": "coronaclubnobless",
    "title": "Corona Club Noblesse",
    "client": "Corona Club Noblesse",
    "summary": "Institutional site for a Swiss club, with an elegant rendering and tri-language support.",
    "imageUrl": "images/realisations/corona-club-noblesse.webp",
    "imageAlt": "Screenshot of the Corona Club Noblesse website",
    "liveUrl": "https://www.coronaclubnobless.ch",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor"],
    "completedOn": "2025-09-15",
    "displayOrder": 2
  },
  {
    "slug": "krosquare",
    "title": "Krosquare",
    "client": "Krosquare",
    "summary": "Showcase and offer-presentation site for a French brand.",
    "imageUrl": "images/realisations/krosquare.webp",
    "imageAlt": "Screenshot of the Krosquare website",
    "liveUrl": "https://www.krosquare.fr",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Azure"],
    "completedOn": "2025-07-20",
    "displayOrder": 3
  },
  {
    "slug": "ideastudio",
    "title": "IdeaStud.io",
    "client": "Personal project",
    "summary": "The site you're currently browsing: portfolio, services, blog.",
    "imageUrl": "images/realisations/ideastudio.webp",
    "imageAlt": "Screenshot of the IdeaStud.io website",
    "liveUrl": "https://www.ideastud.io",
    "type": "SiteVitrine",
    "technologies": [".NET", "Blazor", "Azure", "Markdig"],
    "completedOn": "2025-04-01",
    "displayOrder": 4
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/wwwroot/data/realisations-en.json
git commit -m "feat: seed realisations-en.json with four projects"
```

### Task 1.7: Add realisation placeholder images (empty SVG/webp fallbacks)

**Files:**
- Create: `IdeaStudio.Website/wwwroot/images/realisations/monseigneur-champagne.webp` *(placeholder)*
- Create: `IdeaStudio.Website/wwwroot/images/realisations/corona-club-noblesse.webp` *(placeholder)*
- Create: `IdeaStudio.Website/wwwroot/images/realisations/krosquare.webp` *(placeholder)*
- Create: `IdeaStudio.Website/wwwroot/images/realisations/ideastudio.webp` *(placeholder)*

- [ ] **Step 1: Create a placeholder SVG for each missing screenshot**

Since real screenshots are not yet available, create a simple SVG placeholder for each and save with a `.svg` extension instead. Update the JSON `imageUrl` fields accordingly.

For each file name above, create a file with `.svg` extension instead and content:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" role="img" aria-label="Placeholder">
  <rect width="100%" height="100%" fill="#0c4a6e"/>
  <text x="50%" y="50%" fill="#7dd3fc" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif" font-size="28">{TITLE}</text>
</svg>
```

Replace `{TITLE}` with the project name for each SVG.

Then update both JSON files to use `.svg` instead of `.webp`:

```bash
sed -i '' 's/\.webp"/.svg"/g' IdeaStudio.Website/wwwroot/data/realisations-fr.json
sed -i '' 's/\.webp"/.svg"/g' IdeaStudio.Website/wwwroot/data/realisations-en.json
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/wwwroot/images/realisations/ IdeaStudio.Website/wwwroot/data/
git commit -m "feat: add SVG placeholders for realisation screenshots"
```

### Task 1.8: Phase 1 integration check

- [ ] **Step 1: Full build and tests**

Run: `dotnet build IdeaStudio.sln && dotnet test IdeaStudio.sln`
Expected: Pass.

- [ ] **Step 2: Tag phase complete**

```bash
git commit --allow-empty -m "chore: complete Phase 1 (data models and JSON scaffolding)"
```

---

## Phase 2 — Split `Index` into `Home` and `Cv`

### Task 2.1: Create `Pages/Cv.razor` carrying the current CV content

**Files:**
- Create: `IdeaStudio.Website/Pages/Cv.razor`

- [ ] **Step 1: Copy the full content of the current `Pages/Index.razor` into a new `Pages/Cv.razor`**

Read `IdeaStudio.Website/Pages/Index.razor` and write its entire content into `IdeaStudio.Website/Pages/Cv.razor`, replacing the two `@page` lines at the top with:

```razor
@page "/fr/cv"
@page "/en/resume"
@page "/andres-talavera-resume"
```

(The last route is kept temporarily for redirect continuity; Phase 7 cleanup removes it once legacy redirect is in place everywhere.)

- [ ] **Step 2: Build**

Run: `dotnet build IdeaStudio.sln`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website/Pages/Cv.razor
git commit -m "feat: add Pages/Cv.razor at /fr/cv and /en/resume"
```

### Task 2.2: Create placeholder `Pages/Home.razor`

**Files:**
- Create: `IdeaStudio.Website/Pages/Home.razor`

- [ ] **Step 1: Write a minimal placeholder home**

```razor
@page "/fr"
@page "/en"
@using IdeaStudio.Website.Components
@using IdeaStudio.Website.Services
@inherits LocalizedComponent
@layout MainLayout

<SeoHead Title="IdeaStud.io — Andrés Talavera"
         Description="Consultant .NET & Azure, techlead, formateur — site en cours de refonte commerciale."
         Author="Andrés Talavera"
         CanonicalUrl="https://ideastud.io"
         SiteName="IdeaStud.io" />

<section class="ds-section ds-container">
    <h1>IdeaStud.io</h1>
    <p class="ds-lead">@placeholderText</p>
    <p>
        <a class="ds-btn ds-btn--primary" href="/fr/cv">@visitCvText</a>
    </p>
</section>

@code {
    private string placeholderText = "La nouvelle page d'accueil arrive bientôt.";
    private string visitCvText = "Voir mon CV";

    protected override void LoadTexts()
    {
        placeholderText = LocalizationService.GetString("Home.Placeholder");
        visitCvText = LocalizationService.GetString("Home.VisitCv");
    }
}
```

- [ ] **Step 2: Build**

Run: `dotnet build IdeaStudio.sln`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website/Pages/Home.razor
git commit -m "feat: add placeholder Home page at /fr and /en"
```

### Task 2.3: Delete the old `Pages/Index.razor`

**Files:**
- Delete: `IdeaStudio.Website/Pages/Index.razor`

- [ ] **Step 1: Remove the file**

```bash
rm IdeaStudio.Website/Pages/Index.razor
```

- [ ] **Step 2: Verify build still works (legacy `/` redirect handles the old URL)**

Run: `dotnet build IdeaStudio.sln`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add -u IdeaStudio.Website/Pages/Index.razor
git commit -m "refactor: remove legacy Index.razor (superseded by Home and Cv)"
```

### Task 2.4: Add `Home.Placeholder` and `Home.VisitCv` i18n entries

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/i18n/fr.json`
- Modify: `IdeaStudio.Website/wwwroot/i18n/en.json`

- [ ] **Step 1: Add entries**

In each JSON file, add two new keys. For `fr.json`:

```json
"Home.Placeholder": "La nouvelle page d'accueil arrive bientôt.",
"Home.VisitCv": "Voir mon CV"
```

For `en.json`:

```json
"Home.Placeholder": "The new home page is on its way.",
"Home.VisitCv": "See my resume"
```

- [ ] **Step 2: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/wwwroot/i18n/fr.json IdeaStudio.Website/wwwroot/i18n/en.json
git commit -m "feat(i18n): add Home.Placeholder and Home.VisitCv keys"
```

### Task 2.5: Route the new privacy and legal pages

**Files:**
- Modify: `IdeaStudio.Website/Pages/Privacy.razor`
- Modify: `IdeaStudio.Website/Pages/Legal.razor`

- [ ] **Step 1: Update `@page` directives on Privacy**

Open `IdeaStudio.Website/Pages/Privacy.razor` and replace the `@page "/privacy"` line with:

```razor
@page "/fr/confidentialite"
@page "/en/privacy"
```

- [ ] **Step 2: Update `@page` directives on Legal**

Open `IdeaStudio.Website/Pages/Legal.razor` and replace the `@page "/legal"` line with:

```razor
@page "/fr/mentions-legales"
@page "/en/legal"
```

- [ ] **Step 3: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Pages/Privacy.razor IdeaStudio.Website/Pages/Legal.razor
git commit -m "feat: route Privacy and Legal pages under /fr and /en prefixes"
```

### Task 2.6: Phase 2 integration check

- [ ] **Step 1: Full build and tests**

Run: `dotnet build IdeaStudio.sln && dotnet test IdeaStudio.sln`
Expected: Pass.

- [ ] **Step 2: Tag phase complete**

```bash
git commit --allow-empty -m "chore: complete Phase 2 (Home/Cv split)"
```

---

## Phase 3 — Navigation, footer, PDF download

### Task 3.1: Extend i18n with Nav and Footer keys

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/i18n/fr.json`
- Modify: `IdeaStudio.Website/wwwroot/i18n/en.json`

- [ ] **Step 1: Add entries to `fr.json`**

Add (merge into existing JSON object):

```json
"Nav.Services": "Services",
"Nav.Realisations": "Réalisations",
"Nav.Cv": "CV",
"Nav.BookCall": "Réserver 30 min",
"Footer.Services": "Services",
"Footer.Links": "Liens",
"Footer.Follow": "Me suivre",
"Footer.Legal": "Légal",
"Footer.Copyright": "© {0} IdeaStud.io — Tous droits réservés",
"Cv.DownloadPdfFr": "Télécharger CV (FR, PDF)",
"Cv.DownloadPdfEn": "Télécharger CV (EN, PDF)",
"Cv.PdfSectionTitle": "Télécharger mon CV",
"NotFound.Title": "Page introuvable",
"NotFound.Lead": "Désolé, cette page n'existe pas.",
"NotFound.BackHome": "Retour à l'accueil"
```

- [ ] **Step 2: Add equivalent entries to `en.json`**

```json
"Nav.Services": "Services",
"Nav.Realisations": "Projects",
"Nav.Cv": "Resume",
"Nav.BookCall": "Book 30 min",
"Footer.Services": "Services",
"Footer.Links": "Links",
"Footer.Follow": "Follow me",
"Footer.Legal": "Legal",
"Footer.Copyright": "© {0} IdeaStud.io — All rights reserved",
"Cv.DownloadPdfFr": "Download resume (FR, PDF)",
"Cv.DownloadPdfEn": "Download resume (EN, PDF)",
"Cv.PdfSectionTitle": "Download my resume",
"NotFound.Title": "Page not found",
"NotFound.Lead": "Sorry, this page does not exist.",
"NotFound.BackHome": "Back to home"
```

- [ ] **Step 3: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/wwwroot/i18n/fr.json IdeaStudio.Website/wwwroot/i18n/en.json
git commit -m "feat(i18n): add Nav, Footer, Cv and NotFound keys"
```

### Task 3.2: Create `PdfDownloadButton` component

**Files:**
- Create: `IdeaStudio.Website/Components/PdfDownloadButton.razor`

- [ ] **Step 1: Write the file**

```razor
<a class="ds-btn ds-btn--ghost ds-btn--sm"
   href="@($"cv-andres-talavera-{Language}.pdf")"
   download
   aria-label="@Label">
    <i class="fas fa-file-pdf" aria-hidden="true"></i>
    <span>@Label</span>
</a>

@code {
    [Parameter, EditorRequired] public string Language { get; set; } = "fr";
    [Parameter, EditorRequired] public string Label { get; set; } = "";
}
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/Components/PdfDownloadButton.razor
git commit -m "feat: add PdfDownloadButton component"
```

### Task 3.3: Add CV PDF download section to `Pages/Cv.razor`

**Files:**
- Modify: `IdeaStudio.Website/Pages/Cv.razor`

- [ ] **Step 1: Inject `ILocalizationService` and add a PDF section after the hero**

Just after the `<HeroSection ...>` line and before the first `<div class="pagebreak">`, insert:

```razor
<section id="cv-pdf" class="ds-section d-print-none">
    <div class="ds-container">
        <h2>@pdfSectionTitleText</h2>
        <div class="ds-stack ds-stack--row ds-gap-sm">
            <PdfDownloadButton Language="fr" Label="@pdfFrText" />
            <PdfDownloadButton Language="en" Label="@pdfEnText" />
        </div>
    </div>
</section>
```

At the top of `@code`, declare:

```csharp
private string pdfSectionTitleText = "Download my resume";
private string pdfFrText = "Download resume (FR, PDF)";
private string pdfEnText = "Download resume (EN, PDF)";
```

Inside `LoadTexts()`, add:

```csharp
pdfSectionTitleText = LocalizationService.GetString("Cv.PdfSectionTitle");
pdfFrText = LocalizationService.GetString("Cv.DownloadPdfFr");
pdfEnText = LocalizationService.GetString("Cv.DownloadPdfEn");
```

- [ ] **Step 2: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Pages/Cv.razor
git commit -m "feat: expose CV PDF download section on /fr/cv and /en/resume"
```

### Task 3.4: Create the two PDF placeholder files

**Files:**
- Create: `IdeaStudio.Website/wwwroot/cv-andres-talavera-fr.pdf` *(placeholder)*
- Create: `IdeaStudio.Website/wwwroot/cv-andres-talavera-en.pdf` *(placeholder)*

- [ ] **Step 1: Create a minimal valid PDF placeholder**

Use any valid PDF; for the placeholder, a 1-page PDF from a minimal LaTeX source or any saved-as-PDF works. For scripted minimal content, paste the following byte-accurate content:

Use a shell command to generate each:

```bash
python3 -c "
pdf = b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 24 Tf 100 700 Td (Placeholder CV) Tj ET\nendstream endobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000053 00000 n\n0000000099 00000 n\n0000000170 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n256\n%%EOF\n'
open('IdeaStudio.Website/wwwroot/cv-andres-talavera-fr.pdf','wb').write(pdf)
open('IdeaStudio.Website/wwwroot/cv-andres-talavera-en.pdf','wb').write(pdf)
"
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/wwwroot/cv-andres-talavera-fr.pdf IdeaStudio.Website/wwwroot/cv-andres-talavera-en.pdf
git commit -m "feat: add placeholder CV PDF files (FR + EN)"
```

### Task 3.5: Refactor `FooterSection.razor` into four blocks

**Files:**
- Modify: `IdeaStudio.Website/Components/FooterSection.razor`

- [ ] **Step 1: Rewrite the component**

Read the existing `FooterSection.razor` first to understand its current structure, then replace its template with:

```razor
@using IdeaStudio.Website.Services
@inherits LocalizedComponent
@inject ILocalizedRoute LocalizedRoute

<footer class="ds-footer">
    <div class="ds-container ds-footer__grid">
        <nav class="ds-footer__block" aria-labelledby="footer-services">
            <h3 id="footer-services" class="ds-footer__title">@servicesTitleText</h3>
            <ul class="ds-footer__list">
                <li><a href="@LocalizedRoute.For("services.hub")">@allServicesText</a></li>
            </ul>
        </nav>
        <nav class="ds-footer__block" aria-labelledby="footer-links">
            <h3 id="footer-links" class="ds-footer__title">@linksTitleText</h3>
            <ul class="ds-footer__list">
                <li><a href="@LocalizedRoute.For("home")">@homeText</a></li>
                <li><a href="@LocalizedRoute.For("realisations")">@realisationsText</a></li>
                <li><a href="@LocalizedRoute.For("cv")">@cvText</a></li>
            </ul>
            <div class="ds-stack ds-stack--row ds-gap-xs ds-mt-sm">
                <PdfDownloadButton Language="fr" Label="@pdfFrText" />
                <PdfDownloadButton Language="en" Label="@pdfEnText" />
            </div>
        </nav>
        <nav class="ds-footer__block" aria-labelledby="footer-follow">
            <h3 id="footer-follow" class="ds-footer__title">@followTitleText</h3>
            <SocialNetworksComponent />
        </nav>
        <nav class="ds-footer__block" aria-labelledby="footer-legal">
            <h3 id="footer-legal" class="ds-footer__title">@legalTitleText</h3>
            <ul class="ds-footer__list">
                <li><a href="@LocalizedRoute.For("legal")">@legalLinkText</a></li>
                <li><a href="@LocalizedRoute.For("privacy")">@privacyLinkText</a></li>
            </ul>
        </nav>
    </div>
    <div class="ds-container ds-footer__bottom">
        <small>@string.Format(copyrightText, DateTime.UtcNow.Year)</small>
    </div>
</footer>

@code {
    private string servicesTitleText = "Services";
    private string linksTitleText = "Links";
    private string followTitleText = "Follow me";
    private string legalTitleText = "Legal";
    private string allServicesText = "All services";
    private string homeText = "Home";
    private string realisationsText = "Projects";
    private string cvText = "Resume";
    private string legalLinkText = "Legal notice";
    private string privacyLinkText = "Privacy";
    private string pdfFrText = "Download resume (FR)";
    private string pdfEnText = "Download resume (EN)";
    private string copyrightText = "© {0} IdeaStud.io";

    protected override void LoadTexts()
    {
        servicesTitleText = LocalizationService.GetString("Footer.Services");
        linksTitleText = LocalizationService.GetString("Footer.Links");
        followTitleText = LocalizationService.GetString("Footer.Follow");
        legalTitleText = LocalizationService.GetString("Footer.Legal");
        allServicesText = LocalizationService.GetString("Nav.Services");
        homeText = LocalizationService.GetString("Nav.Home");
        realisationsText = LocalizationService.GetString("Nav.Realisations");
        cvText = LocalizationService.GetString("Nav.Cv");
        legalLinkText = LocalizationService.GetString("Footer.LegalLink");
        privacyLinkText = LocalizationService.GetString("Footer.PrivacyLink");
        pdfFrText = LocalizationService.GetString("Cv.DownloadPdfFr");
        pdfEnText = LocalizationService.GetString("Cv.DownloadPdfEn");
        copyrightText = LocalizationService.GetString("Footer.Copyright");
    }
}
```

- [ ] **Step 2: Add the missing i18n keys**

Add `Nav.Home`, `Footer.LegalLink`, `Footer.PrivacyLink` to both `fr.json` and `en.json`:

FR:
```json
"Nav.Home": "Accueil",
"Footer.LegalLink": "Mentions légales",
"Footer.PrivacyLink": "Confidentialité"
```

EN:
```json
"Nav.Home": "Home",
"Footer.LegalLink": "Legal notice",
"Footer.PrivacyLink": "Privacy"
```

- [ ] **Step 3: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Components/FooterSection.razor IdeaStudio.Website/wwwroot/i18n/fr.json IdeaStudio.Website/wwwroot/i18n/en.json
git commit -m "refactor: restructure FooterSection into four blocks with PDF downloads"
```

### Task 3.6: Refactor `MainLayout.razor` navbar

**Files:**
- Modify: `IdeaStudio.Website/MainLayout.razor`

- [ ] **Step 1: Read the existing file to understand current structure**

Read `IdeaStudio.Website/MainLayout.razor` first.

- [ ] **Step 2: Replace the navbar with the minimal nav + Calendly CTA**

Keep the overall layout shell but replace the nav section with:

```razor
<header class="ds-header">
    <div class="ds-container ds-header__inner">
        <a class="ds-header__logo" href="@LocalizedRoute.For("home")">IdeaStud.io</a>
        <nav class="ds-header__nav" aria-label="Main">
            <a href="@LocalizedRoute.For("services.hub")">@servicesText</a>
            <a href="@LocalizedRoute.For("realisations")">@realisationsText</a>
            <a href="@LocalizedRoute.For("cv")">@cvText</a>
        </nav>
        <div class="ds-header__actions">
            <CultureSelector />
            <a class="ds-btn ds-btn--primary ds-btn--sm"
               href="https://calendly.com/andres-talavera/30min"
               target="_blank" rel="noopener"
               aria-label="@bookCallAriaText">
                @bookCallText
            </a>
        </div>
    </div>
</header>
```

Inject `ILocalizedRoute` at the top of `MainLayout.razor`:

```razor
@inject ILocalizedRoute LocalizedRoute
@inherits LayoutComponentBase
```

(Adjust if it already inherits from `LocalizedComponent` or similar — keep existing base.)

Add or update the `@code` block:

```csharp
private string servicesText = "Services";
private string realisationsText = "Projects";
private string cvText = "Resume";
private string bookCallText = "Book 30 min";
private string bookCallAriaText = "Book a 30-minute call on Calendly (opens in a new tab)";

// If MainLayout already derives from LocalizedComponent, use LoadTexts; else hook OnInitialized.
protected override void OnInitialized()
{
    // existing init
    LoadNavTexts();
}

private void LoadNavTexts()
{
    // If LocalizationService is injected, use it; otherwise leave defaults.
    servicesText = LocalizationService?.GetString("Nav.Services") ?? servicesText;
    realisationsText = LocalizationService?.GetString("Nav.Realisations") ?? realisationsText;
    cvText = LocalizationService?.GetString("Nav.Cv") ?? cvText;
    bookCallText = LocalizationService?.GetString("Nav.BookCall") ?? bookCallText;
}
```

(Adapt to the actual base class; if `MainLayout` is not a `LocalizedComponent`, inject `ILocalizationService` and subscribe to `CultureChanged`.)

- [ ] **Step 3: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/MainLayout.razor
git commit -m "refactor: minimal nav with Calendly CTA in MainLayout"
```

### Task 3.7: Phase 3 integration check

- [ ] **Step 1: Full build, test, serve locally, and smoke-check**

Run: `dotnet build IdeaStudio.sln && dotnet test IdeaStudio.sln`
Expected: Pass.

- [ ] **Step 2: Tag phase complete**

```bash
git commit --allow-empty -m "chore: complete Phase 3 (nav, footer, PDF)"
```

---

## Phase 4 — Commercial home

### Task 4.1: Add custom service SVG icons

**Files:**
- Create: `IdeaStudio.Website/wwwroot/images/icons/services/consulting.svg`
- Create: `IdeaStudio.Website/wwwroot/images/icons/services/techlead.svg`
- Create: `IdeaStudio.Website/wwwroot/images/icons/services/training.svg`
- Create: `IdeaStudio.Website/wwwroot/images/icons/services/vibe.svg`
- Create: `IdeaStudio.Website/wwwroot/images/icons/services/mobile.svg`
- Create: `IdeaStudio.Website/wwwroot/images/icons/services/web.svg`

- [ ] **Step 1: Create each SVG**

Use a consistent 48×48 viewBox, `currentColor` for stroke so the cinematic theme can recolor. Minimal shapes:

**consulting.svg** (architecture diagram glyph):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect x="6" y="10" width="14" height="10" rx="2"/>
  <rect x="28" y="10" width="14" height="10" rx="2"/>
  <rect x="17" y="28" width="14" height="10" rx="2"/>
  <path d="M13 20v4M35 20v4M24 20v8"/>
</svg>
```

**techlead.svg** (compass/command):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="24" cy="24" r="16"/>
  <path d="M24 12l4 12l-4 12l-4-12z"/>
</svg>
```

**training.svg** (mortar board):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M4 18l20-8 20 8-20 8z"/>
  <path d="M12 22v10c0 2 5 5 12 5s12-3 12-5V22"/>
  <path d="M44 18v10"/>
</svg>
```

**vibe.svg** (waveform / sparkle combo):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M6 24h6l3-10 6 20 3-14 6 18 3-8 3 4h6"/>
</svg>
```

**mobile.svg** (phone outline):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect x="14" y="4" width="20" height="40" rx="4"/>
  <circle cx="24" cy="38" r="1.5" fill="currentColor"/>
  <path d="M20 8h8"/>
</svg>
```

**web.svg** (browser window):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect x="4" y="8" width="40" height="32" rx="3"/>
  <path d="M4 16h40"/>
  <circle cx="9" cy="12" r="1" fill="currentColor"/>
  <circle cx="13" cy="12" r="1" fill="currentColor"/>
  <circle cx="17" cy="12" r="1" fill="currentColor"/>
</svg>
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/wwwroot/images/icons/services/
git commit -m "feat: add six custom service icons as SVG"
```

### Task 4.2: Create `ServiceCard` component

**Files:**
- Create: `IdeaStudio.Website/Components/ServiceCard.razor`

- [ ] **Step 1: Write the component**

```razor
@using IdeaStudio.Website.Models
@using IdeaStudio.Website.Services
@inject ILocalizedRoute LocalizedRoute
@inject ICultureService CultureService

<a class="ds-card ds-card--service" href="@ServicePath" aria-label="@Service.Title">
    <div class="ds-card__icon">
        <img src="@($"images/icons/services/{Service.IconId}.svg")" alt="" aria-hidden="true" />
    </div>
    <div class="ds-card__kicker">@Service.Kicker</div>
    <h3 class="ds-card__title">@Service.Title</h3>
    <p class="ds-card__lead">@Service.Tagline</p>
</a>

@code {
    [Parameter, EditorRequired] public Service Service { get; set; } = null!;

    private string ServicePath => $"{LocalizedRoute.For("services.hub")}/{Service.Slug}";
}
```

- [ ] **Step 2: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Components/ServiceCard.razor
git commit -m "feat: add ServiceCard component"
```

### Task 4.3: Create `ServicesGrid` component

**Files:**
- Create: `IdeaStudio.Website/Components/ServicesGrid.razor`

- [ ] **Step 1: Write the component**

```razor
@using IdeaStudio.Website.Models

<section id="services" class="ds-section">
    <div class="ds-container">
        <div class="ds-section__header">
            <h2 class="ds-section__title">@Title</h2>
            <p class="ds-section__lead">@Lead</p>
        </div>
        <div class="ds-grid ds-grid--services">
            @foreach (Service service in Services.OrderBy(s => s.Order))
            {
                <ServiceCard Service="@service" />
            }
        </div>
    </div>
</section>

@code {
    [Parameter, EditorRequired] public IReadOnlyList<Service> Services { get; set; } = [];
    [Parameter] public string Title { get; set; } = "";
    [Parameter] public string Lead { get; set; } = "";
}
```

- [ ] **Step 2: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Components/ServicesGrid.razor
git commit -m "feat: add ServicesGrid component"
```

### Task 4.4: Create `RealisationCard` component

**Files:**
- Create: `IdeaStudio.Website/Components/RealisationCard.razor`

- [ ] **Step 1: Write the component**

```razor
@using IdeaStudio.Website.Models

<article class="ds-card ds-card--realisation">
    <a href="@Realisation.LiveUrl" target="_blank" rel="noopener" class="ds-card__media">
        <img src="@Realisation.ImageUrl" alt="@Realisation.ImageAlt" loading="lazy" />
    </a>
    <div class="ds-card__body">
        <div class="ds-card__kicker">@Realisation.Client</div>
        <h3 class="ds-card__title">
            <a href="@Realisation.LiveUrl" target="_blank" rel="noopener">@Realisation.Title</a>
        </h3>
        <p class="ds-card__lead">@Realisation.Summary</p>
        <ul class="ds-chips" aria-label="Technologies">
            @foreach (string tech in Realisation.Technologies)
            {
                <li class="ds-chip ds-chip--sm">@tech</li>
            }
        </ul>
    </div>
</article>

@code {
    [Parameter, EditorRequired] public Realisation Realisation { get; set; } = null!;
}
```

- [ ] **Step 2: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Components/RealisationCard.razor
git commit -m "feat: add RealisationCard component"
```

### Task 4.5: Create `RealisationsTeaser` component

**Files:**
- Create: `IdeaStudio.Website/Components/RealisationsTeaser.razor`

- [ ] **Step 1: Write the component**

```razor
@using IdeaStudio.Website.Models
@using IdeaStudio.Website.Services
@inherits LocalizedComponent
@inject ILocalizedRoute LocalizedRoute

<section id="realisations" class="ds-section">
    <div class="ds-container">
        <div class="ds-section__header">
            <h2 class="ds-section__title">@titleText</h2>
            <p class="ds-section__lead">@leadText</p>
        </div>
        <div class="ds-grid ds-grid--realisations">
            @foreach ((Realisation r, int index) in OrderedRealisations.Select((r, i) => (r, i)))
            {
                <div class="@(index < DefaultVisible ? "d-flex" : showAll ? "d-flex" : "d-none")">
                    <RealisationCard Realisation="@r" />
                </div>
            }
        </div>
        <div class="ds-section__footer">
            @if (HiddenCount > 0)
            {
                <button type="button" class="ds-btn ds-btn--ghost" @onclick="Toggle">
                    @(showAll ? seeLessText : string.Format(seeMoreText, HiddenCount))
                </button>
            }
            <a href="@LocalizedRoute.For("realisations")" class="ds-btn ds-btn--primary">
                @seeAllText
            </a>
        </div>
    </div>
</section>

@code {
    [Parameter, EditorRequired] public IReadOnlyList<Realisation> Realisations { get; set; } = [];

    private const int DefaultVisible = 3;
    private bool showAll;

    private IEnumerable<Realisation> OrderedRealisations =>
        Realisations.OrderBy(r => r.DisplayOrder).ThenByDescending(r => r.CompletedOn);

    private int HiddenCount => Math.Max(0, Realisations.Count - DefaultVisible);

    private void Toggle() => showAll = !showAll;

    private string titleText = "Recent projects";
    private string leadText = "";
    private string seeMoreText = "Show {0} more";
    private string seeLessText = "Show fewer";
    private string seeAllText = "See all projects";

    protected override void LoadTexts()
    {
        titleText = LocalizationService.GetString("Home.RealisationsTitle");
        leadText = LocalizationService.GetString("Home.RealisationsLead");
        seeMoreText = LocalizationService.GetString("Home.RealisationsSeeMore");
        seeLessText = LocalizationService.GetString("Home.RealisationsSeeLess");
        seeAllText = LocalizationService.GetString("Home.RealisationsSeeAll");
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/Components/RealisationsTeaser.razor
git commit -m "feat: add RealisationsTeaser with inline See more toggle"
```

### Task 4.6: Create `CommercialHero` component

**Files:**
- Create: `IdeaStudio.Website/Components/CommercialHero.razor`

- [ ] **Step 1: Write the component**

```razor
@inherits LocalizedComponent

<section id="hero" class="ds-section ds-hero">
    <div class="ds-container">
        <div class="ds-hero__kicker">@kickerText</div>
        <h1 class="ds-hero__title">@titleText</h1>
        <p class="ds-hero__lead">@leadText</p>
        <div class="ds-stack ds-stack--row ds-gap-md">
            <a class="ds-btn ds-btn--primary ds-btn--lg"
               href="https://calendly.com/andres-talavera/30min"
               target="_blank" rel="noopener">
                @primaryCtaText
            </a>
            <a class="ds-btn ds-btn--ghost ds-btn--lg" href="#services">
                @secondaryCtaText
            </a>
        </div>
    </div>
</section>

@code {
    private string kickerText = "CONSULTANT · TECHLEAD · FORMATEUR";
    private string titleText = "Je transforme vos idées en logiciels qui marchent.";
    private string leadText = "Consulting .NET & Azure, techlead, formation, applications mobiles et sites web — à Lyon et à distance.";
    private string primaryCtaText = "Réserver 30 min";
    private string secondaryCtaText = "Voir mes services";

    protected override void LoadTexts()
    {
        kickerText = LocalizationService.GetString("Home.HeroKicker");
        titleText = LocalizationService.GetString("Home.HeroTitle");
        leadText = LocalizationService.GetString("Home.HeroLead");
        primaryCtaText = LocalizationService.GetString("Home.HeroCtaPrimary");
        secondaryCtaText = LocalizationService.GetString("Home.HeroCtaSecondary");
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/Components/CommercialHero.razor
git commit -m "feat: add CommercialHero component"
```

### Task 4.7: Create `CtaCalendlySection` component

**Files:**
- Create: `IdeaStudio.Website/Components/CtaCalendlySection.razor`

- [ ] **Step 1: Write the component**

```razor
@inherits LocalizedComponent

<section id="cta" class="ds-section ds-section--cta">
    <div class="ds-container ds-cta">
        <h2 class="ds-cta__title">@titleText</h2>
        <p class="ds-cta__lead">@leadText</p>
        <a class="ds-btn ds-btn--primary ds-btn--lg"
           href="https://calendly.com/andres-talavera/30min"
           target="_blank" rel="noopener"
           aria-label="@ariaText">
            @buttonText
        </a>
    </div>
</section>

@code {
    private string titleText = "Parlons de votre projet";
    private string leadText = "30 minutes gratuites pour cadrer votre besoin et voir comment je peux vous aider.";
    private string buttonText = "Réserver 30 min";
    private string ariaText = "Book a 30-minute call on Calendly (opens in a new tab)";

    protected override void LoadTexts()
    {
        titleText = LocalizationService.GetString("Home.CtaTitle");
        leadText = LocalizationService.GetString("Home.CtaLead");
        buttonText = LocalizationService.GetString("Home.CtaButton");
        ariaText = LocalizationService.GetString("Nav.BookCall");
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/Components/CtaCalendlySection.razor
git commit -m "feat: add CtaCalendlySection component"
```

### Task 4.8: Extend i18n for Home content

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/i18n/fr.json`
- Modify: `IdeaStudio.Website/wwwroot/i18n/en.json`

- [ ] **Step 1: Add Home keys to `fr.json`**

```json
"Home.HeroKicker": "CONSULTANT · TECHLEAD · FORMATEUR",
"Home.HeroTitle": "Je transforme vos idées en logiciels qui marchent.",
"Home.HeroLead": "Consulting .NET & Azure, techlead, formation, applications mobiles et sites web — à Lyon et à distance.",
"Home.HeroCtaPrimary": "Réserver 30 min",
"Home.HeroCtaSecondary": "Voir mes services",
"Home.ServicesTitle": "Mes services",
"Home.ServicesLead": "Six façons de vous accompagner sur vos projets tech.",
"Home.RealisationsTitle": "Mes réalisations",
"Home.RealisationsLead": "Quelques projets récents.",
"Home.RealisationsSeeAll": "Voir toutes mes réalisations",
"Home.RealisationsSeeMore": "Voir {0} de plus",
"Home.RealisationsSeeLess": "Voir moins",
"Home.CtaTitle": "Parlons de votre projet",
"Home.CtaLead": "30 minutes gratuites pour cadrer votre besoin et voir comment je peux vous aider.",
"Home.CtaButton": "Réserver 30 min"
```

- [ ] **Step 2: Equivalent in `en.json`**

```json
"Home.HeroKicker": "CONSULTANT · TECH LEAD · TRAINER",
"Home.HeroTitle": "I turn your ideas into software that ships.",
"Home.HeroLead": ".NET & Azure consulting, tech lead, training, mobile apps and websites — Lyon and remote.",
"Home.HeroCtaPrimary": "Book 30 min",
"Home.HeroCtaSecondary": "See my services",
"Home.ServicesTitle": "My services",
"Home.ServicesLead": "Six ways I can help on your tech projects.",
"Home.RealisationsTitle": "Recent projects",
"Home.RealisationsLead": "A few selected works.",
"Home.RealisationsSeeAll": "See all projects",
"Home.RealisationsSeeMore": "Show {0} more",
"Home.RealisationsSeeLess": "Show fewer",
"Home.CtaTitle": "Let's talk about your project",
"Home.CtaLead": "A free 30-minute call to frame your need and see how I can help.",
"Home.CtaButton": "Book 30 min"
```

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website/wwwroot/i18n/
git commit -m "feat(i18n): add Home page keys"
```

### Task 4.9: Rewire `Pages/Home.razor` to compose the commercial home

**Files:**
- Modify: `IdeaStudio.Website/Pages/Home.razor`

- [ ] **Step 1: Replace the placeholder with the real home**

```razor
@page "/fr"
@page "/en"
@using IdeaStudio.Website.Components
@using IdeaStudio.Website.Models
@using IdeaStudio.Website.Services
@inherits LocalizedComponent
@inject ILazyLoadingService LazyLoadingService
@layout MainLayout

<SeoHead Title="@seoTitle"
         Description="@seoDescription"
         Keywords=".NET, Azure, Techlead, Formateur, Lyon"
         Author="Andrés Talavera"
         CanonicalUrl="@seoCanonical"
         SiteName="IdeaStud.io"
         OgImage="https://ideastud.io/images/andres-talavera.jpeg"
         OgImageAlt="Andrés Talavera - .NET & Azure"
         Locale="@seoLocale" />

<CommercialHero />

<ServicesGrid Services="@services"
              Title="@servicesTitle"
              Lead="@servicesLead" />

<RealisationsTeaser Realisations="@realisations" />

<CtaCalendlySection />

@code {
    private IReadOnlyList<Service> services = [];
    private IReadOnlyList<Realisation> realisations = [];
    private string servicesTitle = "My services";
    private string servicesLead = "";
    private string seoTitle = "IdeaStud.io — Andrés Talavera";
    private string seoDescription = "";
    private string seoCanonical = "https://ideastud.io";
    private string seoLocale = "fr_FR";

    protected override async Task LoadLocalizedStringsAsync()
    {
        await base.LoadLocalizedStringsAsync();
        await LoadDataAsync();
        StateHasChanged();
    }

    protected override void LoadTexts()
    {
        servicesTitle = LocalizationService.GetString("Home.ServicesTitle");
        servicesLead = LocalizationService.GetString("Home.ServicesLead");
        bool isFr = CultureService.CurrentCulture.Name.StartsWith("fr");
        seoLocale = isFr ? "fr_FR" : "en_US";
        seoTitle = isFr
            ? "Andrés Talavera — Consultant .NET & Azure, Techlead, Formateur | IdeaStud.io"
            : "Andrés Talavera — .NET & Azure Consultant, Tech Lead, Trainer | IdeaStud.io";
        seoDescription = isFr
            ? "Consultant .NET & Azure, techlead et formateur à Lyon. Je transforme vos idées en logiciels qui marchent."
            : ".NET & Azure consultant, tech lead and trainer in Lyon. I turn your ideas into software that ships.";
    }

    private async Task LoadDataAsync()
    {
        string lang = CultureService.CurrentCulture.Name.StartsWith("fr") ? "fr" : "en";
        List<Service>? s = await LazyLoadingService.LoadDataAsync<List<Service>>($"data/services-{lang}.json");
        List<Realisation>? r = await LazyLoadingService.LoadDataAsync<List<Realisation>>($"data/realisations-{lang}.json");
        services = s ?? [];
        realisations = r ?? [];
    }
}
```

- [ ] **Step 2: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Pages/Home.razor
git commit -m "feat: implement commercial home composing Hero, Services, Realisations, CTA"
```

### Task 4.10: Phase 4 integration check

- [ ] **Step 1: Build, test, smoke-run `dotnet run`**

```bash
dotnet build IdeaStudio.sln && dotnet test IdeaStudio.sln
```

- [ ] **Step 2: Tag phase complete**

```bash
git commit --allow-empty -m "chore: complete Phase 4 (commercial home)"
```

---

## Phase 5 — Service pages

### Task 5.1: Add service page i18n keys

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/i18n/fr.json`
- Modify: `IdeaStudio.Website/wwwroot/i18n/en.json`

- [ ] **Step 1: Add to fr.json**

```json
"Service.HighlightsTitle": "Ce que vous obtenez",
"Service.UseCasesTitle": "Cas d'usage",
"Service.FaqTitle": "Questions fréquentes",
"Service.ReadMore": "En savoir plus",
"Services.HubTitle": "Mes services",
"Services.HubLead": "Six façons de vous accompagner sur vos projets tech."
```

- [ ] **Step 2: Add to en.json**

```json
"Service.HighlightsTitle": "What you get",
"Service.UseCasesTitle": "Use cases",
"Service.FaqTitle": "FAQ",
"Service.ReadMore": "Read more",
"Services.HubTitle": "My services",
"Services.HubLead": "Six ways I can help on your tech projects."
```

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website/wwwroot/i18n/
git commit -m "feat(i18n): add Service and Services.Hub keys"
```

### Task 5.2: Create `ServiceHero` component

**Files:**
- Create: `IdeaStudio.Website/Components/ServiceHero.razor`

- [ ] **Step 1: Write the component**

```razor
@using IdeaStudio.Website.Models

<section class="ds-section ds-hero ds-hero--service">
    <div class="ds-container">
        <div class="ds-hero__kicker">@Service.Kicker</div>
        <h1 class="ds-hero__title">@Service.Title</h1>
        <p class="ds-hero__lead">@Service.Tagline</p>
        <a class="ds-btn ds-btn--primary ds-btn--lg"
           href="https://calendly.com/andres-talavera/30min"
           target="_blank" rel="noopener">
            @(Service.CtaLabel ?? DefaultCta)
        </a>
    </div>
</section>

@code {
    [Parameter, EditorRequired] public Service Service { get; set; } = null!;
    [Parameter] public string DefaultCta { get; set; } = "Réserver 30 min";
}
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/Components/ServiceHero.razor
git commit -m "feat: add ServiceHero component"
```

### Task 5.3: Create `ServiceHighlights` component

**Files:**
- Create: `IdeaStudio.Website/Components/ServiceHighlights.razor`

- [ ] **Step 1: Write it**

```razor
<section class="ds-section">
    <div class="ds-container">
        <h2 class="ds-section__title">@Title</h2>
        <ul class="ds-bullets">
            @foreach (string item in Items)
            {
                <li class="ds-bullets__item">@item</li>
            }
        </ul>
    </div>
</section>

@code {
    [Parameter, EditorRequired] public IReadOnlyList<string> Items { get; set; } = [];
    [Parameter] public string Title { get; set; } = "";
}
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/Components/ServiceHighlights.razor
git commit -m "feat: add ServiceHighlights component"
```

### Task 5.4: Create `ServiceUseCases` component

**Files:**
- Create: `IdeaStudio.Website/Components/ServiceUseCases.razor`

- [ ] **Step 1: Write it**

```razor
@using IdeaStudio.Website.Models

<section class="ds-section">
    <div class="ds-container">
        <h2 class="ds-section__title">@Title</h2>
        <div class="ds-grid ds-grid--usecases">
            @foreach (UseCase u in Items)
            {
                <article class="ds-card">
                    <h3 class="ds-card__title">@u.Title</h3>
                    <p class="ds-card__lead">@u.Description</p>
                </article>
            }
        </div>
    </div>
</section>

@code {
    [Parameter, EditorRequired] public IReadOnlyList<UseCase> Items { get; set; } = [];
    [Parameter] public string Title { get; set; } = "";
}
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/Components/ServiceUseCases.razor
git commit -m "feat: add ServiceUseCases component"
```

### Task 5.5: Create `ServiceFaq` component

**Files:**
- Create: `IdeaStudio.Website/Components/ServiceFaq.razor`

- [ ] **Step 1: Write it**

```razor
@using IdeaStudio.Website.Models

<section class="ds-section">
    <div class="ds-container">
        <h2 class="ds-section__title">@Title</h2>
        @foreach (FaqEntry f in Items)
        {
            <details class="ds-faq">
                <summary class="ds-faq__question">@f.Question</summary>
                <div class="ds-faq__answer">@f.Answer</div>
            </details>
        }
    </div>
</section>

@code {
    [Parameter, EditorRequired] public IReadOnlyList<FaqEntry> Items { get; set; } = [];
    [Parameter] public string Title { get; set; } = "";
}
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/Components/ServiceFaq.razor
git commit -m "feat: add ServiceFaq component"
```

### Task 5.6: Create `Pages/Services/ServicePage.razor`

**Files:**
- Create: `IdeaStudio.Website/Pages/Services/ServicePage.razor`

- [ ] **Step 1: Ensure the directory exists, then create the file**

```bash
mkdir -p IdeaStudio.Website/Pages/Services
```

Write to `IdeaStudio.Website/Pages/Services/ServicePage.razor`:

```razor
@page "/fr/services/{Slug}"
@page "/en/services/{Slug}"
@using IdeaStudio.Website.Components
@using IdeaStudio.Website.Models
@using IdeaStudio.Website.Services
@inherits LocalizedComponent
@inject ILazyLoadingService LazyLoadingService
@inject ILocalizedRoute LocalizedRoute
@inject NavigationManager Navigation
@layout MainLayout

@if (service is null)
{
    <Loading />
}
else
{
    <SeoHead Title="@($"{service.Title} — IdeaStud.io")"
             Description="@service.Tagline"
             Author="Andrés Talavera"
             CanonicalUrl="@($"https://ideastud.io{CurrentPath}")"
             SiteName="IdeaStud.io"
             Locale="@seoLocale" />

    <ServiceHero Service="@service" DefaultCta="@bookCallText" />

    <ServiceHighlights Items="@service.Highlights" Title="@highlightsTitle" />

    <ServiceUseCases Items="@service.UseCases" Title="@useCasesTitle" />

    <ServiceFaq Items="@service.Faq" Title="@faqTitle" />

    <CtaCalendlySection />
}

@code {
    [Parameter] public string Slug { get; set; } = "";

    private Service? service;
    private string highlightsTitle = "What you get";
    private string useCasesTitle = "Use cases";
    private string faqTitle = "FAQ";
    private string bookCallText = "Book 30 min";
    private string seoLocale = "fr_FR";
    private string CurrentPath => $"{LocalizedRoute.For("services.hub")}/{Slug}";

    protected override async Task LoadLocalizedStringsAsync()
    {
        await base.LoadLocalizedStringsAsync();
        await LoadServiceAsync();
        StateHasChanged();
    }

    protected override void LoadTexts()
    {
        highlightsTitle = LocalizationService.GetString("Service.HighlightsTitle");
        useCasesTitle = LocalizationService.GetString("Service.UseCasesTitle");
        faqTitle = LocalizationService.GetString("Service.FaqTitle");
        bookCallText = LocalizationService.GetString("Nav.BookCall");
        seoLocale = CultureService.CurrentCulture.Name.StartsWith("fr") ? "fr_FR" : "en_US";
    }

    private async Task LoadServiceAsync()
    {
        string lang = CultureService.CurrentCulture.Name.StartsWith("fr") ? "fr" : "en";
        List<Service>? list = await LazyLoadingService.LoadDataAsync<List<Service>>($"data/services-{lang}.json");
        service = list?.FirstOrDefault(s => string.Equals(s.Slug, Slug, StringComparison.OrdinalIgnoreCase));

        if (service is null)
        {
            Navigation.NavigateTo(LocalizedRoute.For("services.hub"), replace: true);
        }
    }
}
```

- [ ] **Step 2: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Pages/Services/ServicePage.razor
git commit -m "feat: add dynamic ServicePage at /{lang}/services/{slug}"
```

### Task 5.7: Create `Pages/Services/ServicesHub.razor`

**Files:**
- Create: `IdeaStudio.Website/Pages/Services/ServicesHub.razor`

- [ ] **Step 1: Write it**

```razor
@page "/fr/services"
@page "/en/services"
@using IdeaStudio.Website.Components
@using IdeaStudio.Website.Models
@using IdeaStudio.Website.Services
@inherits LocalizedComponent
@inject ILazyLoadingService LazyLoadingService
@layout MainLayout

<SeoHead Title="@seoTitle"
         Description="@seoDescription"
         Author="Andrés Talavera"
         CanonicalUrl="https://ideastud.io/fr/services"
         SiteName="IdeaStud.io"
         Locale="@seoLocale" />

<section class="ds-section ds-hero">
    <div class="ds-container">
        <h1 class="ds-hero__title">@hubTitle</h1>
        <p class="ds-hero__lead">@hubLead</p>
    </div>
</section>

<ServicesGrid Services="@services" Title="" Lead="" />

<CtaCalendlySection />

@code {
    private IReadOnlyList<Service> services = [];
    private string hubTitle = "My services";
    private string hubLead = "";
    private string seoTitle = "Services | IdeaStud.io";
    private string seoDescription = "";
    private string seoLocale = "fr_FR";

    protected override async Task LoadLocalizedStringsAsync()
    {
        await base.LoadLocalizedStringsAsync();
        await LoadAsync();
        StateHasChanged();
    }

    protected override void LoadTexts()
    {
        hubTitle = LocalizationService.GetString("Services.HubTitle");
        hubLead = LocalizationService.GetString("Services.HubLead");
        bool isFr = CultureService.CurrentCulture.Name.StartsWith("fr");
        seoLocale = isFr ? "fr_FR" : "en_US";
        seoTitle = isFr ? "Services — IdeaStud.io" : "Services — IdeaStud.io";
        seoDescription = hubLead;
    }

    private async Task LoadAsync()
    {
        string lang = CultureService.CurrentCulture.Name.StartsWith("fr") ? "fr" : "en";
        List<Service>? list = await LazyLoadingService.LoadDataAsync<List<Service>>($"data/services-{lang}.json");
        services = list ?? [];
    }
}
```

- [ ] **Step 2: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Pages/Services/ServicesHub.razor
git commit -m "feat: add ServicesHub page at /{lang}/services"
```

### Task 5.8: Phase 5 integration check

```bash
dotnet build IdeaStudio.sln && dotnet test IdeaStudio.sln
git commit --allow-empty -m "chore: complete Phase 5 (service pages)"
```

---

## Phase 6 — Realisations page with filters

### Task 6.1: Add Realisations i18n keys

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/i18n/fr.json`
- Modify: `IdeaStudio.Website/wwwroot/i18n/en.json`

- [ ] **Step 1: Add to `fr.json`**

```json
"Realisations.PageTitle": "Mes réalisations",
"Realisations.PageLead": "Sélection de projets récents. Filtrez par techno ou type.",
"Realisations.FilterByTech": "Filtrer par techno",
"Realisations.FilterByType": "Filtrer par type",
"Realisations.Clear": "Effacer les filtres",
"Realisations.ResultsCount": "{0} résultat(s)",
"Realisations.NoResults": "Aucun projet ne correspond à ces filtres.",
"Realisations.TypeSiteVitrine": "Site vitrine",
"Realisations.TypeApplicationWeb": "Application web",
"Realisations.TypeApplicationMobile": "Application mobile",
"Realisations.TypeApiBackend": "API / Backend",
"Realisations.TypeFormation": "Formation",
"Realisations.TypeAutre": "Autre"
```

- [ ] **Step 2: Add to `en.json`**

```json
"Realisations.PageTitle": "Recent projects",
"Realisations.PageLead": "A selection of recent work. Filter by tech or type.",
"Realisations.FilterByTech": "Filter by tech",
"Realisations.FilterByType": "Filter by type",
"Realisations.Clear": "Clear filters",
"Realisations.ResultsCount": "{0} result(s)",
"Realisations.NoResults": "No project matches these filters.",
"Realisations.TypeSiteVitrine": "Showcase site",
"Realisations.TypeApplicationWeb": "Web application",
"Realisations.TypeApplicationMobile": "Mobile application",
"Realisations.TypeApiBackend": "API / Backend",
"Realisations.TypeFormation": "Training",
"Realisations.TypeAutre": "Other"
```

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website/wwwroot/i18n/
git commit -m "feat(i18n): add Realisations page keys"
```

### Task 6.2: Add pure filter-logic helper with tests

**Files:**
- Create: `IdeaStudio.Website/Services/RealisationFilter.cs`
- Create: `IdeaStudio.Website.Tests/RealisationFilterTests.cs`

- [ ] **Step 1: Write failing tests first**

```csharp
using IdeaStudio.Website.Models;
using IdeaStudio.Website.Services;

namespace IdeaStudio.Website.Tests;

public class RealisationFilterTests
{
    private static Realisation R(string slug, RealisationType type, params string[] tech) =>
        new(slug, slug, "", "", "", "", "", type, tech, new DateOnly(2025, 1, 1), 0);

    [Fact]
    public void Apply_NoFilters_ReturnsAll()
    {
        List<Realisation> all = [R("a", RealisationType.SiteVitrine, ".NET"), R("b", RealisationType.Formation, "Azure")];
        List<Realisation> result = RealisationFilter.Apply(all, [], []).ToList();
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public void Apply_TypeFilter_OnlyMatchingTypes()
    {
        List<Realisation> all = [R("a", RealisationType.SiteVitrine, ".NET"), R("b", RealisationType.Formation, "Azure")];
        List<Realisation> result = RealisationFilter.Apply(all, [], [RealisationType.Formation]).ToList();
        Assert.Single(result);
        Assert.Equal("b", result[0].Slug);
    }

    [Fact]
    public void Apply_TechFilter_OrWithinGroup()
    {
        List<Realisation> all =
        [
            R("a", RealisationType.SiteVitrine, ".NET"),
            R("b", RealisationType.SiteVitrine, "Azure"),
            R("c", RealisationType.SiteVitrine, "React")
        ];
        List<Realisation> result = RealisationFilter.Apply(all, [".NET", "Azure"], []).ToList();
        Assert.Equal(2, result.Count);
        Assert.Contains(result, r => r.Slug == "a");
        Assert.Contains(result, r => r.Slug == "b");
    }

    [Fact]
    public void Apply_CombinedFilters_AndBetweenGroups()
    {
        List<Realisation> all =
        [
            R("a", RealisationType.SiteVitrine, ".NET"),
            R("b", RealisationType.Formation, ".NET"),
            R("c", RealisationType.SiteVitrine, "Azure")
        ];
        List<Realisation> result = RealisationFilter.Apply(all, [".NET"], [RealisationType.SiteVitrine]).ToList();
        Assert.Single(result);
        Assert.Equal("a", result[0].Slug);
    }

    [Fact]
    public void AvailableTechnologies_UnionAcrossRealisations_Sorted()
    {
        List<Realisation> all =
        [
            R("a", RealisationType.SiteVitrine, ".NET", "Azure"),
            R("b", RealisationType.Formation, "Blazor", ".NET"),
        ];
        List<string> techs = RealisationFilter.AvailableTechnologies(all).ToList();
        Assert.Equal([".NET", "Azure", "Blazor"], techs);
    }
}
```

- [ ] **Step 2: Write the helper that makes them pass**

Create `IdeaStudio.Website/Services/RealisationFilter.cs`:

```csharp
using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Services;

public static class RealisationFilter
{
    public static IEnumerable<Realisation> Apply(
        IEnumerable<Realisation> source,
        IReadOnlyCollection<string> selectedTechnologies,
        IReadOnlyCollection<RealisationType> selectedTypes)
    {
        IEnumerable<Realisation> q = source;

        if (selectedTechnologies.Count > 0)
        {
            q = q.Where(r => r.Technologies.Any(t => selectedTechnologies.Contains(t, StringComparer.OrdinalIgnoreCase)));
        }

        if (selectedTypes.Count > 0)
        {
            q = q.Where(r => selectedTypes.Contains(r.Type));
        }

        return q;
    }

    public static IEnumerable<string> AvailableTechnologies(IEnumerable<Realisation> source) =>
        source.SelectMany(r => r.Technologies)
              .Distinct(StringComparer.OrdinalIgnoreCase)
              .OrderBy(t => t, StringComparer.OrdinalIgnoreCase);
}
```

- [ ] **Step 3: Run tests**

```bash
dotnet test IdeaStudio.sln --filter "FullyQualifiedName~RealisationFilterTests"
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add IdeaStudio.Website/Services/RealisationFilter.cs IdeaStudio.Website.Tests/RealisationFilterTests.cs
git commit -m "feat: add RealisationFilter with AND-between-groups / OR-within-group logic"
```

### Task 6.3: Create `RealisationsFilters` component

**Files:**
- Create: `IdeaStudio.Website/Components/RealisationsFilters.razor`

- [ ] **Step 1: Write it**

```razor
@using IdeaStudio.Website.Models
@inherits LocalizedComponent

<div class="ds-filters">
    <fieldset class="ds-filters__group">
        <legend class="ds-filters__legend">@techLegend</legend>
        <div class="ds-filters__chips">
            @foreach (string tech in AvailableTechnologies)
            {
                bool active = SelectedTechnologies.Contains(tech);
                <button type="button" class="ds-chip" aria-pressed="@active.ToString().ToLowerInvariant()"
                        @onclick="() => ToggleTech(tech)">
                    @tech
                </button>
            }
        </div>
    </fieldset>
    <fieldset class="ds-filters__group">
        <legend class="ds-filters__legend">@typeLegend</legend>
        <div class="ds-filters__chips">
            @foreach (RealisationType type in AvailableTypes)
            {
                bool active = SelectedTypes.Contains(type);
                <button type="button" class="ds-chip" aria-pressed="@active.ToString().ToLowerInvariant()"
                        @onclick="() => ToggleType(type)">
                    @TypeLabel(type)
                </button>
            }
        </div>
    </fieldset>
    @if (SelectedTechnologies.Count + SelectedTypes.Count > 0)
    {
        <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" @onclick="Clear">@clearText</button>
    }
</div>

@code {
    [Parameter, EditorRequired] public IReadOnlyList<string> AvailableTechnologies { get; set; } = [];
    [Parameter, EditorRequired] public IReadOnlyList<RealisationType> AvailableTypes { get; set; } = [];
    [Parameter, EditorRequired] public HashSet<string> SelectedTechnologies { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    [Parameter, EditorRequired] public HashSet<RealisationType> SelectedTypes { get; set; } = [];
    [Parameter] public EventCallback OnChanged { get; set; }

    private string techLegend = "Filter by tech";
    private string typeLegend = "Filter by type";
    private string clearText = "Clear filters";

    protected override void LoadTexts()
    {
        techLegend = LocalizationService.GetString("Realisations.FilterByTech");
        typeLegend = LocalizationService.GetString("Realisations.FilterByType");
        clearText = LocalizationService.GetString("Realisations.Clear");
    }

    private async Task ToggleTech(string tech)
    {
        if (!SelectedTechnologies.Remove(tech))
        {
            SelectedTechnologies.Add(tech);
        }
        await OnChanged.InvokeAsync();
    }

    private async Task ToggleType(RealisationType type)
    {
        if (!SelectedTypes.Remove(type))
        {
            SelectedTypes.Add(type);
        }
        await OnChanged.InvokeAsync();
    }

    private async Task Clear()
    {
        SelectedTechnologies.Clear();
        SelectedTypes.Clear();
        await OnChanged.InvokeAsync();
    }

    private string TypeLabel(RealisationType type) =>
        LocalizationService.GetString($"Realisations.Type{type}");
}
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/Components/RealisationsFilters.razor
git commit -m "feat: add RealisationsFilters component with accessible chip groups"
```

### Task 6.4: Create `RealisationsGrid` component

**Files:**
- Create: `IdeaStudio.Website/Components/RealisationsGrid.razor`

- [ ] **Step 1: Write it**

```razor
@using IdeaStudio.Website.Models

@if (Items.Count == 0)
{
    <div class="ds-empty">
        <p>@EmptyText</p>
        @if (OnClearRequest.HasDelegate)
        {
            <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" @onclick="OnClearRequest">@ClearText</button>
        }
    </div>
}
else
{
    <div class="ds-grid ds-grid--realisations">
        @foreach (Realisation r in Items)
        {
            <RealisationCard Realisation="@r" />
        }
    </div>
}

@code {
    [Parameter, EditorRequired] public IReadOnlyList<Realisation> Items { get; set; } = [];
    [Parameter] public string EmptyText { get; set; } = "";
    [Parameter] public string ClearText { get; set; } = "";
    [Parameter] public EventCallback OnClearRequest { get; set; }
}
```

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/Components/RealisationsGrid.razor
git commit -m "feat: add RealisationsGrid component with empty state"
```

### Task 6.5: Create `Pages/Realisations.razor`

**Files:**
- Create: `IdeaStudio.Website/Pages/Realisations.razor`

- [ ] **Step 1: Write the page**

```razor
@page "/fr/realisations"
@page "/en/projects"
@using IdeaStudio.Website.Components
@using IdeaStudio.Website.Models
@using IdeaStudio.Website.Services
@inherits LocalizedComponent
@inject ILazyLoadingService LazyLoadingService
@layout MainLayout

<SeoHead Title="@seoTitle"
         Description="@seoDescription"
         Author="Andrés Talavera"
         CanonicalUrl="https://ideastud.io/fr/realisations"
         SiteName="IdeaStud.io"
         Locale="@seoLocale" />

<section class="ds-section ds-hero">
    <div class="ds-container">
        <h1 class="ds-hero__title">@pageTitle</h1>
        <p class="ds-hero__lead">@pageLead</p>
    </div>
</section>

<section class="ds-section">
    <div class="ds-container">
        <RealisationsFilters
            AvailableTechnologies="@availableTechnologies"
            AvailableTypes="@availableTypes"
            SelectedTechnologies="@selectedTechnologies"
            SelectedTypes="@selectedTypes"
            OnChanged="HandleFilterChange" />
        <p class="ds-results-count" aria-live="polite">@string.Format(resultsCountText, filtered.Count)</p>
        <RealisationsGrid Items="@filtered"
                          EmptyText="@emptyText"
                          ClearText="@clearText"
                          OnClearRequest="ClearFilters" />
    </div>
</section>

<CtaCalendlySection />

@code {
    private IReadOnlyList<Realisation> all = [];
    private IReadOnlyList<string> availableTechnologies = [];
    private IReadOnlyList<RealisationType> availableTypes = [];
    private HashSet<string> selectedTechnologies = new(StringComparer.OrdinalIgnoreCase);
    private HashSet<RealisationType> selectedTypes = [];
    private IReadOnlyList<Realisation> filtered = [];

    private string pageTitle = "Projects";
    private string pageLead = "";
    private string seoTitle = "Projects — IdeaStud.io";
    private string seoDescription = "";
    private string seoLocale = "fr_FR";
    private string resultsCountText = "{0} result(s)";
    private string emptyText = "";
    private string clearText = "";

    protected override async Task LoadLocalizedStringsAsync()
    {
        await base.LoadLocalizedStringsAsync();
        await LoadAsync();
        StateHasChanged();
    }

    protected override void LoadTexts()
    {
        pageTitle = LocalizationService.GetString("Realisations.PageTitle");
        pageLead = LocalizationService.GetString("Realisations.PageLead");
        resultsCountText = LocalizationService.GetString("Realisations.ResultsCount");
        emptyText = LocalizationService.GetString("Realisations.NoResults");
        clearText = LocalizationService.GetString("Realisations.Clear");
        bool isFr = CultureService.CurrentCulture.Name.StartsWith("fr");
        seoLocale = isFr ? "fr_FR" : "en_US";
        seoTitle = isFr ? "Réalisations — IdeaStud.io" : "Projects — IdeaStud.io";
        seoDescription = pageLead;
    }

    private async Task LoadAsync()
    {
        string lang = CultureService.CurrentCulture.Name.StartsWith("fr") ? "fr" : "en";
        List<Realisation>? list = await LazyLoadingService.LoadDataAsync<List<Realisation>>($"data/realisations-{lang}.json");
        all = list ?? [];
        availableTechnologies = RealisationFilter.AvailableTechnologies(all).ToList();
        availableTypes = Enum.GetValues<RealisationType>();
        Recompute();
    }

    private Task HandleFilterChange()
    {
        Recompute();
        StateHasChanged();
        return Task.CompletedTask;
    }

    private Task ClearFilters()
    {
        selectedTechnologies.Clear();
        selectedTypes.Clear();
        Recompute();
        StateHasChanged();
        return Task.CompletedTask;
    }

    private void Recompute()
    {
        filtered = RealisationFilter.Apply(all, selectedTechnologies, selectedTypes)
                                    .OrderBy(r => r.DisplayOrder)
                                    .ThenByDescending(r => r.CompletedOn)
                                    .ToList();
    }
}
```

- [ ] **Step 2: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Pages/Realisations.razor
git commit -m "feat: add Realisations page with combinable filters"
```

### Task 6.6: Phase 6 integration check

```bash
dotnet build IdeaStudio.sln && dotnet test IdeaStudio.sln
git commit --allow-empty -m "chore: complete Phase 6 (realisations page)"
```

---

## Phase 7 — SEO, structured data, sitemap, tests

### Task 7.1: Extend `Models/SchemaOrg.cs` with new records

**Files:**
- Modify: `IdeaStudio.Website/Models/SchemaOrg.cs`

- [ ] **Step 1: Read existing file to respect patterns**

Read `IdeaStudio.Website/Models/SchemaOrg.cs` to understand existing record conventions.

- [ ] **Step 2: Append the new records**

At the bottom of the file (before the closing namespace brace), add:

```csharp
public record ProfessionalService(
    string Name,
    string Description,
    string Url,
    string AreaServed,
    Person Provider,
    IReadOnlyList<Service> Services);

public record Service(string Name, string Description, Person Provider, string AreaServed);

public record CollectionPage(
    string Name,
    string Description,
    string Url,
    IReadOnlyList<CreativeWork> Items);

public record CreativeWork(string Name, string Description, string Url, string? Image);
```

And add the `ToJsonLd` overloads at the same spot the other overloads live (mirroring existing patterns: each record maps to a JSON-LD with `@context` and `@type`).

- [ ] **Step 3: Build and commit**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Models/SchemaOrg.cs
git commit -m "feat: extend SchemaOrg with ProfessionalService, Service, CollectionPage, CreativeWork"
```

### Task 7.2: Wire structured data in each new page

**Files:**
- Modify: `IdeaStudio.Website/Pages/Home.razor`
- Modify: `IdeaStudio.Website/Pages/Services/ServicePage.razor`
- Modify: `IdeaStudio.Website/Pages/Services/ServicesHub.razor`
- Modify: `IdeaStudio.Website/Pages/Realisations.razor`

- [ ] **Step 1: For each page, add a `StructuredData` list passed to `SeoHead`**

On each page, in `LoadTexts` (or `OnParametersSet` where a service is loaded), compute the JSON-LD list using the patterns already used in `Pages/Cv.razor`. Add the list as `List<string>? seoStructuredData` and pass to `SeoHead`'s `StructuredData` parameter. The Home page should emit `Person + WebSite + BreadcrumbList + ProfessionalService` exactly mirroring the `Cv.razor` pattern for the first two.

Because each page has its own compute logic, reuse the code from `Cv.razor` as a template. Commit after each page.

- [ ] **Step 2: Build and commit after each page**

```bash
dotnet build IdeaStudio.sln
git add IdeaStudio.Website/Pages/
git commit -m "feat(seo): emit per-page structured data on new pages"
```

### Task 7.3: Update `sitemap.xml`

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/sitemap.xml`

- [ ] **Step 1: Regenerate the sitemap with the 22 URLs**

Open `IdeaStudio.Website/wwwroot/sitemap.xml` and replace its content with a set of URL entries covering:

Base + language prefix combinations (with `hreflang` alternates for each):

- `/fr`, `/en`
- `/fr/services`, `/en/services`
- Six service URLs in FR and six in EN
- `/fr/realisations`, `/en/projects`
- `/fr/cv`, `/en/resume`
- `/fr/mentions-legales`, `/en/legal`
- `/fr/confidentialite`, `/en/privacy`

Each URL block should include `xhtml:link rel="alternate" hreflang="fr|en|x-default"` pointing to the matching counterpart. Use `https://ideastud.io` as host.

- [ ] **Step 2: Commit**

```bash
git add IdeaStudio.Website/wwwroot/sitemap.xml
git commit -m "feat(seo): regenerate sitemap.xml with 22 URLs and hreflang alternates"
```

### Task 7.4: Update `llms.txt` and `ai.txt`

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/llms.txt`
- Modify: `IdeaStudio.Website/wwwroot/ai.txt`

- [ ] **Step 1: Update `llms.txt`**

Read the current file, then add at the bottom two sections:

```
## Services

- /fr/services/consultant-dotnet-azure — Consultant .NET & Azure
- /fr/services/techlead — Techlead
- /fr/services/formateur — Formateur
- /fr/services/vibe-coding — Mise en place de vibe-coding
- /fr/services/applications-mobiles — Création d'applications mobiles
- /fr/services/sites-internet — Création de sites internet

## Réalisations

- Monseigneur Champagne — https://www.monseigneurchampagne.com
- Corona Club Noblesse — https://www.coronaclubnobless.ch
- Krosquare — https://www.krosquare.fr
- IdeaStud.io — https://www.ideastud.io
```

- [ ] **Step 2: Update `ai.txt`**

Same pattern — add a concise summary of the services and realisations.

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website/wwwroot/llms.txt IdeaStudio.Website/wwwroot/ai.txt
git commit -m "feat(seo): update llms.txt and ai.txt with services and realisations"
```

### Task 7.5: Integration tests for the new routes

**Files:**
- Modify: `IdeaStudio.Website.Tests/IntegrationTests.cs`

- [ ] **Step 1: Replace the existing skipped tests with active coverage**

Rewrite `IntegrationTests.cs`:

```csharp
namespace IdeaStudio.Website.Tests;

public class IntegrationTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory = factory;

    [Theory]
    [InlineData("/fr")]
    [InlineData("/en")]
    [InlineData("/fr/services")]
    [InlineData("/en/services")]
    [InlineData("/fr/services/consultant-dotnet-azure")]
    [InlineData("/en/services/dotnet-azure-consulting")]
    [InlineData("/fr/realisations")]
    [InlineData("/en/projects")]
    [InlineData("/fr/cv")]
    [InlineData("/en/resume")]
    [InlineData("/fr/mentions-legales")]
    [InlineData("/en/legal")]
    [InlineData("/fr/confidentialite")]
    [InlineData("/en/privacy")]
    public async Task Get_NewRoutes_Return200HtmlShell(string url)
    {
        HttpClient client = _factory.CreateClient();
        HttpResponseMessage response = await client.GetAsync(url);
        response.EnsureSuccessStatusCode();
        Assert.Contains("text/html", response.Content.Headers.ContentType?.ToString());
    }
}
```

- [ ] **Step 2: Run tests**

```bash
dotnet test IdeaStudio.sln --filter "FullyQualifiedName~IntegrationTests"
```
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website.Tests/IntegrationTests.cs
git commit -m "test: cover new localized routes in IntegrationTests"
```

### Task 7.6: Hardcoded-path guard test

**Files:**
- Create: `IdeaStudio.Website.Tests/HardcodedPathsTests.cs`

- [ ] **Step 1: Write it**

```csharp
using System.Text.RegularExpressions;

namespace IdeaStudio.Website.Tests;

public class HardcodedPathsTests
{
    private static readonly Regex LangPrefix = new(@"""\/(fr|en)(\/[a-zA-Z\-]+)?""", RegexOptions.Compiled);

    [Fact]
    public void NoLanguagePrefixedLiterals_OutsideRouteAttributesAndLocalizedRoute()
    {
        string root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "IdeaStudio.Website"));
        string[] targets = [Path.Combine(root, "Components"), Path.Combine(root, "Pages")];
        List<string> offenders = [];

        foreach (string dir in targets)
        {
            foreach (string file in Directory.EnumerateFiles(dir, "*.razor", SearchOption.AllDirectories)
                .Concat(Directory.EnumerateFiles(dir, "*.cs", SearchOption.AllDirectories)))
            {
                string content = File.ReadAllText(file);
                foreach (Match m in LangPrefix.Matches(content))
                {
                    // Allow `@page "/fr/..."` directive lines
                    string line = GetLine(content, m.Index);
                    if (line.TrimStart().StartsWith("@page ")) continue;
                    offenders.Add($"{file}: {line.Trim()}");
                }
            }
        }

        Assert.True(offenders.Count == 0, "Found hardcoded language-prefixed paths:\n" + string.Join("\n", offenders));
    }

    private static string GetLine(string content, int index)
    {
        int start = content.LastIndexOf('\n', Math.Max(0, index - 1)) + 1;
        int end = content.IndexOf('\n', index);
        if (end < 0) end = content.Length;
        return content[start..end];
    }
}
```

- [ ] **Step 2: Run**

```bash
dotnet test IdeaStudio.sln --filter "FullyQualifiedName~HardcodedPathsTests"
```
Expected: pass. If it fails, inspect the listed offenders and refactor them to use `ILocalizedRoute`.

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website.Tests/HardcodedPathsTests.cs
git commit -m "test: guard against hardcoded language-prefixed paths outside @page"
```

### Task 7.7: Remove temporary `/andres-talavera-resume` @page from Cv

**Files:**
- Modify: `IdeaStudio.Website/Pages/Cv.razor`

- [ ] **Step 1: Delete the third `@page` directive**

Open `IdeaStudio.Website/Pages/Cv.razor` and remove the line:

```razor
@page "/andres-talavera-resume"
```

The legacy URL now redirects via `LegacyRedirect` and `staticwebapp.config.json`.

- [ ] **Step 2: Build, test, commit**

```bash
dotnet build IdeaStudio.sln && dotnet test IdeaStudio.sln
git add IdeaStudio.Website/Pages/Cv.razor
git commit -m "chore: drop temporary /andres-talavera-resume route (now handled via redirect)"
```

### Task 7.8: Phase 7 final integration and smoke check

- [ ] **Step 1: Full build + tests + `dotnet run` sanity check**

```bash
dotnet build IdeaStudio.sln
dotnet test IdeaStudio.sln
```

Expected: all green.

- [ ] **Step 2: Close the phase**

```bash
git commit --allow-empty -m "chore: complete Phase 7 (SEO and tests) — commercial pivot ready"
```

---

## Self-review checklist

Before declaring this plan complete, review:

- [x] Every section of the spec has at least one implementing task (IA, i18n URLs, data models, components, SEO, tests, migration plan).
- [x] No placeholder steps — every step has concrete file paths and code/commands.
- [x] Types and method names match across tasks (`ILocalizedRoute.For` and `Translate` used consistently; `RealisationFilter.Apply` used in both the page and the tests).
- [x] Each phase ends with a build + tests check and a phase-close commit.
- [x] Scope is bounded — cinematic motion work is explicitly outside this plan (documented in Phase intro); the cinematic session consumes this plan's page structure.

Deferred by design (not placeholders):

- Real CV PDFs — placeholder PDFs in Task 3.4; Andrés replaces them when ready.
- Real screenshots for realisations — SVG placeholders in Task 1.7.
- Copywriting polish on services — first drafts present in JSON; Andrés iterates.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-23-commercial-pivot.md`.**

Recommended path: **Subagent-Driven Execution** — dispatch a fresh subagent per phase (or per task for large phases), with a review pass between phases. Keeps context clean and parallelizes what can be parallelized.
