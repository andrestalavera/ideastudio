# Content Revision V3.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single PR that extracts training data into dedicated JSON files, publishes a 20-module training catalogue on `/services/formateur`, adds a new `ia-en-entreprise` / `ai-enterprise` service, expands the home FAQ to 12 Q&A, and updates the locations / Schema.org footprint to reflect Lyon · Paris · Geneva · Fribourg.

**Architecture:** Three logical commits on branch `feature/content-revision-v3-1` (already created). Commit 1 is pure data plumbing (no UI change). Commit 2 fills the catalogue and renders it. Commit 3 ships the FAQ, the new service, multi-cloud highlights, and the locations updates.

**Tech Stack:** Blazor WebAssembly (.NET 10), C# 13, xUnit + Moq + Coverlet, custom SCSS design system, JSON content via `IContentGateway` + `ILazyLoadingService`.

**Spec reference:** `docs/superpowers/specs/2026-04-25-content-revision-v3-1-design.md`

**Cinema impact (note):** the spec section 4.C describes a "C-1" decision to reuse the `vibe-coding` motif for the new service. Inspection of the current V3 codebase shows the cinema runtime is page-agnostic (no `<PageScene>`, no `registerScene`, no per-slug mapping in `wwwroot/src/cinema/`). The motif system from earlier commits (`cb0b5a5 six /services/{slug} signature motifs`) was superseded by later cinema rewrites. **No cinema task is therefore needed** — the new service inherits the same ambient cinema as every other page automatically.

---

## Pre-flight (one-time, before Commit 1)

- [ ] **Step 0.1: Verify branch and clean tree**

Run: `git branch --show-current && git status`
Expected: branch is `feature/content-revision-v3-1`. Working tree clean (or only `.mcp.json` untracked from the user's parallel work — leave it alone).

- [ ] **Step 0.2: Verify build before any change**

Run: `dotnet build IdeaStudio.sln`
Expected: Build succeeds. Note: the first build runs `npm install` + `npm run build` via the `BeforeBuild` MSBuild target.

- [ ] **Step 0.3: Verify tests pass before any change**

Run: `dotnet test IdeaStudio.sln`
Expected: All tests pass. Capture the count for reference (we will be adding tests, not breaking).

---

## Commit 1 — Plumbing data

### Task 1.1: Create the `Training` model

**Files:**
- Create: `IdeaStudio.Website/Models/Training.cs`

- [ ] **Step 1.1.1: Write the model**

Create `IdeaStudio.Website/Models/Training.cs`:

```csharp
namespace IdeaStudio.Website.Models;

/// <summary>
/// A single training module from the public catalogue rendered on /services/formateur.
/// </summary>
public sealed class Training
{
    public required string Slug { get; init; }
    public required string Title { get; init; }
    public required string Summary { get; init; }
    public required string Category { get; init; }      // ".NET" | "Azure" | "Vibe coding & IA" | "Architecture & DevOps"
    public required IReadOnlyList<string> Outline { get; init; }
    public string? Prerequisites { get; init; }
    public int? DurationDays { get; init; }
    public string? Level { get; init; }                  // "foundation" | "intermediate" | "advanced"
    public string? Audience { get; init; }
    public string? Certification { get; init; }
}
```

- [ ] **Step 1.1.2: Verify compile**

Run: `dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj`
Expected: Build succeeds.

### Task 1.2: Extract `trainingCenters` to dedicated JSON

**Files:**
- Create: `IdeaStudio.Website/wwwroot/data/training-centers-fr.json`
- Create: `IdeaStudio.Website/wwwroot/data/training-centers-en.json`
- Modify: `IdeaStudio.Website/wwwroot/data/resume-fr.json` (remove `trainingCenters` block)
- Modify: `IdeaStudio.Website/wwwroot/data/resume-en.json` (remove `trainingCenters` block)

- [ ] **Step 1.2.1: Read the FR `trainingCenters` array**

Run: `grep -n '"trainingCenters"' IdeaStudio.Website/wwwroot/data/resume-fr.json`
Expected: a single line index. Then `Read` the resume-fr.json from that line for ~30-50 lines to capture the full block.

- [ ] **Step 1.2.2: Create `training-centers-fr.json` with the exact extracted array**

Create `IdeaStudio.Website/wwwroot/data/training-centers-fr.json` containing the array (top-level JSON array, not wrapped). Format with 2-space indent matching the rest of `wwwroot/data/`.

- [ ] **Step 1.2.3: Create `training-centers-en.json` similarly**

Repeat steps 1.2.1 and 1.2.2 for `resume-en.json`.

- [ ] **Step 1.2.4: Remove `trainingCenters` from both resume JSON files**

Edit `IdeaStudio.Website/wwwroot/data/resume-fr.json` to delete the `trainingCenters` property (and its enclosing comma where needed). Repeat for `resume-en.json`. Validate JSON parses (`python3 -m json.tool < file.json > /dev/null`).

- [ ] **Step 1.2.5: Verify both files validate as JSON**

Run: `python3 -m json.tool < IdeaStudio.Website/wwwroot/data/resume-fr.json > /dev/null && python3 -m json.tool < IdeaStudio.Website/wwwroot/data/resume-en.json > /dev/null && python3 -m json.tool < IdeaStudio.Website/wwwroot/data/training-centers-fr.json > /dev/null && python3 -m json.tool < IdeaStudio.Website/wwwroot/data/training-centers-en.json > /dev/null && echo OK`
Expected: prints `OK`.

### Task 1.3: Create empty trainings JSON placeholders

**Files:**
- Create: `IdeaStudio.Website/wwwroot/data/trainings-fr.json`
- Create: `IdeaStudio.Website/wwwroot/data/trainings-en.json`

- [ ] **Step 1.3.1: Create `trainings-fr.json` as empty array**

Content:

```json
[]
```

- [ ] **Step 1.3.2: Create `trainings-en.json` as empty array**

Same content. The empty array is intentional — Commit 2 fills it. Tests in this commit accept empty arrays; tests in Commit 2 will assert count = 20.

### Task 1.4: Drop `TrainingCenters` from `Resume` model

**Files:**
- Modify: `IdeaStudio.Website/Models/Resume.cs`

- [ ] **Step 1.4.1: Remove the property and its doc comment**

Replace the file contents with:

```csharp
namespace IdeaStudio.Website.Models;

/// <summary>
/// Represents the about me section of the website
/// </summary>
/// <param name="PersonalInformation">Personal information</param>
/// <param name="AboutSections">About sections</param>
/// <param name="Experiences">Experiences</param>
/// <param name="Languages">Languages</param>
public record Resume
{
    public PersonalInformation? PersonalInformation { get; set; }
    public ICollection<AboutSection>? AboutSections { get; init; }
    public ICollection<Experience>? Experiences { get; set; }
}
```

- [ ] **Step 1.4.2: Verify compile (will fail at consumers — expected)**

Run: `dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj`
Expected: errors at `Pages/Home.razor` and `Pages/Cv.razor` referencing `resume.TrainingCenters`. We fix them in Task 1.6.

### Task 1.5: Add gateway methods

**Files:**
- Modify: `IdeaStudio.Website/Services/IContentGateway.cs`

- [ ] **Step 1.5.1: Add interface methods**

Insert into `IContentGateway` interface (after `GetResumeAsync`):

```csharp
    /// <summary>Returns the trainings catalogue for the given culture.</summary>
    Task<IReadOnlyList<Training>> GetTrainingsAsync(string culture, CancellationToken ct = default);

    /// <summary>Returns the training centers list for the given culture.</summary>
    Task<IReadOnlyList<TrainingCenter>> GetTrainingCentersAsync(string culture, CancellationToken ct = default);
```

- [ ] **Step 1.5.2: Add `JsonContentGateway` implementations**

Insert into `JsonContentGateway` class (after `GetResumeAsync`):

```csharp
    public async Task<IReadOnlyList<Training>> GetTrainingsAsync(string culture, CancellationToken ct = default)
    {
        string lang = Normalize(culture);
        List<Training>? items = await loader.LoadDataAsync<List<Training>>($"data/trainings-{lang}.json", ct);
        return items is null ? Array.Empty<Training>() : items;
    }

    public async Task<IReadOnlyList<TrainingCenter>> GetTrainingCentersAsync(string culture, CancellationToken ct = default)
    {
        string lang = Normalize(culture);
        List<TrainingCenter>? items = await loader.LoadDataAsync<List<TrainingCenter>>($"data/training-centers-{lang}.json", ct);
        return items is null ? Array.Empty<TrainingCenter>() : items;
    }
```

- [ ] **Step 1.5.3: Verify compile (still expects fixes at consumers)**

Run: `dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj`
Expected: same consumer errors as before — gateway compiles cleanly.

### Task 1.6: Update consumers (Home, Cv) to use new gateway methods

**Files:**
- Modify: `IdeaStudio.Website/Pages/Home.razor`
- Modify: `IdeaStudio.Website/Pages/Cv.razor`

- [ ] **Step 1.6.1: Update `Home.razor` `LoadDataAsync` block**

Find this fragment in `Home.razor`:

```csharp
        Resume? resume = await Content.GetResumeAsync(culture);
        trainingCenters = resume?.TrainingCenters?.Take(6).ToArray();
```

Replace with:

```csharp
        Resume? resume = await Content.GetResumeAsync(culture);
        IReadOnlyList<TrainingCenter> centers = await Content.GetTrainingCentersAsync(culture);
        trainingCenters = centers.Take(6).ToArray();
```

- [ ] **Step 1.6.2: Update `Cv.razor`**

`Cv.razor` references `resume?.TrainingCenters` directly in markup at the `<TeachList Centers="@resume?.TrainingCenters" />` line (around line 81). Replace as follows:

In the markup, change:

```razor
<TeachList Centers="@resume?.TrainingCenters" />
```

to:

```razor
<TeachList Centers="@trainingCenters" />
```

In the `@code` block, add a field:

```csharp
    private IReadOnlyList<TrainingCenter>? trainingCenters;
```

In the data-loading method (the one with `resume = await Content.GetResumeAsync(culture);` around line 178), add right after the resume load:

```csharp
        trainingCenters = await Content.GetTrainingCentersAsync(culture);
```

Note: `TeachList.Centers` likely accepts `IEnumerable<TrainingCenter>?`. If the parameter type expects `ICollection<TrainingCenter>?`, adapt the field type to match — read `Components/TeachList.razor` to confirm the parameter signature before committing.

- [ ] **Step 1.6.3: Verify compile clean**

Run: `dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj`
Expected: build succeeds with 0 errors. Warnings from existing code are acceptable; no new warnings allowed.

### Task 1.7: Add gateway tests

**Files:**
- Create: `IdeaStudio.Website.Tests/JsonContentGatewayTests.cs`

- [ ] **Step 1.7.1: Look at existing test patterns**

Read `IdeaStudio.Website.Tests/RealisationFilterTests.cs` to identify the existing xUnit + Moq pattern (mocking `ILazyLoadingService`).

- [ ] **Step 1.7.2: Write the test file**

Create `IdeaStudio.Website.Tests/JsonContentGatewayTests.cs`:

```csharp
using IdeaStudio.Website.Models;
using IdeaStudio.Website.Services;
using Moq;
using Xunit;

namespace IdeaStudio.Website.Tests;

public class JsonContentGatewayTests
{
    [Fact]
    public async Task GetTrainingsAsync_ReturnsList_WhenLoaderReturnsItems()
    {
        Mock<ILazyLoadingService> loader = new();
        List<Training> sample = new() { Sample("a"), Sample("b") };
        loader.Setup(l => l.LoadDataAsync<List<Training>>("data/trainings-fr.json", It.IsAny<CancellationToken>()))
              .ReturnsAsync(sample);
        JsonContentGateway sut = new(loader.Object);

        IReadOnlyList<Training> result = await sut.GetTrainingsAsync("fr-FR");

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetTrainingsAsync_ReturnsEmpty_WhenLoaderReturnsNull()
    {
        Mock<ILazyLoadingService> loader = new();
        loader.Setup(l => l.LoadDataAsync<List<Training>>(It.IsAny<string>(), It.IsAny<CancellationToken>()))
              .ReturnsAsync((List<Training>?)null);
        JsonContentGateway sut = new(loader.Object);

        IReadOnlyList<Training> result = await sut.GetTrainingsAsync("en-US");

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetTrainingsAsync_NormalizesCultureToLang_FrAndEn()
    {
        Mock<ILazyLoadingService> loader = new();
        loader.Setup(l => l.LoadDataAsync<List<Training>>(It.IsAny<string>(), It.IsAny<CancellationToken>()))
              .ReturnsAsync(new List<Training>());
        JsonContentGateway sut = new(loader.Object);

        await sut.GetTrainingsAsync("fr-FR");
        await sut.GetTrainingsAsync("en-US");

        loader.Verify(l => l.LoadDataAsync<List<Training>>("data/trainings-fr.json", It.IsAny<CancellationToken>()), Times.Once);
        loader.Verify(l => l.LoadDataAsync<List<Training>>("data/trainings-en.json", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetTrainingCentersAsync_ReturnsList_WhenLoaderReturnsItems()
    {
        Mock<ILazyLoadingService> loader = new();
        List<TrainingCenter> sample = new() { new TrainingCenter { Name = "Center A" } };
        loader.Setup(l => l.LoadDataAsync<List<TrainingCenter>>("data/training-centers-fr.json", It.IsAny<CancellationToken>()))
              .ReturnsAsync(sample);
        JsonContentGateway sut = new(loader.Object);

        IReadOnlyList<TrainingCenter> result = await sut.GetTrainingCentersAsync("fr-FR");

        Assert.Single(result);
    }

    [Fact]
    public async Task GetTrainingCentersAsync_ReturnsEmpty_WhenLoaderReturnsNull()
    {
        Mock<ILazyLoadingService> loader = new();
        loader.Setup(l => l.LoadDataAsync<List<TrainingCenter>>(It.IsAny<string>(), It.IsAny<CancellationToken>()))
              .ReturnsAsync((List<TrainingCenter>?)null);
        JsonContentGateway sut = new(loader.Object);

        IReadOnlyList<TrainingCenter> result = await sut.GetTrainingCentersAsync("en-US");

        Assert.Empty(result);
    }

    private static Training Sample(string slug) => new()
    {
        Slug = slug,
        Title = slug,
        Summary = "summary",
        Category = ".NET",
        Outline = new[] { "a", "b" },
    };
}
```

Note: if the `TrainingCenter` record exposes a different required-property surface, adjust the constructor in the `Sample` test factories to satisfy the compiler. Check `IdeaStudio.Website/Models/TrainingCenter.cs` for required properties before writing.

- [ ] **Step 1.7.3: Verify tests pass**

Run: `dotnet test IdeaStudio.sln --filter FullyQualifiedName~JsonContentGatewayTests`
Expected: all 5 tests green.

### Task 1.8: Add IntegrationTests assertions for new JSON files

**Files:**
- Modify: `IdeaStudio.Website.Tests/IntegrationTests.cs`

- [ ] **Step 1.8.1: Identify the route/asset assertion list**

Read `IntegrationTests.cs` to find where existing `data/*.json` files are asserted (the test boots the published WASM static output and HTTP-fetches assets).

- [ ] **Step 1.8.2: Add assertions for the 4 new JSON files**

Inside whichever `[Fact]` or `[Theory]` lists data files, append these 4 paths to the test data:

```csharp
"_framework/data/trainings-fr.json",
"_framework/data/trainings-en.json",
"_framework/data/training-centers-fr.json",
"_framework/data/training-centers-en.json",
```

The exact asset URL prefix and the test wrapper naming depend on the existing test — adapt to match.

- [ ] **Step 1.8.3: Verify integration tests still pass**

Run: `dotnet test IdeaStudio.sln`
Expected: all tests green, including the extended IntegrationTests.

### Task 1.9: Final verification + Commit 1

- [ ] **Step 1.9.1: Full build & test**

Run: `dotnet build IdeaStudio.sln && dotnet test IdeaStudio.sln`
Expected: build succeeds, all tests pass.

- [ ] **Step 1.9.2: Manually smoke-test the home/cv pages**

Run: `dotnet watch run --project IdeaStudio.Website/IdeaStudio.Website.csproj`. Open `http://localhost:5XXX/fr` and `/fr/cv`. Verify training centers render exactly as before. Stop the watcher with Ctrl-C.

- [ ] **Step 1.9.3: Stage and commit**

Run:

```bash
git add \
  IdeaStudio.Website/Models/Training.cs \
  IdeaStudio.Website/Models/Resume.cs \
  IdeaStudio.Website/Services/IContentGateway.cs \
  IdeaStudio.Website/Pages/Home.razor \
  IdeaStudio.Website/Pages/Cv.razor \
  IdeaStudio.Website/wwwroot/data/trainings-fr.json \
  IdeaStudio.Website/wwwroot/data/trainings-en.json \
  IdeaStudio.Website/wwwroot/data/training-centers-fr.json \
  IdeaStudio.Website/wwwroot/data/training-centers-en.json \
  IdeaStudio.Website/wwwroot/data/resume-fr.json \
  IdeaStudio.Website/wwwroot/data/resume-en.json \
  IdeaStudio.Website.Tests/JsonContentGatewayTests.cs \
  IdeaStudio.Website.Tests/IntegrationTests.cs

git commit -m "$(cat <<'EOF'
feat(data): extract training centers + introduce trainings catalogue plumbing

- New Training model and JSON files (trainings-{fr,en}.json placeholder, training-centers-{fr,en}.json extracted from resume)
- Drop TrainingCenters from Resume model
- Add GetTrainingsAsync / GetTrainingCentersAsync to IContentGateway + JsonContentGateway
- Switch Home + CV consumers to the new gateway methods
- Add JsonContentGatewayTests covering both new methods

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 1.9.4: Checkpoint A — diff stat review**

Run: `git diff --stat HEAD~1..HEAD`
Visually verify: only the 13 files listed above are touched. Resume JSON delta is small (just the `trainingCenters` block removed). Centers JSON delta is small (just the extracted block).

---

## Commit 2 — Publish 20-module training catalogue

### Task 2.1: Add `Course` Schema.org record

**Files:**
- Modify: `IdeaStudio.Website/Models/SchemaOrg.cs`

- [ ] **Step 2.1.1: Append the Course record**

Insert before the closing `}` of the `SchemaOrg` static class:

```csharp
    /// <summary>
    /// Schema.org Course for educational programs (training catalogue).
    /// </summary>
    public record Course(
        string Name,
        string Description,
        Person Provider,
        string? CourseCode = null,
        string? EducationalLevel = null,
        string? TimeRequired = null,
        string? Url = null)
    {
        [JsonPropertyName("@context")]
        public string Context => "https://schema.org";

        [JsonPropertyName("@type")]
        public string Type => "Course";
    }
```

- [ ] **Step 2.1.2: Verify compile**

Run: `dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj`
Expected: build succeeds.

### Task 2.2: Fill `trainings-fr.json` with 20 modules

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/data/trainings-fr.json`

- [ ] **Step 2.2.1: Replace the empty array with the 20 modules**

The full content is sourced from the spec (section 3 — module list). Use the FR title, summary, outline, prerequisites, durationDays, level, certification fields. Set `category` to one of `.NET`, `Azure`, `Vibe coding & IA`, `Architecture & DevOps`. Order in the file: same as the spec list (1 through 20). Sample for module #1 (`csharp-modern`):

```jsonc
{
  "slug": "csharp-modern",
  "title": "C# moderne (records, source generators, pattern matching)",
  "summary": "Maîtriser les fonctionnalités modernes de C# pour écrire du code expressif et performant : records, primary constructors, file-scoped types, source generators, pattern matching avancé.",
  "category": ".NET",
  "outline": [
    "Records et types valeurs immuables",
    "Primary constructors et init-only",
    "File-scoped types et compilation incrémentale",
    "Pattern matching avancé et switch expressions",
    "Source generators — bases",
    "Async, ValueTask et performance"
  ],
  "prerequisites": "C# de base, lecture de code orienté objet.",
  "durationDays": 2,
  "level": "foundation"
}
```

Pattern repeats for the 19 others. Modules with `certification` (only #7 AZ-204, #8 AZ-400) include the `"certification"` field; others omit it (model property is nullable).

- [ ] **Step 2.2.2: Validate JSON**

Run: `python3 -m json.tool < IdeaStudio.Website/wwwroot/data/trainings-fr.json | jq 'length'`
Expected: `20`.

### Task 2.3: Fill `trainings-en.json` with 20 modules (parity)

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/data/trainings-en.json`

- [ ] **Step 2.3.1: Replace the empty array with the 20 EN modules**

Same structure as FR; use EN title / summary / outline / prerequisites from the spec. Slugs use the EN convention from the spec list (e.g. `csharp-modern`, `aspnet-core-fundamentals`, `azure-az204-prep`, `claude-code-team`, etc. — most are stable across languages, but the FR-specific ones get the EN spec slug).

Note: the spec lists slugs in EN form already for most modules. Use those directly.

- [ ] **Step 2.3.2: Validate JSON length**

Run: `python3 -m json.tool < IdeaStudio.Website/wwwroot/data/trainings-en.json | jq 'length'`
Expected: `20`.

- [ ] **Step 2.3.3: Verify slug parity FR↔EN**

Run:

```bash
diff <(jq -r '.[].slug' IdeaStudio.Website/wwwroot/data/trainings-fr.json | sort) \
     <(jq -r '.[].slug' IdeaStudio.Website/wwwroot/data/trainings-en.json | sort)
```

Expected: empty diff. Slugs are stable across languages by design.

### Task 2.4: Create `TrainingCatalogue` component

**Files:**
- Create: `IdeaStudio.Website/Components/TrainingCatalogue.razor`

- [ ] **Step 2.4.1: Write the component**

Create `Components/TrainingCatalogue.razor`:

```razor
@using IdeaStudio.Website.Models
@inherits LocalizedComponent

@{
    string[] orderedCategories = new[] { ".NET", "Azure", "Vibe coding & IA", "Architecture & DevOps" };
    var grouped = orderedCategories
        .Select(cat => (Category: cat, Items: Trainings.Where(t => t.Category == cat).ToArray()))
        .Where(g => g.Items.Length > 0)
        .ToArray();
}

<div class="ds-training-catalogue">
    @foreach (var group in grouped)
    {
        <section class="ds-training-catalogue__group" data-reveal>
            <h3 class="ds-training-catalogue__category">@group.Category</h3>
            <ul class="ds-training-catalogue__list">
                @foreach (Training t in group.Items)
                {
                    <li class="ds-training-card">
                        <header class="ds-training-card__head">
                            <h4 class="ds-training-card__title">@t.Title</h4>
                            <div class="ds-training-card__pills">
                                @if (t.DurationDays is int days)
                                {
                                    <span class="ds-training-card__pill">@days@durationSuffix</span>
                                }
                                @if (!string.IsNullOrWhiteSpace(t.Level))
                                {
                                    <span class="ds-training-card__pill">@FormatLevel(t.Level)</span>
                                }
                                @if (!string.IsNullOrWhiteSpace(t.Certification))
                                {
                                    <span class="ds-training-card__pill ds-training-card__pill--cert">@t.Certification</span>
                                }
                            </div>
                        </header>
                        <p class="ds-training-card__summary">@t.Summary</p>
                        @if (t.Outline is { Count: > 0 })
                        {
                            <ul class="ds-training-card__outline">
                                @foreach (string item in t.Outline)
                                {
                                    <li>@item</li>
                                }
                            </ul>
                        }
                        @if (!string.IsNullOrWhiteSpace(t.Prerequisites))
                        {
                            <p class="ds-training-card__prereq">
                                <span class="ds-training-card__prereq-label">@prereqLabel</span> @t.Prerequisites
                            </p>
                        }
                    </li>
                }
            </ul>
        </section>
    }
</div>

@code {
    [Parameter, EditorRequired] public IReadOnlyList<Training> Trainings { get; set; } = Array.Empty<Training>();

    private string durationSuffix = "j";
    private string prereqLabel = "Prérequis :";

    protected override void LoadTexts()
    {
        bool fr = CultureService.CurrentCulture.Name.StartsWith("fr");
        durationSuffix = fr ? "j" : "d";
        prereqLabel    = fr ? "Prérequis :" : "Prerequisites:";
    }

    private string FormatLevel(string? level) => level switch
    {
        "foundation"   => CultureService.CurrentCulture.Name.StartsWith("fr") ? "Fondations" : "Foundations",
        "intermediate" => CultureService.CurrentCulture.Name.StartsWith("fr") ? "Intermédiaire" : "Intermediate",
        "advanced"     => CultureService.CurrentCulture.Name.StartsWith("fr") ? "Avancé" : "Advanced",
        _              => level ?? string.Empty,
    };
}
```

### Task 2.5: SCSS for the catalogue

**Files:**
- Create: `IdeaStudio.Website/wwwroot/scss/components/_training-catalogue.scss`
- Modify: `IdeaStudio.Website/wwwroot/scss/styles.scss`

- [ ] **Step 2.5.1: Look at neighbouring SCSS**

Read 1-2 existing partials in `wwwroot/scss/components/` (e.g. `_card.scss`, `_qa-block.scss`, `_editorial-list.scss`) to match indentation, BEM conventions, and token usage (`var(--ds-...)`).

- [ ] **Step 2.5.2: Write the partial**

Create `wwwroot/scss/components/_training-catalogue.scss`:

```scss
.ds-training-catalogue {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-2xl, 4rem);
    margin-block-start: 3rem;

    &__group {
        display: flex;
        flex-direction: column;
        gap: var(--ds-space-lg, 2rem);
    }

    &__category {
        font: var(--ds-type-h3, 600 1.5rem/1.2 var(--ds-font-display, system-ui));
        letter-spacing: var(--ds-tracking-tight, -0.01em);
        margin: 0;
        padding-block-end: 0.75rem;
        border-block-end: 1px solid var(--ds-border-subtle, rgba(255, 255, 255, 0.12));
    }

    &__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: var(--ds-space-lg, 2rem);

        @media (min-width: 56rem) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }
}

.ds-training-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem;
    border: 1px solid var(--ds-border-subtle, rgba(255, 255, 255, 0.12));
    border-radius: var(--ds-radius-md, 0.75rem);
    background: var(--ds-surface-1, rgba(255, 255, 255, 0.02));

    &__head {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    &__title {
        font: var(--ds-type-h4, 600 1.125rem/1.3 var(--ds-font-display, system-ui));
        margin: 0;
        color: var(--ds-text-strong, #fff);
    }

    &__pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
    }

    &__pill {
        display: inline-flex;
        align-items: center;
        padding: 0.125rem 0.5rem;
        font: var(--ds-type-mono-xs, 500 0.75rem/1 var(--ds-font-mono, ui-monospace));
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ds-text-muted, rgba(255, 255, 255, 0.7));
        border: 1px solid var(--ds-border-subtle, rgba(255, 255, 255, 0.12));
        border-radius: 9999px;

        &--cert {
            color: var(--ds-accent, #c8a85a);
            border-color: currentColor;
        }
    }

    &__summary {
        font: var(--ds-type-body, 400 1rem/1.5 var(--ds-font-body, system-ui));
        color: var(--ds-text-default, rgba(255, 255, 255, 0.85));
        margin: 0;
    }

    &__outline {
        margin: 0;
        padding-inline-start: 1.25rem;
        font-size: 0.95rem;
        color: var(--ds-text-default, rgba(255, 255, 255, 0.85));

        li {
            margin-block: 0.25rem;
        }
    }

    &__prereq {
        font-size: 0.875rem;
        color: var(--ds-text-muted, rgba(255, 255, 255, 0.6));
        margin: 0;
        padding-block-start: 0.5rem;
        border-block-start: 1px dashed var(--ds-border-subtle, rgba(255, 255, 255, 0.08));
    }

    &__prereq-label {
        font-weight: 600;
        color: var(--ds-text-default, rgba(255, 255, 255, 0.75));
    }
}
```

Token names use the project's `--ds-*` family with conservative fallbacks. Adjust to actual token names found in `wwwroot/scss/tokens/` if they differ.

- [ ] **Step 2.5.3: Import the partial**

Open `wwwroot/scss/styles.scss` and add (preserving the alphabetical / grouped pattern of the existing imports):

```scss
@use 'components/training-catalogue';
```

(or the equivalent `@import` if that's the convention used by the existing file — match what's already there.)

- [ ] **Step 2.5.4: Compile SCSS**

Run: `cd IdeaStudio.Website && npm run compile-styles && cd ..`
Expected: success, `wwwroot/css/styles.min.css` updated.

### Task 2.6: Wire `ServiceDetail.razor` to render the catalogue

**Files:**
- Modify: `IdeaStudio.Website/Pages/ServiceDetail.razor`

- [ ] **Step 2.6.1: Add a `trainings` field and load conditionally**

Find the `@code` block start `private ServiceModel? service;`. Add below it:

```csharp
    private IReadOnlyList<Training> trainings = Array.Empty<Training>();
```

In `LoadServiceAsync`, after `service = all.FirstOrDefault(...);` and `if (service is not null)` block, append:

```csharp
        if (service?.Slug == "formateur")
        {
            trainings = await Content.GetTrainingsAsync(culture);
        }
```

- [ ] **Step 2.6.2: Add the catalogue section render**

Right before the closing `}` of the `else` block (after the FAQ section, around line 92), insert:

```razor
    @* Training catalogue (formateur only) *@
    @if (service is not null && service.Slug == "formateur" && trainings is { Count: > 0 })
    {
        <section class="ds-section ds-section--chapter ds-section--bordered">
            <div class="ds-container">
                <ChapterBand Kicker="@catalogueKicker" Title="@catalogueTitle" />
                <TrainingCatalogue Trainings="@trainings" />
            </div>
        </section>
    }
```

- [ ] **Step 2.6.3: Add the localized strings**

In `@code` declarations, add:

```csharp
    private string catalogueKicker = "Catalogue";
    private string catalogueTitle = "20 modules pour vos équipes.";
```

In `LoadTexts()`:

```csharp
        catalogueKicker = fr ? "Catalogue" : "Catalogue";
        catalogueTitle  = fr ? "20 modules pour vos équipes." : "20 modules for your teams.";
```

### Task 2.7: Emit `Course[]` JSON-LD on `/services/formateur`

**Files:**
- Modify: `IdeaStudio.Website/Pages/ServiceDetail.razor` (`GenerateStructuredData` method)

- [ ] **Step 2.7.1: Append Course array generation after the existing service JSON-LD**

In `GenerateStructuredData`, after the `if (service is not null)` block (after the FAQ JSON-LD addition), append:

```csharp
            if (service.Slug == "formateur" && trainings is { Count: > 0 })
            {
                foreach (Training t in trainings)
                {
                    SchemaOrg.Course course = new(
                        Name: t.Title,
                        Description: t.Summary,
                        Provider: person,
                        CourseCode: t.Slug,
                        EducationalLevel: t.Level,
                        TimeRequired: t.DurationDays is int d ? $"P{d}D" : null,
                        Url: $"https://ideastud.io{LocalizedRoute.For("services.hub", cultureCode)}/formateur#{t.Slug}");
                    blocks.Add(SchemaOrg.ToJsonLd(course));
                }
            }
```

`P{d}D` is ISO-8601 duration format ("PnD" = n days).

### Task 2.8: Tests for catalogue

**Files:**
- Modify: `IdeaStudio.Website.Tests/JsonContentGatewayTests.cs` (or new `TrainingCatalogueTests.cs` if rendering tests warranted)

- [ ] **Step 2.8.1: Update parity test**

Add to `JsonContentGatewayTests` an integration-style test that loads the actual JSON files and asserts:

```csharp
    [Fact]
    public void TrainingsJson_HasTwentyModules_InBothLanguages()
    {
        string root = AppContext.BaseDirectory;
        string fr = Path.Combine(root, "..", "..", "..", "..", "IdeaStudio.Website", "wwwroot", "data", "trainings-fr.json");
        string en = Path.Combine(root, "..", "..", "..", "..", "IdeaStudio.Website", "wwwroot", "data", "trainings-en.json");
        List<Training>? frItems = System.Text.Json.JsonSerializer.Deserialize<List<Training>>(File.ReadAllText(fr),
            new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web));
        List<Training>? enItems = System.Text.Json.JsonSerializer.Deserialize<List<Training>>(File.ReadAllText(en),
            new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web));

        Assert.Equal(20, frItems?.Count);
        Assert.Equal(20, enItems?.Count);

        IEnumerable<string> frSlugs = frItems!.Select(t => t.Slug).OrderBy(s => s);
        IEnumerable<string> enSlugs = enItems!.Select(t => t.Slug).OrderBy(s => s);
        Assert.Equal(frSlugs, enSlugs);
    }
```

The relative path may need adjustment depending on the test project's output directory. Use `Path.GetFullPath` in a debugger if needed.

- [ ] **Step 2.8.2: Run the new test**

Run: `dotnet test IdeaStudio.sln --filter FullyQualifiedName~TrainingsJson_HasTwentyModules`
Expected: pass.

### Task 2.9: Final verification + Commit 2

- [ ] **Step 2.9.1: Full build & test**

Run: `dotnet build IdeaStudio.sln && dotnet test IdeaStudio.sln`
Expected: green.

- [ ] **Step 2.9.2: Manual visual smoke**

Run: `dotnet watch run --project IdeaStudio.Website/IdeaStudio.Website.csproj`. Open `/fr/services/formateur` and `/en/services/formateur`. Verify the catalogue renders, modules group by category, pills appear, outlines visible. Resize to 375 px width (DevTools mobile mode) — single-column layout still readable.

- [ ] **Step 2.9.3: Commit 2**

```bash
git add \
  IdeaStudio.Website/Models/SchemaOrg.cs \
  IdeaStudio.Website/wwwroot/data/trainings-fr.json \
  IdeaStudio.Website/wwwroot/data/trainings-en.json \
  IdeaStudio.Website/Components/TrainingCatalogue.razor \
  IdeaStudio.Website/wwwroot/scss/components/_training-catalogue.scss \
  IdeaStudio.Website/wwwroot/scss/styles.scss \
  IdeaStudio.Website/wwwroot/css/styles.min.css \
  IdeaStudio.Website/Pages/ServiceDetail.razor \
  IdeaStudio.Website.Tests/JsonContentGatewayTests.cs

git commit -m "$(cat <<'EOF'
feat(formateur): publish 20-module training catalogue

- Fill trainings-{fr,en}.json with 20 modules across .NET / Azure / Vibe coding & IA / Architecture & DevOps
- New Components/TrainingCatalogue.razor + SCSS partial rendering grouped cards with pills
- ServiceDetail loads trainings + renders catalogue when slug == formateur
- Emit Schema.org Course[] JSON-LD per module on /services/formateur
- Test parity FR/EN slugs, count = 20

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 2.9.4: Checkpoint B — visual screenshots (manual review point)**

Take 4 screenshots: `/fr/services/formateur` desktop + mobile, `/en/services/formateur` desktop + mobile. Save to `/tmp/` or attach in the eventual PR description. If layout breaks on mobile or the grouping is visually off, fix BEFORE Commit 3 (don't move forward with broken visuals).

---

## Commit 3 — FAQ + ai-enterprise + locations

### Task 3.1: Extend `Person` schema with `WorkLocation`

**Files:**
- Modify: `IdeaStudio.Website/Models/SchemaOrg.cs`

- [ ] **Step 3.1.1: Add `Place` record**

Insert after the `PostalAddress` record:

```csharp
    /// <summary>
    /// Schema.org Place — a generic location with a postal address.
    /// </summary>
    public record Place(PostalAddress Address)
    {
        [JsonPropertyName("@type")]
        public string Type => "Place";
    }
```

- [ ] **Step 3.1.2: Add `WorkLocation` to `Person`**

Replace the `Person` record signature with this expanded version (the new parameter is appended at the end so it doesn't break existing positional construction calls):

```csharp
    public record Person(
        string Name,
        string? JobTitle = null,
        string? Description = null,
        string? Url = null,
        string? Image = null,
        string[]? SameAs = null,
        string[]? KnowsAbout = null,
        PostalAddress? Address = null,
        Organization? WorksFor = null,
        string? Email = null,
        string? Telephone = null,
        Place[]? WorkLocation = null)
    {
        [JsonPropertyName("@context")]
        public string Context => "https://schema.org";

        [JsonPropertyName("@type")]
        public string Type => "Person";
    }
```

- [ ] **Step 3.1.3: Verify compile**

Run: `dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj`
Expected: build succeeds.

### Task 3.2: Update `services-fr.json`

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/data/services-fr.json`

- [ ] **Step 3.2.1: Enrich `vibe-coding`**

In the `vibe-coding` entry, replace the `tagline`, `highlights`, `useCases`, `faq` per the spec section 4. Add the pricing FAQ entry (TJM 800 €). Refer to spec for exact wording.

- [ ] **Step 3.2.2: Add multi-cloud bullet to `consultant-dotnet-azure`**

Append to its `highlights` array:

```json
"Multi-cloud opérationnel — Netlify, Vercel, Scaleway, CleverCloud, Infomaniak, OVHCloud quand le contexte ne pousse pas vers Azure"
```

- [ ] **Step 3.2.3: Add multi-cloud bullet to `sites-internet`**

Append to its `highlights` array:

```json
"Hébergement adapté — Azure, Netlify, Vercel, Scaleway, CleverCloud, Infomaniak ou OVHCloud selon le contexte projet"
```

- [ ] **Step 3.2.4: Add multi-cloud bullet to `applications-mobiles`**

Append to its `highlights` array:

```json
"Backend hébergé sur Azure ou alternative européenne — Scaleway, OVHCloud, Infomaniak"
```

- [ ] **Step 3.2.5: Add new `formateur` pricing FAQ entry**

Append to its `faq` array:

```json
{ "question": "Quel est votre TJM en formation ?", "answer": "800 € — TJM × jours dispensés, ou forfait inter / intra selon le format." }
```

- [ ] **Step 3.2.6: Insert new `ia-en-entreprise` service at order 5**

Insert the full FR JSON for `ia-en-entreprise` (from the spec section 4) into the `services-fr.json` array, **between** the `vibe-coding` (order 4) and `applications-mobiles` (currently order 5) entries.

- [ ] **Step 3.2.7: Renumber existing `applications-mobiles` to order 6 and `sites-internet` to order 7**

In each entry, change `"order": 5` to `"order": 6` (mobile) and `"order": 6` to `"order": 7` (web). Verify final orders 1-7 are unique and consecutive.

- [ ] **Step 3.2.8: Validate JSON**

Run: `python3 -m json.tool < IdeaStudio.Website/wwwroot/data/services-fr.json | jq 'length'`
Expected: `7`. Then `jq '[.[].order]' IdeaStudio.Website/wwwroot/data/services-fr.json` → `[1,2,3,4,5,6,7]`.

### Task 3.3: Update `services-en.json`

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/data/services-en.json`

- [ ] **Step 3.3.1: Mirror all FR changes in EN**

Apply the equivalent changes from Task 3.2 to `services-en.json` using the EN copy from the spec. The EN slug for the new service is `ai-enterprise`. The other slugs follow the existing EN convention (`dotnet-azure-consulting`, `tech-lead`, `trainer`, `vibe-coding`, `mobile-apps`, `websites` — verify by reading the file first).

- [ ] **Step 3.3.2: Validate JSON length & order parity**

Run: `python3 -m json.tool < IdeaStudio.Website/wwwroot/data/services-en.json | jq '[.[].order]'`
Expected: `[1,2,3,4,5,6,7]`.

### Task 3.4: Add slug pair to `ai.txt`

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/ai.txt`

- [ ] **Step 3.4.1: Add the FR + EN entries for the new service**

Insert two new entries in the `services` array (FR after vibe-coding, EN after vibe-coding):

```jsonc
{ "slug": "ia-en-entreprise", "lang": "fr", "title": "IA en entreprise", "url": "https://ideastud.io/fr/services/ia-en-entreprise" },
{ "slug": "ai-enterprise", "lang": "en", "title": "AI for the enterprise", "url": "https://ideastud.io/en/services/ai-enterprise" },
```

### Task 3.5: Expand the home FAQ to 12 Q&A

**Files:**
- Modify: `IdeaStudio.Website/Pages/Home.razor`

- [ ] **Step 3.5.1: Replace the FR `faq` initialization**

Find the `faq = fr ? new() { ... }` block (currently 3 entries). Replace with 12 entries (FR copy from spec section 5):

```csharp
        faq = fr
            ? new() {
                ("Quels projets acceptez-vous ?", "Des missions de consulting, techlead, formation, vibe coding, IA en entreprise, ou des réalisations sur-mesure — .NET, Azure, mobile, web. Si le cadrage est clair et le délai sain, j'y vais."),
                ("Quels sont vos tarifs ?", "TJM 600 € en consulting et techlead, 800 € en formation, vibe coding et IA entreprise. Ajusté selon durée, complexité et niveau d'implication. Cadrage initial gratuit."),
                ("Où pouvez-vous intervenir ?", "Lyon, Paris, Genève, Fribourg — sur site, hybride ou full-remote selon votre besoin. Je me déplace volontiers pour les kick-offs, les ateliers techniques et les sessions de formation."),
                ("Comment me commander une mission ?", "Je travaille en portage salarial via OpenWork (société française). Facturation en EUR par défaut ; CHF possible pour les missions côté suisse. Pas de prestation directe — le portage simplifie le contractuel pour vous comme pour moi."),
                ("Quelles formations dispensez-vous ?", "Vingt modules au catalogue, regroupés en quatre familles : .NET, Azure, vibe coding & IA, architecture & DevOps. Chaque module se décline en inter ou intra. Détail sur la fiche Formateur."),
                ("Vous installez de l'IA en interne chez nous ?", "Oui — modèles open-weight (Llama, Qwen, Mistral) hébergés localement avec Ollama ou vLLM, intégrés à vos outils existants. Détail sur la fiche IA en entreprise."),
                ("Vous savez créer des serveurs MCP ?", "Oui — c'est un livrable courant des missions IA en entreprise. Un serveur MCP custom expose votre SI ou votre base de connaissance aux IA des dev (Claude Code, Cursor, Copilot)."),
                ("Quels outils IA utilisez-vous au quotidien ?", "Claude Code en orchestrateur principal, Cursor pour le pair-programming au plus près du code, GitHub Copilot pour l'autocomplétion fine, Antigravity + Gemini quand un browser-side agent est utile. Le choix dépend du contexte client."),
                ("Comment garantissez-vous la qualité du code généré par IA ?", "Aucune ligne générée n'est mergée sans relecture. Je diffe, je raisonne, je corrige — la productivité IA n'est utile que si elle ne crée pas de dette cachée. Cette méthodologie est au cœur de mes missions vibe-coding."),
                ("Vous configurez des analytics multi-régies ?", "Oui — Google Analytics 4, Bing Webmaster, Meta Pixel, en respectant la conformité RGPD (consentement, anonymisation, durées de rétention). On peut aussi intégrer des KPI IA-aware si vous mesurez des trafics venant des assistants conversationnels."),
                ("Mon site doit être lisible par les IA — vous savez faire ?", "Oui. Trois leviers : llms.txt et ai.txt pour exposer votre contenu aux crawlers IA, JSON-LD enrichi (Schema.org) pour structurer la sémantique, et un robots.txt IA-aware pour gérer ce que vous autorisez. Approche identique à celle qui rend ce site indexable par Perplexity et ChatGPT."),
                ("Sur quelles plateformes déployez-vous ?", "Azure en priorité, mais aussi Netlify, Vercel, Scaleway, CleverCloud, Infomaniak et OVHCloud selon le contexte — souveraineté européenne, edge functions, jamstack, contraintes RGPD. Le choix dépend du projet, pas d'un dogme cloud.")
            }
```

- [ ] **Step 3.5.2: Replace the EN `faq` initialization**

Mirror with EN copy from spec section 5 (12 entries).

### Task 3.6: Update `Home.razor` lead, `WorkLocation`, `areaServed`

**Files:**
- Modify: `IdeaStudio.Website/Pages/Home.razor`

- [ ] **Step 3.6.1: Update lead FR + EN**

Find:

```csharp
        lead = fr
            ? "Je transforme des idées en logiciels qui marchent. .NET, Azure, mobile, web — à Lyon et à distance."
            : "I turn ideas into software that ships. .NET, Azure, mobile, web — in Lyon and remote.";
```

Replace with:

```csharp
        lead = fr
            ? "Je transforme des idées en logiciels qui marchent. .NET, Azure, mobile, web — Lyon · Paris · Genève · Fribourg ou full-remote."
            : "I turn ideas into software that ships. .NET, Azure, mobile, web — Lyon · Paris · Geneva · Fribourg or fully remote.";
```

- [ ] **Step 3.6.2: Add `WorkLocation` to the `Person` JSON-LD constructor in `GenerateStructuredData`**

Find the `SchemaOrg.Person person = new(...)` construction. Add `WorkLocation:` parameter at the end:

```csharp
        SchemaOrg.Person person = new(
            // ... all existing parameters preserved ...
            Address: new SchemaOrg.PostalAddress(AddressLocality: "Lyon", AddressRegion: "Auvergne-Rhône-Alpes", AddressCountry: "FR"),
            WorksFor: new SchemaOrg.Organization(Name: "IdeaStud.io", Url: "https://ideastud.io"),
            WorkLocation: new[]
            {
                new SchemaOrg.Place(new SchemaOrg.PostalAddress(AddressLocality: "Lyon",     AddressCountry: "FR")),
                new SchemaOrg.Place(new SchemaOrg.PostalAddress(AddressLocality: "Paris",    AddressCountry: "FR")),
                new SchemaOrg.Place(new SchemaOrg.PostalAddress(AddressLocality: fr ? "Genève" : "Geneva", AddressCountry: "CH")),
                new SchemaOrg.Place(new SchemaOrg.PostalAddress(AddressLocality: "Fribourg", AddressCountry: "CH")),
            }
        );
```

- [ ] **Step 3.6.3: Update `areaServed` strings**

Find the two literal strings used for `areaServed` (in the `Service` schema construction and the `ProfessionalService`). Replace:

```csharp
AreaServed: fr ? "France et international (remote)" : "France and worldwide (remote)"
```

with:

```csharp
AreaServed: fr ? "France · Suisse · Europe (remote)" : "France · Switzerland · Europe (remote)"
```

(applies to both occurrences).

### Task 3.7: Update `SlugTranslator` is unnecessary

The existing `SlugTranslator` matches services by `Order` between FR and EN lists. Since the new entries are at `Order: 5` in both languages, no code change is required. The translator will automatically translate `ia-en-entreprise` ↔ `ai-enterprise`.

- [ ] **Step 3.7.1: Verify by inspecting `SlugTranslator.cs`**

Run: `cat IdeaStudio.Website/Services/SlugTranslator.cs | grep -n 'Order'`
Expected: confirms order-based matching.

### Task 3.8: Update `Footer.razor` with locations

**Files:**
- Modify: `IdeaStudio.Website/Components/Footer.razor`

- [ ] **Step 3.8.1: Update tagline string**

Find:

```csharp
    private string taglineText = "Lyon — remote";
```

Replace with:

```csharp
    private string taglineText = "Lyon · Paris · Genève · Fribourg — remote";
```

- [ ] **Step 3.8.2: Update the localized switch in `LoadTexts`**

Read `Footer.razor` for the `LoadTexts` method. If `taglineText` is set inside that method (FR vs EN), update both branches:

```csharp
        taglineText = fr
            ? "Lyon · Paris · Genève · Fribourg — remote"
            : "Lyon · Paris · Geneva · Fribourg — remote";
```

If `taglineText` is currently a static field only (no localized variant), add it to `LoadTexts`.

### Task 3.9: Update `llms.txt` and `ai.txt`

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/llms.txt`
- Modify: `IdeaStudio.Website/wwwroot/ai.txt`

- [ ] **Step 3.9.1: Update `llms.txt` location line**

Find:

```text
- Location: Lyon, France
```

Replace with:

```text
- Location: Lyon, Paris, Geneva, Fribourg
- Available for: on-site, hybrid, fully remote
```

- [ ] **Step 3.9.2: Update `ai.txt` (already touched in Task 3.4 for slugs)**

If `ai.txt` has a `location` field, update similarly. If it doesn't, no change needed beyond Task 3.4.

### Task 3.10: Update IntegrationTests for the new surface

**Files:**
- Modify: `IdeaStudio.Website.Tests/IntegrationTests.cs`

- [ ] **Step 3.10.1: Add a test that asserts FAQPage has ≥ 12 entries**

If there's not already a `FAQPage` JSON-LD test, add:

```csharp
    [Fact]
    public async Task Home_EmitsFaqPageJsonLd_WithAtLeastTwelveEntries()
    {
        // Boots the published WASM static, fetches /index.html, parses out JSON-LD blocks.
        // The exact wiring depends on the existing IntegrationTests harness — adapt accordingly.
        string html = await Fetch("/fr");
        Assert.Contains("\"@type\":\"FAQPage\"", html);
        // Count Question instances — should be ≥ 12
        int questionCount = System.Text.RegularExpressions.Regex.Matches(html, "\"@type\":\"Question\"").Count;
        Assert.True(questionCount >= 12, $"Expected ≥ 12 Question entries, got {questionCount}");
    }
```

(Adapt to match the existing `IntegrationTests` infrastructure — the `Fetch` helper here is illustrative.)

- [ ] **Step 3.10.2: Add a test that asserts `Person.workLocation` has 4 entries on the home**

```csharp
    [Fact]
    public async Task Home_PersonJsonLd_HasFourWorkLocations()
    {
        string html = await Fetch("/fr");
        // crude but stable: count Place entries
        int placeCount = System.Text.RegularExpressions.Regex.Matches(html, "\"@type\":\"Place\"").Count;
        Assert.True(placeCount >= 4, $"Expected ≥ 4 Place workLocations, got {placeCount}");
    }
```

- [ ] **Step 3.10.3: Add a test that asserts `/services/ai-enterprise` exists in EN**

If integration tests enumerate routes, add:

```csharp
    [Theory]
    [InlineData("/fr/services/ia-en-entreprise")]
    [InlineData("/en/services/ai-enterprise")]
    public async Task ServiceDetail_NewService_Returns200(string path)
    {
        HttpResponseMessage resp = await HttpClient.GetAsync(path);
        Assert.Equal(System.Net.HttpStatusCode.OK, resp.StatusCode);
    }
```

(Again — match the existing harness signature.)

### Task 3.11: Final verification + Commit 3

- [ ] **Step 3.11.1: Full build + test**

Run: `dotnet build IdeaStudio.sln && dotnet test IdeaStudio.sln`
Expected: green.

- [ ] **Step 3.11.2: Manual visual smoke**

Run dev server. Verify:
- `/fr` and `/en` show 12 Q&A.
- `/fr` lead reads "Lyon · Paris · Genève · Fribourg ou full-remote".
- Footer line includes the 4 cities.
- `/fr/services/ia-en-entreprise` and `/en/services/ai-enterprise` render with full content.
- `/fr/services/vibe-coding` shows the enriched 6 highlights including the deep-review bullet.
- `/fr/services/consultant-dotnet-azure` includes the multi-cloud highlight at the bottom.
- `/fr/services` hub lists 7 services.

- [ ] **Step 3.11.3: View source / DevTools — JSON-LD inspection**

In the browser DevTools, find the JSON-LD `<script type="application/ld+json">` blocks on `/fr`. Verify:
- A `Person` block with `workLocation` array of 4 places.
- A `FAQPage` block with `mainEntity` of 12 questions.
- A `ProfessionalService` block with `areaServed: "France · Suisse · Europe (remote)"`.

On `/fr/services/formateur`: verify `Course` blocks present (one per training, 20 total).

- [ ] **Step 3.11.4: Commit 3**

```bash
git add \
  IdeaStudio.Website/Models/SchemaOrg.cs \
  IdeaStudio.Website/wwwroot/data/services-fr.json \
  IdeaStudio.Website/wwwroot/data/services-en.json \
  IdeaStudio.Website/Pages/Home.razor \
  IdeaStudio.Website/Components/Footer.razor \
  IdeaStudio.Website/wwwroot/ai.txt \
  IdeaStudio.Website/wwwroot/llms.txt \
  IdeaStudio.Website.Tests/IntegrationTests.cs

git commit -m "$(cat <<'EOF'
feat(content): expand FAQ, add ai-enterprise service, update locations

- 7 services on /services (insert ia-en-entreprise / ai-enterprise at order 5)
- vibe-coding fiche enriched: 6 highlights, 4 FAQ, deep-review methodology bullet
- multi-cloud bullets on consultant-dotnet-azure, sites-internet, applications-mobiles (strategy A+)
- pricing FAQ explicit on formateur, vibe-coding, ia-en-entreprise (strategy B)
- home FAQ from 3 to 12 Q&A — eligible for FAQPage rich snippets
- Person.workLocation × 4 (Lyon, Paris, Geneva, Fribourg) JSON-LD
- areaServed: France · Suisse · Europe (remote)
- footer + llms.txt + ai.txt mention all 4 cities
- IntegrationTests cover the new surface

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3.11.5: Checkpoint C — visual screenshots before opening PR**

Take screenshots:
- `/fr` — full home (lead + FAQ section visible)
- `/fr/services` — hub with 7 services
- `/fr/services/ia-en-entreprise` — full fiche
- `/fr/services/vibe-coding` — enriched highlights visible
- Footer with 4 cities

EN equivalents for the home and services hub.

---

## Final — push branch and open PR

- [ ] **Step F.1: Push branch**

Run: `git push -u origin feature/content-revision-v3-1`
Expected: branch published, GitHub returns the PR creation URL.

- [ ] **Step F.2: Open PR via UI**

Open `https://github.com/andrestalavera/ideastudio/pull/new/feature/content-revision-v3-1`. Title:

```
feat(content): training catalogue, ai-enterprise service, expanded FAQ, locations
```

Body (paste, adapt as needed):

```markdown
## Summary

- Extract training centers + introduce `Training` model and 20-module catalogue rendered on `/services/formateur`
- Add new service `ia-en-entreprise` / `ai-enterprise` at order 5 (mobile/web shifted to 6/7)
- Enrich `vibe-coding` fiche with deep-review methodology bullet + tooling list (Claude Code, Cursor, Copilot, Antigravity)
- Multi-cloud highlights on `consultant-dotnet-azure`, `sites-internet`, `applications-mobiles` (strategy A+)
- Pricing FAQ explicit on `formateur`, `vibe-coding`, `ia-en-entreprise` (strategy B)
- Home FAQ from 3 to 12 Q&A with Schema.org `FAQPage` rich-snippet eligibility
- `Person.workLocation × 4` (Lyon, Paris, Geneva, Fribourg) + footer / llms.txt / ai.txt updates

Spec: `docs/superpowers/specs/2026-04-25-content-revision-v3-1-design.md`

## Test plan

- [ ] CI green (build + tests + SonarCloud)
- [ ] `BundleBudgetTests` ≤ 50 KB (no new JS expected)
- [ ] Smoke `/fr` + `/en` Home — 12 Q&A render, lead shows 4 cities
- [ ] Smoke `/fr/services/formateur` — 20 modules grouped by 4 categories
- [ ] Smoke `/fr/services/ia-en-entreprise` and `/en/services/ai-enterprise`
- [ ] Verify JSON-LD blocks: `FAQPage ≥ 12`, `Person.workLocation = 4`, `Course[]` per training on formateur
```

- [ ] **Step F.3: Wait for CI, address any failure, then merge via UI**

If SonarCloud or build fails, push fixes to the same branch (no new PR). Once green, "Rebase and merge" via UI to keep the linear history aligned with the user's "single main" goal.

- [ ] **Step F.4: Post-merge cleanup**

```bash
git fetch --all --prune
git checkout main && git pull
git branch -d feature/content-revision-v3-1
```

---

## Self-review checklist

After executing the plan and before closing:

- [ ] Spec coverage — every spec section has at least one task that implements it.
- [ ] Placeholder scan — no "TBD", "TODO", "implement later", "fill in details", or unspecified error handling.
- [ ] Type consistency — `Training`, `Course`, `Place`, `Person.WorkLocation` names match across all files.
- [ ] All 20 trainings have FR + EN parity (slugs identical, fields filled).
- [ ] All 12 FAQ Q&A have FR + EN parity.
- [ ] Service `order` field is unique 1..7 in both `services-fr.json` and `services-en.json`.
- [ ] `BundleBudgetTests` still passes (no JS bundle pressure).
