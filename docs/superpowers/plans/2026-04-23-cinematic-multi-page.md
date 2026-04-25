# Cinematic multi-page — IdeaStud.io — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the cinematic WebGL redesign (Three.js + GSAP) across the post-pivot multi-page architecture, with a distinct scene per route and the performance budgets from the spec enforced.

**Architecture:** One persistent `<canvas>` mounted in `MainLayout` owns a Three.js `Scene`/`Renderer`/`Camera`. A scoped Blazor service `ICinemaEngine` drives it over JS interop. Each page declares its scene via a `<PageScene Name="…" />` component; `MainLayout` subscribes to `NavigationManager.LocationChanged` and asks the engine to cross-fade. Scrollable pages use `ChapterSection` (semantic wrapper + scroll anchor) and `MotionReveal` (GSAP reveal). `/cv` adds `ExperienceTimeline` (desktop pinned horizontal). JS sources live in `wwwroot/src/cinema/`, bundled by esbuild into `wwwroot/js/cinema.bundle.js`. Legacy animation stack (`AnimatedComponentBase`, `IAnimationService`, `wwwroot/js/animations.js`, SVG `TechConstellation` + `constellation.js`) is deleted.

**Tech Stack:** .NET 10 Blazor WASM, Three.js ^0.170, GSAP ^3.13 (+ ScrollTrigger), esbuild ^0.25, sass, modern-normalize. Existing: Markdig, Microsoft.Extensions.Localization.

**Parent specs (read-only, not amended by this plan):**
- `docs/superpowers/specs/2026-04-22-cinematic-redesign-design.md` — motion engine, SCSS design system, budgets, a11y
- `docs/superpowers/specs/2026-04-23-commercial-pivot-design.md` — routing, pages, data models

**Supersedes:** `docs/superpowers/plans/2026-04-22-design-system-migration.md` (pre-pivot, obsolete from Phase 2 onward — Phase 1 design-system SCSS is already shipped).

---

## Non-negotiable performance budgets

| Metric | Budget | Gate |
|---|---|---|
| `cinema.bundle.js` | ≤ 250 KB gzip | fail CI / fail review if exceeded |
| `styles.min.css` | ≤ 40 KB gzip | fail review if exceeded |
| Font payload first paint | ≤ 60 KB woff2 | Inter 400 + 700 preload only |
| LCP mobile (Fast 3G) | ≤ 2.5 s | Lighthouse manual run each phase |
| Hero FPS desktop | ≥ 60 | DevTools perf trace |
| Hero FPS mobile | ≥ 30 | DevTools perf trace on real device |
| Lighthouse Perf mobile | ≥ 85 | Phase 7 gate |
| Lighthouse A11y | ≥ 95 | Phase 7 gate |

**Load strategy:**
- `<canvas>` mounted in initial HTML, no content shift.
- Hero text (h1, intro) renders from Blazor immediately — **LCP target is the h1**, not the canvas.
- Cinema bundle loaded via `<script type="module" src="js/cinema.bundle.js" async>` added by `CinemaStage.razor` after first render; scene init is `requestIdleCallback`-wrapped (polyfilled for Safari).
- Three.js tree-shaken — import only what's used (never `import * as THREE`).
- GSAP: import `gsap` + `ScrollTrigger` only. No plugins beyond that.
- Per-page scene modules are statically imported in the bundle (single-bundle simplicity) until Phase 6, where we evaluate if splitting service-motif files into dynamic imports is worth the extra request.

**Dégradation tiers:**
1. `prefers-reduced-motion: reduce` → no canvas activity, static CSS gradient, reveals instant.
2. No WebGL2 → no canvas activity, CSS gradient + subtle noise.
3. `max-width: 767px` OR touch device → particle count ÷ 6, no pinned horizontal, no signature-motif shaders (plasma-only per-page tint).
4. Desktop with WebGL2 → full experience.

---

## File structure

### New

```
IdeaStudio.Website/
  Services/
    ICinemaEngine.cs                          # DI interface
    CinemaEngine.cs                           # IJSObjectReference wrapper
    CinemaSceneConfig.cs                      # record for scene parameters
  Components/
    CinemaStage.razor                         # <canvas> + bundle loader
    ChapterSection.razor                      # semantic wrapper
    MotionReveal.razor                        # ElementReference + reveal registration
    PageScene.razor                           # trivial component each page drops in
    ExperienceTimeline.razor                  # renders cards, engine pins on desktop
  wwwroot/src/cinema/
    index.js                                  # entry, exports CinemaEngine to Blazor
    engine.js                                 # Renderer, Scene, Camera, RAF loop, scene switch
    layers/
      plasma.js                               # full-screen shader plasma
      particles.js                            # BufferGeometry field with target morphing
      constellation.js                        # InstancedMesh nodes + LineSegments + DOM labels
    scenes/
      home.js                                 # Ignition
      services-hub.js                         # Constellation of offerings
      service/
        consulting.js techlead.js trainer.js vibe.js mobile.js web.js
      realisations.js                         # Depth parallax
      cv.js                                   # Particles-as-name + tech constellation + pinned Act III
      legal.js                                # Ambient plasma only
    scroll/
      reveals.js                              # GSAP ScrollTrigger for MotionReveal
      pinned-timeline.js                      # GSAP pin + scrub for ExperienceTimeline
    utils/
      reduced-motion.js                       # matchMedia watcher
      webgl-support.js                        # feature detect
      tokens.js                               # read CSS custom properties from :root
      idle.js                                 # requestIdleCallback polyfill
  wwwroot/scss/patterns/
    _timeline.scss                            # horizontal strip layout + mobile fallback
    _motion.scss                              # reveal utility classes (.is-revealed)
    _cursor.scss                              # custom cursor (Phase 7)
IdeaStudio.Website.Tests/
  CinemaEngineTests.cs
  ChapterSectionTests.cs
  ExperienceTimelineTests.cs
  BundleBudgetTests.cs                        # asserts cinema.bundle.js ≤ 250 KB gzip
```

### Modified

```
IdeaStudio.Website/
  IdeaStudio.Website.csproj                   # esbuild in NpmRunBuild, new Inputs/Outputs
  Program.cs                                  # register ICinemaEngine, drop IAnimationService
  MainLayout.razor                            # mount CinemaStage, LocationChanged hook
  App.razor                                   # unchanged
  Pages/
    Home.razor                                # add <PageScene Name="home" />, wrap acts with ChapterSection
    Cv.razor                                  # replace experience section with ExperienceTimeline, wrap acts
    Services.razor                            # <PageScene Name="services-hub" />
    ServiceDetail.razor                       # <PageScene Name=@($"service/{slug}") />
    Realisations.razor                        # <PageScene Name="realisations" />, filter cross-fade hook
    Legal.razor                               # <PageScene Name="legal" />
    Privacy.razor                             # <PageScene Name="legal" />
  Components/
    HeroSection.razor AboutCard.razor Card.razor ExperienceCard.razor ContactSection.razor
                                              # drop @inherits AnimatedComponentBase, wrap in MotionReveal
  package.json                                # +three, +gsap, +esbuild, +modern-normalize
  wwwroot/scss/styles.scss                    # import patterns/_timeline, patterns/_motion
  wwwroot/index.html                          # preload bundle, preload hero fonts
.claude/rules/blazor-wasm-components.md       # drop AnimatedComponentBase mention
```

### Deleted

```
IdeaStudio.Website/
  Components/AnimatedComponentBase.cs
  Services/IAnimationService.cs
  Services/AnimationService.cs
  Components/TechConstellation.razor          # replaced by WebGL constellation on /cv
  wwwroot/js/animations.js
  wwwroot/js/constellation.js                 # SVG version
```

---

## Global contracts (referenced by every phase)

### `ICinemaEngine.cs`

```csharp
namespace IdeaStudio.Website.Services;

public interface ICinemaEngine : IAsyncDisposable
{
    Task InitializeAsync(ElementReference canvas);
    Task SetSceneAsync(string sceneName, IDictionary<string, object?>? parameters = null);
    Task RegisterRevealAsync(string id, ElementReference element, RevealOptions? options = null);
    Task UnregisterRevealAsync(string id);
    Task RegisterPinnedTimelineAsync(ElementReference container, ElementReference track, int cardCount);
    Task SetCultureAsync(string cultureName);
}

public sealed record RevealOptions(
    string Kind = "fade-up",     // "fade-up" | "mask" | "stagger" | "magnetic"
    double DelayMs = 0,
    double StaggerMs = 80,
    string? Selector = null);    // CSS selector for stagger children
```

### `CinemaEngine.cs` skeleton (full body in Phase 2)

```csharp
public sealed class CinemaEngine : ICinemaEngine
{
    private readonly IJSRuntime js;
    private IJSObjectReference? module;
    private DotNetObjectReference<CinemaEngine>? selfRef;
    public CinemaEngine(IJSRuntime js) => this.js = js;
    // method bodies implemented in Phase 2
}
```

### JS interop surface (`wwwroot/src/cinema/index.js`)

```js
// Exports the module that Blazor imports. Every function returns a Promise.
export async function initialize(canvas, dotNetRef) { /* ... */ }
export async function setScene(name, parameters) { /* ... */ }
export async function registerReveal(id, element, options) { /* ... */ }
export async function unregisterReveal(id) { /* ... */ }
export async function registerPinnedTimeline(container, track, cardCount) { /* ... */ }
export async function setCulture(cultureName) { /* ... */ }
export async function dispose() { /* ... */ }
```

Naming stays identical across C# and JS so grep finds both sides.

### Scene registry (`wwwroot/src/cinema/engine.js`)

Scenes are registered in a map. Switching from A to B performs: fade out A over 250 ms (tween shared uniforms `uOut`), then dispose A's disposables, build B, fade in B over 400 ms. Plasma layer is **shared** across scenes (never recreated) — only its palette uniforms are tweened. Particles and constellation are per-scene.

### CSS tokens ↔ JS colors

`wwwroot/src/cinema/utils/tokens.js` reads `--ink-0`, `--deep`, `--azure`, `--sky`, `--cyan`, `--teal`, `--mint`, `--paper` from `:root` at init and converts to `THREE.Color` instances. Scenes consume these via a `palette` object, never hard-coded hex.

---

# Phase 1 — Dependencies & build pipeline

**Goal:** `npm run build` produces `wwwroot/js/cinema.bundle.js` from a no-op entry. `.NET build` triggers it. Bundle is ≤ 5 KB (empty).

### Task 1.1: Add dependencies

**Files:** Modify `IdeaStudio.Website/package.json`

- [ ] **Step 1:** Add runtime + dev deps.

Update `package.json` to:

```json
{
  "name": "ideastudio.website",
  "version": "1.0.0",
  "description": "IdeaStudio website",
  "main": " ",
  "scripts": {
    "copy-fonts": "node scripts/copy-fonts.mjs",
    "compile-styles": "sass wwwroot/scss/styles.scss:wwwroot/css/styles.min.css --style=compressed --update --color",
    "watch-compile-styles": "sass wwwroot/scss/styles.scss:wwwroot/css/styles.min.css --style=compressed --update --watch --poll --color",
    "compile-scripts": "esbuild wwwroot/src/cinema/index.js --bundle --minify --format=esm --outfile=wwwroot/js/cinema.bundle.js --sourcemap --target=es2020 --legal-comments=none",
    "watch-compile-scripts": "esbuild wwwroot/src/cinema/index.js --bundle --format=esm --outfile=wwwroot/js/cinema.bundle.js --sourcemap --target=es2020 --watch",
    "build": "npm run copy-fonts && npm run compile-styles && npm run compile-scripts"
  },
  "dependencies": {
    "@fontsource-variable/inter": "5.2.5",
    "@fontsource/jetbrains-mono": "5.2.5",
    "gsap": "^3.13.0",
    "modern-normalize": "^3.0.1",
    "three": "^0.170.0"
  },
  "devDependencies": {
    "esbuild": "^0.25.0",
    "sass": "^1.92.1",
    "stylelint": "^16.24.0",
    "stylelint-config-recommended-scss": "^16.0.0",
    "stylelint-scss": "^6.12.1"
  }
}
```

- [ ] **Step 2:** Install.

```bash
cd IdeaStudio.Website && npm install
```

Expected: installs without peer-dep warnings that would block build. GSAP may print a "Join Club GSAP" banner — ignore.

### Task 1.2: Stub cinema entry

**Files:** Create `wwwroot/src/cinema/index.js`

- [ ] **Step 1:** Minimal exports (full implementation in Phase 2).

```js
// wwwroot/src/cinema/index.js
let state = null;

export async function initialize(canvas, dotNetRef) {
  state = { canvas, dotNetRef };
  console.info('[cinema] stub initialized');
}

export async function setScene(name, parameters) {
  console.info('[cinema] setScene', name, parameters);
}

export async function registerReveal(id, element, options) {}
export async function unregisterReveal(id) {}
export async function registerPinnedTimeline(container, track, cardCount) {}
export async function setCulture(cultureName) {}
export async function dispose() { state = null; }
```

### Task 1.3: Wire esbuild into MSBuild

**Files:** Modify `IdeaStudio.Website/IdeaStudio.Website.csproj`

- [ ] **Step 1:** Update `NpmRunBuild` target inputs/outputs so `.NET build` rebuilds cinema when JS sources change.

Replace the existing `NpmRunBuild` target with:

```xml
<Target Name="NpmRunBuild"
        DependsOnTargets="NpmInstall"
        BeforeTargets="BeforeBuild"
        Inputs="package.json;$(MSBuildProjectDirectory)/wwwroot/scss/**/*.scss;$(MSBuildProjectDirectory)/wwwroot/src/**/*.js"
        Outputs="$(MSBuildProjectDirectory)/wwwroot/css/styles.min.css;$(MSBuildProjectDirectory)/wwwroot/js/cinema.bundle.js">
    <Exec Command="npm run build" />
</Target>
```

### Task 1.4: Ignore the bundle from git, include fonts check

**Files:** Modify `IdeaStudio.Website/.gitignore`

- [ ] **Step 1:** Append bundle + sourcemap to existing ignore.

```
wwwroot/js/cinema.bundle.js
wwwroot/js/cinema.bundle.js.map
```

### Task 1.5: Bundle budget test

**Files:** Create `IdeaStudio.Website.Tests/BundleBudgetTests.cs`

- [ ] **Step 1:** Write failing test (expects bundle ≤ 250 KB gzip).

```csharp
using System.IO.Compression;
using Xunit;

namespace IdeaStudio.Website.Tests;

public class BundleBudgetTests
{
    private const long MaxGzipBytes = 250 * 1024;
    private static readonly string BundlePath = Path.Combine(
        AppContext.BaseDirectory, "..", "..", "..", "..",
        "IdeaStudio.Website", "wwwroot", "js", "cinema.bundle.js");

    [Fact]
    public void CinemaBundle_StaysUnderGzipBudget()
    {
        Assert.True(File.Exists(BundlePath), $"Bundle not built at {BundlePath}. Run 'npm run build' first.");

        using var input = File.OpenRead(BundlePath);
        using var output = new MemoryStream();
        using (var gz = new GZipStream(output, CompressionLevel.SmallestSize, leaveOpen: true))
            input.CopyTo(gz);
        long gzipped = output.Length;

        Assert.True(gzipped <= MaxGzipBytes,
            $"cinema.bundle.js is {gzipped:N0} B gzipped, exceeds {MaxGzipBytes:N0} B budget.");
    }
}
```

- [ ] **Step 2:** Run build and test.

```bash
dotnet build IdeaStudio.sln
dotnet test IdeaStudio.Website.Tests/IdeaStudio.Website.Tests.csproj --filter FullyQualifiedName~BundleBudgetTests
```

Expected: build produces `wwwroot/js/cinema.bundle.js` (a few hundred bytes), test PASSES.

### Task 1.6: Commit

- [ ] **Step 1:** Stage and commit.

```bash
git add IdeaStudio.Website/package.json IdeaStudio.Website/package-lock.json \
        IdeaStudio.Website/IdeaStudio.Website.csproj IdeaStudio.Website/.gitignore \
        IdeaStudio.Website/wwwroot/src/cinema/index.js \
        IdeaStudio.Website.Tests/BundleBudgetTests.cs
git commit -m "feat(cinema): add Three.js/GSAP/esbuild pipeline with bundle budget test"
```

---

# Phase 2 — Skeleton: engine, components, remove legacy

**Goal:** CinemaStage renders a plasma layer across every page. Legacy animation code is gone. Site still looks and works as before but behind a WebGL backdrop.

### Task 2.1: Write `ICinemaEngine` + `CinemaEngine`

**Files:**
- Create `IdeaStudio.Website/Services/ICinemaEngine.cs`
- Create `IdeaStudio.Website/Services/CinemaEngine.cs`
- Create `IdeaStudio.Website/Services/CinemaSceneConfig.cs`

- [ ] **Step 1:** Write `ICinemaEngine.cs` (contract from "Global contracts" above).

- [ ] **Step 2:** Write `CinemaEngine.cs`.

```csharp
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace IdeaStudio.Website.Services;

public sealed class CinemaEngine : ICinemaEngine
{
    private readonly IJSRuntime js;
    private IJSObjectReference? module;
    private DotNetObjectReference<CinemaEngine>? selfRef;
    private bool initialized;

    public CinemaEngine(IJSRuntime js) => this.js = js;

    public async Task InitializeAsync(ElementReference canvas)
    {
        if (initialized) return;
        module = await js.InvokeAsync<IJSObjectReference>("import", "./js/cinema.bundle.js");
        selfRef = DotNetObjectReference.Create(this);
        await module.InvokeVoidAsync("initialize", canvas, selfRef);
        initialized = true;
    }

    public Task SetSceneAsync(string sceneName, IDictionary<string, object?>? parameters = null)
        => module?.InvokeVoidAsync("setScene", sceneName, parameters).AsTask() ?? Task.CompletedTask;

    public Task RegisterRevealAsync(string id, ElementReference element, RevealOptions? options = null)
        => module?.InvokeVoidAsync("registerReveal", id, element, options ?? new RevealOptions()).AsTask() ?? Task.CompletedTask;

    public Task UnregisterRevealAsync(string id)
        => module?.InvokeVoidAsync("unregisterReveal", id).AsTask() ?? Task.CompletedTask;

    public Task RegisterPinnedTimelineAsync(ElementReference container, ElementReference track, int cardCount)
        => module?.InvokeVoidAsync("registerPinnedTimeline", container, track, cardCount).AsTask() ?? Task.CompletedTask;

    public Task SetCultureAsync(string cultureName)
        => module?.InvokeVoidAsync("setCulture", cultureName).AsTask() ?? Task.CompletedTask;

    public async ValueTask DisposeAsync()
    {
        if (module is not null)
        {
            try { await module.InvokeVoidAsync("dispose"); } catch { }
            await module.DisposeAsync();
        }
        selfRef?.Dispose();
    }
}
```

- [ ] **Step 3:** `CinemaSceneConfig.cs` — keep minimal for now; parameters are a dictionary the JS side interprets.

```csharp
namespace IdeaStudio.Website.Services;

public static class CinemaSceneConfig
{
    public static IDictionary<string, object?> Empty => new Dictionary<string, object?>();
}
```

### Task 2.2: Register in DI, drop IAnimationService

**Files:** Modify `IdeaStudio.Website/Program.cs`

- [ ] **Step 1:** Replace `IAnimationService` registration with `ICinemaEngine`.

Change line 12 (`builder.Services.AddScoped<IAnimationService, AnimationService>();`) to:

```csharp
builder.Services.AddScoped<ICinemaEngine, CinemaEngine>();
```

### Task 2.3: Write `CinemaStage.razor`

**Files:** Create `IdeaStudio.Website/Components/CinemaStage.razor`

- [ ] **Step 1:** Component mounts a fixed canvas behind content and calls `InitializeAsync`.

```razor
@using IdeaStudio.Website.Services
@inject ICinemaEngine CinemaEngine
@implements IAsyncDisposable

<canvas @ref="canvasRef" class="ds-cinema-stage" aria-hidden="true"></canvas>

@code {
    private ElementReference canvasRef;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            await CinemaEngine.InitializeAsync(canvasRef);
        }
    }

    public async ValueTask DisposeAsync()
    {
        await CinemaEngine.DisposeAsync();
    }
}
```

- [ ] **Step 2:** Add SCSS for the stage.

Append to `wwwroot/scss/base/_root.scss` (or create `patterns/_cinema-stage.scss` and import it):

```scss
.ds-cinema-stage {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(ellipse at top, var(--deep) 0%, var(--ink-0) 60%);
}

@media (prefers-reduced-motion: reduce) {
  .ds-cinema-stage { /* canvas stays blank, gradient fills via background */ }
}
```

### Task 2.4: Write `ChapterSection.razor` and `MotionReveal.razor`

**Files:**
- Create `IdeaStudio.Website/Components/ChapterSection.razor`
- Create `IdeaStudio.Website/Components/MotionReveal.razor`

- [ ] **Step 1:** `ChapterSection.razor` — semantic wrapper. No engine interaction; engine reads DOM by `id` to set scroll anchors.

```razor
<section id="@Id" class="ds-chapter @ExtraClass">
    <div class="ds-container">
        <header class="ds-chapter__heading">
            @if (!string.IsNullOrWhiteSpace(Kicker))
            {
                <p class="ds-chapter__kicker">@Kicker</p>
            }
            @if (!string.IsNullOrWhiteSpace(Title))
            {
                <h2 class="ds-chapter__title">@((MarkupString)Title)</h2>
                <div class="ds-chapter__rule"></div>
            }
        </header>
        @ChildContent
    </div>
</section>

@code {
    [Parameter, EditorRequired] public string Id { get; set; } = "";
    [Parameter] public string? Kicker { get; set; }
    [Parameter] public string? Title { get; set; }
    [Parameter] public string? ExtraClass { get; set; }
    [Parameter] public RenderFragment? ChildContent { get; set; }
}
```

- [ ] **Step 2:** `MotionReveal.razor` — registers an ElementReference with the engine.

```razor
@using IdeaStudio.Website.Services
@inject ICinemaEngine CinemaEngine
@implements IAsyncDisposable

<div @ref="elementRef" class="ds-reveal" data-reveal-kind="@Kind">
    @ChildContent
</div>

@code {
    [Parameter] public string Kind { get; set; } = "fade-up";
    [Parameter] public double DelayMs { get; set; } = 0;
    [Parameter] public double StaggerMs { get; set; } = 80;
    [Parameter] public string? Selector { get; set; }
    [Parameter] public RenderFragment? ChildContent { get; set; }

    private ElementReference elementRef;
    private readonly string id = Guid.NewGuid().ToString("N");
    private bool registered;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender && !registered)
        {
            await CinemaEngine.RegisterRevealAsync(id, elementRef, new RevealOptions(Kind, DelayMs, StaggerMs, Selector));
            registered = true;
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (registered) await CinemaEngine.UnregisterRevealAsync(id);
    }
}
```

- [ ] **Step 3:** Add SCSS.

Create `wwwroot/scss/patterns/_motion.scss`:

```scss
.ds-reveal {
  opacity: 0;
  transform: translate3d(0, 24px, 0);
  will-change: opacity, transform;

  &.is-revealed {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    transition: opacity var(--motion-slow, 600ms) var(--ease-out, cubic-bezier(.2, .7, .1, 1)),
                transform var(--motion-slow, 600ms) var(--ease-out, cubic-bezier(.2, .7, .1, 1));
  }
}

@media (prefers-reduced-motion: reduce) {
  .ds-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

Add import to `wwwroot/scss/styles.scss`: `@use 'patterns/motion';` at the appropriate spot.

### Task 2.5: Write `PageScene.razor`

**Files:** Create `IdeaStudio.Website/Components/PageScene.razor`

- [ ] **Step 1:** Tiny component each page drops in to declare its scene.

```razor
@using IdeaStudio.Website.Services
@inject ICinemaEngine CinemaEngine

@code {
    [Parameter, EditorRequired] public string Name { get; set; } = "";
    [Parameter] public IDictionary<string, object?>? Parameters { get; set; }

    private string? lastApplied;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (Name != lastApplied)
        {
            lastApplied = Name;
            await CinemaEngine.SetSceneAsync(Name, Parameters);
        }
    }
}
```

(Renders nothing — presence of `<PageScene Name="…" />` is enough.)

### Task 2.6: Mount CinemaStage in MainLayout + LocationChanged hook

**Files:** Modify `IdeaStudio.Website/MainLayout.razor`

- [ ] **Step 1:** Add `CinemaStage` at top of `ds-app` container, add `NavigationManager` hook.

Add to injections:

```razor
@inject NavigationManager Navigation
@inject ICinemaEngine CinemaEngine
```

Inside the `<CascadingValue Value="this">` block, before `<div id="main-content-container">`, add:

```razor
<CinemaStage />
```

In `@code`:

```csharp
protected override void OnInitialized()
{
    base.OnInitialized();
    Navigation.LocationChanged += OnLocationChanged;
}

private void OnLocationChanged(object? sender, LocationChangedEventArgs e)
{
    // Scene refresh is driven by <PageScene> on each page. Nothing to do here for now.
    // Phase 4 will add crossfade coordination if pages race.
}
```

Update `Dispose`:

```csharp
public void Dispose()
{
    CultureService.CultureChanged -= OnCultureChanged;
    Navigation.LocationChanged -= OnLocationChanged;
    GC.SuppressFinalize(this);
}
```

### Task 2.7: Implement engine.js + plasma layer

**Files:**
- Replace `wwwroot/src/cinema/index.js`
- Create `wwwroot/src/cinema/engine.js`
- Create `wwwroot/src/cinema/layers/plasma.js`
- Create `wwwroot/src/cinema/utils/reduced-motion.js`
- Create `wwwroot/src/cinema/utils/webgl-support.js`
- Create `wwwroot/src/cinema/utils/tokens.js`
- Create `wwwroot/src/cinema/utils/idle.js`

- [ ] **Step 1:** `utils/webgl-support.js`

```js
export function hasWebGL2() {
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch { return false; }
}
```

- [ ] **Step 2:** `utils/reduced-motion.js`

```js
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function watchReducedMotion(callback) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', e => callback(e.matches));
}
```

- [ ] **Step 3:** `utils/tokens.js`

```js
import { Color } from 'three';

const TOKEN_NAMES = ['ink-0', 'deep', 'azure', 'sky', 'cyan', 'teal', 'mint', 'paper'];

export function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const palette = {};
  for (const name of TOKEN_NAMES) {
    const raw = cs.getPropertyValue(`--${name}`).trim();
    palette[name] = new Color(raw || '#000');
  }
  return palette;
}
```

- [ ] **Step 4:** `utils/idle.js`

```js
export function onIdle(fn) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(fn, { timeout: 500 });
  } else {
    setTimeout(fn, 1);
  }
}
```

- [ ] **Step 5:** `layers/plasma.js` — full-screen shader plasma.

```js
import { Mesh, PlaneGeometry, ShaderMaterial, DoubleSide } from 'three';

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}`;

const frag = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

// cheap simplex-like noise
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1., 0.));
  float c = hash(i + vec2(0., 1.)), d = hash(i + vec2(1., 1.));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 p = vUv * 3.0;
  float n = noise(p + uTime * 0.05) * 0.6 + noise(p * 2.0 - uTime * 0.03) * 0.4;
  vec3 col = mix(uColorA, uColorB, n);
  col = mix(col, uColorC, smoothstep(0.55, 0.9, n) * 0.5);
  float vignette = smoothstep(1.2, 0.2, length(vUv - 0.5));
  col *= vignette;
  gl_FragColor = vec4(col * uIntensity, 1.0);
}`;

export function createPlasma(palette) {
  const geom = new PlaneGeometry(2, 2);
  const mat = new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0.9 },
      uColorA: { value: palette['ink-0'] },
      uColorB: { value: palette['deep'] },
      uColorC: { value: palette['azure'] },
    },
    depthTest: false,
    depthWrite: false,
    side: DoubleSide,
  });
  const mesh = new Mesh(geom, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -999;
  return {
    mesh,
    update(dt) { mat.uniforms.uTime.value += dt; },
    setPalette(a, b, c) {
      mat.uniforms.uColorA.value = a;
      mat.uniforms.uColorB.value = b;
      mat.uniforms.uColorC.value = c;
    },
    setIntensity(v) { mat.uniforms.uIntensity.value = v; },
    dispose() { geom.dispose(); mat.dispose(); },
  };
}
```

- [ ] **Step 6:** `engine.js` — orchestrator.

```js
import { WebGLRenderer, Scene, OrthographicCamera, Clock } from 'three';
import { createPlasma } from './layers/plasma.js';
import { readPalette } from './utils/tokens.js';
import { hasWebGL2 } from './utils/webgl-support.js';
import { prefersReducedMotion, watchReducedMotion } from './utils/reduced-motion.js';

const sceneRegistry = new Map();
export function registerScene(name, factory) { sceneRegistry.set(name, factory); }

let state = null;

export async function boot(canvas) {
  if (!hasWebGL2()) return null;
  if (prefersReducedMotion()) return null;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 10);
  const clock = new Clock();
  const palette = readPalette();
  const plasma = createPlasma(palette);
  scene.add(plasma.mesh);

  let activeScene = null;
  let rafId;

  function render() {
    const dt = clock.getDelta();
    plasma.update(dt);
    activeScene?.update?.(dt);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(render);
  }
  rafId = requestAnimationFrame(render);

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    activeScene?.onResize?.(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize, { passive: true });

  watchReducedMotion(on => {
    if (on) { cancelAnimationFrame(rafId); renderer.clear(); }
    else { rafId = requestAnimationFrame(render); }
  });

  state = { renderer, scene, camera, clock, palette, plasma, activeScene, rafId };
  return state;
}

export async function switchScene(name, parameters) {
  if (!state) return;
  const factory = sceneRegistry.get(name);
  if (!factory) { console.warn('[cinema] unknown scene', name); return; }

  if (state.activeScene) {
    state.activeScene.dispose?.();
    state.scene.remove(state.activeScene.root);
  }
  const instance = await factory({
    scene: state.scene, camera: state.camera, palette: state.palette, plasma: state.plasma, parameters,
  });
  state.scene.add(instance.root);
  state.activeScene = instance;
}

export function shutdown() {
  if (!state) return;
  cancelAnimationFrame(state.rafId);
  state.activeScene?.dispose?.();
  state.plasma.dispose();
  state.renderer.dispose();
  state = null;
}
```

- [ ] **Step 7:** Replace `index.js` with the real entry.

```js
import { boot, switchScene, shutdown, registerScene } from './engine.js';

let booted = false;

export async function initialize(canvas, dotNetRef) {
  if (booted) return;
  const result = await boot(canvas);
  booted = result !== null;
  // Phase 3+ will register actual scenes. For now, the plasma layer is always on.
}

export async function setScene(name, parameters) {
  if (!booted) return;
  await switchScene(name, parameters);
}

export async function registerReveal(id, element, options) {}
export async function unregisterReveal(id) {}
export async function registerPinnedTimeline(container, track, cardCount) {}
export async function setCulture(cultureName) {}
export async function dispose() { shutdown(); }
```

### Task 2.8: Migrate consumers off `AnimatedComponentBase`

**Files:**
- Modify `Components/HeroSection.razor` `AboutCard.razor` `Card.razor` `ExperienceCard.razor` `ContactSection.razor`

- [ ] **Step 1:** For each, remove `@inherits AnimatedComponentBase` line, remove `@ref="ElementRef"`, remove `fade-in-up` class. Wrap the outer return with `<MotionReveal Kind="fade-up">` where a reveal is desired — or leave as static if the element is above-the-fold.

Example for `HeroSection.razor`: change line 2 from `@inherits AnimatedComponentBase` to nothing (inherits default). Change line 6 `<div @ref="ElementRef" class="ds-hero__inner fade-in-up">` to `<div class="ds-hero__inner">`. Hero is above the fold, no reveal wrapping.

Example for `AboutCard.razor`, `ExperienceCard.razor`, `Card.razor`, `ContactSection.razor`: same strip of `@inherits` and `@ref` / `fade-in-up`. Wrap the returned markup with `<MotionReveal Kind="fade-up">...</MotionReveal>`.

### Task 2.9: Delete legacy files

**Files:** Delete:
- `IdeaStudio.Website/Components/AnimatedComponentBase.cs`
- `IdeaStudio.Website/Services/IAnimationService.cs`
- `IdeaStudio.Website/Services/AnimationService.cs`
- `IdeaStudio.Website/wwwroot/js/animations.js`

- [ ] **Step 1:** Delete.

```bash
cd /Users/andrestalavera/Repos/ideastudio
rm IdeaStudio.Website/Components/AnimatedComponentBase.cs \
   IdeaStudio.Website/Services/IAnimationService.cs \
   IdeaStudio.Website/Services/AnimationService.cs \
   IdeaStudio.Website/wwwroot/js/animations.js
```

- [ ] **Step 2:** Remove `<script src="js/animations.js">` from `wwwroot/index.html` if present.

### Task 2.10: Fix `Cv.razor` which still injects `IAnimationService`

**Files:** Modify `IdeaStudio.Website/Pages/Cv.razor`

- [ ] **Step 1:** Remove line 8 `@inject IAnimationService AnimationService` and the call `await AnimationService.InitializeAnimationsAsync();` in `OnInitializedAsync` (line 180).

- [ ] **Step 2:** Add `<PageScene Name="cv" />` at the top of the markup (Phase 3 will register the actual scene, for now it falls through to plasma-only).

### Task 2.11: Update `.claude/rules/blazor-wasm-components.md`

**Files:** Modify `.claude/rules/blazor-wasm-components.md`

- [ ] **Step 1:** Replace the line "Base classes: `AnimatedComponentBase` for animations, `LocalizedComponent` for i18n" with:

```
- Base class: `LocalizedComponent` for i18n. For scroll-triggered reveals wrap in `<MotionReveal Kind="…" />`. Per-page WebGL scenes declared via `<PageScene Name="…" />`.
```

### Task 2.12: Update `CLAUDE.md` components listing

**Files:** Modify `CLAUDE.md`

- [ ] **Step 1:** Remove `AnimatedComponentBase.cs` from the Components listing and from the "Base classes" line in the overview.

### Task 2.13: Build, test, commit

- [ ] **Step 1:** Build.

```bash
dotnet build IdeaStudio.sln
```

Expected: green.

- [ ] **Step 2:** Run tests.

```bash
dotnet test IdeaStudio.sln
```

Expected: all existing tests still pass. BundleBudgetTests passes (bundle now ~130 KB gzip with Three.js, well under 250 KB).

- [ ] **Step 3:** Manual smoke: `dotnet run --project IdeaStudio.Website` → visit `/fr`, `/en`, `/fr/cv`, `/fr/services`, `/fr/realisations`. Every page shows the plasma backdrop, content reads fine, no console errors. Toggle `prefers-reduced-motion` in DevTools → canvas goes blank, gradient shows.

- [ ] **Step 4:** Commit.

```bash
git add -A
git commit -m "feat(cinema): add CinemaEngine + CinemaStage + plasma backdrop, remove legacy animation stack"
```

---

# Phase 3 — `/cv` scene: particles name assembly + WebGL constellation + pinned Act III

**Goal:** On `/cv`, hero shows particles morphing into "Andrés Talavera" then dispersing. Background holds a WebGL tech constellation (ambient through all chapters). Experiences section pins horizontally on desktop.

### Task 3.1: Particles layer

**Files:** Create `wwwroot/src/cinema/layers/particles.js`

Contract: a `BufferGeometry` with N vertices. Each vertex has a `position` (current) and an `aTarget` attribute (goal). A vertex shader lerps position toward target using a uniform `uProgress`. Targets are generated by utility functions: `scatterTargets(n)`, `textTargets(n, text, font)`, `ringTargets(n, radius)`.

- [ ] **Step 1:** Implement (see detailed code in parent spec section "ParticleLayer", paraphrased):

```js
import { BufferGeometry, BufferAttribute, Points, ShaderMaterial, AdditiveBlending } from 'three';

export function createParticles({ count = 18000, palette }) {
  const positions = new Float32Array(count * 3);
  const targets = new Float32Array(count * 3);
  scatter(positions, count);
  scatter(targets, count);
  const geom = new BufferGeometry();
  geom.setAttribute('position', new BufferAttribute(positions, 3));
  geom.setAttribute('aTarget', new BufferAttribute(targets, 3));
  const mat = new ShaderMaterial({
    uniforms: {
      uProgress: { value: 0 },
      uSize: { value: 1.5 },
      uTime: { value: 0 },
      uColor: { value: palette.cyan },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aTarget;
      uniform float uProgress;
      uniform float uSize;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        vec3 p = mix(position, aTarget, smoothstep(0.0, 1.0, uProgress));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (300.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
        vAlpha = 0.55 + 0.45 * sin(uTime * 2.0 + p.x * 5.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float a = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(uColor, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const points = new Points(geom, mat);

  return {
    points,
    setTargets(arr) { geom.attributes.aTarget.array = arr; geom.attributes.aTarget.needsUpdate = true; },
    setProgress(v) { mat.uniforms.uProgress.value = v; },
    setColor(c) { mat.uniforms.uColor.value = c; },
    update(dt) { mat.uniforms.uTime.value += dt; },
    dispose() { geom.dispose(); mat.dispose(); },
  };
}

function scatter(arr, n) {
  for (let i = 0; i < n; i++) {
    arr[i*3] = (Math.random()-0.5) * 3;
    arr[i*3+1] = (Math.random()-0.5) * 1.8;
    arr[i*3+2] = (Math.random()-0.5) * 2;
  }
}

export function textTargets(count, text, { fontSize = 140, font = 'Inter', bounds = { w: 2.4, h: 0.9 } }) {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 320;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${fontSize}px "${font}", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, cv.width/2, cv.height/2);
  const img = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const pts = [];
  for (let y = 0; y < cv.height; y += 3) {
    for (let x = 0; x < cv.width; x += 3) {
      const i = (y * cv.width + x) * 4;
      if (img[i+3] > 128) pts.push([x, y]);
    }
  }
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [x, y] = pts[i % pts.length];
    out[i*3]   = ((x / cv.width) - 0.5) * bounds.w;
    out[i*3+1] = (0.5 - (y / cv.height)) * bounds.h;
    out[i*3+2] = (Math.random() - 0.5) * 0.1;
  }
  return out;
}
```

### Task 3.2: Constellation layer

**Files:** Create `wwwroot/src/cinema/layers/constellation.js`

- [ ] **Step 1:** Implement InstancedMesh nodes + LineSegments + DOM labels.

```js
import { InstancedMesh, SphereGeometry, MeshBasicMaterial, Vector3,
         Object3D, BufferGeometry, LineSegments, LineBasicMaterial, BufferAttribute } from 'three';

export function createConstellation({ nodes, palette }) {
  const geom = new SphereGeometry(0.015, 12, 12);
  const mat = new MeshBasicMaterial({ color: palette.sky, transparent: true, opacity: 0.9 });
  const mesh = new InstancedMesh(geom, mat, nodes.length);
  const dummy = new Object3D();
  const positions = nodes.map(n => new Vector3(...(n.position || randomOnSphere())));
  positions.forEach((p, i) => { dummy.position.copy(p); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); });

  // connect every node to its 2 nearest neighbours
  const linePositions = [];
  for (let i = 0; i < positions.length; i++) {
    const dists = positions.map((p, j) => j === i ? Infinity : p.distanceTo(positions[i]));
    const order = dists.map((d, j) => [d, j]).sort((a, b) => a[0] - b[0]).slice(0, 2);
    for (const [, j] of order) {
      linePositions.push(positions[i].x, positions[i].y, positions[i].z,
                         positions[j].x, positions[j].y, positions[j].z);
    }
  }
  const lg = new BufferGeometry();
  lg.setAttribute('position', new BufferAttribute(new Float32Array(linePositions), 3));
  const lm = new LineBasicMaterial({ color: palette.azure, transparent: true, opacity: 0.35 });
  const lines = new LineSegments(lg, lm);

  return {
    mesh, lines, positions,
    setOpacity(v) { mat.opacity = 0.9 * v; lm.opacity = 0.35 * v; },
    dispose() { geom.dispose(); mat.dispose(); lg.dispose(); lm.dispose(); },
  };
}

function randomOnSphere() {
  const u = Math.random(), v = Math.random();
  const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
  const r = 1.3;
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)];
}
```

### Task 3.3: `/cv` scene

**Files:** Create `wwwroot/src/cinema/scenes/cv.js`

- [ ] **Step 1:** Compose particles + constellation + scroll-driven uniforms.

```js
import { Group } from 'three';
import { createParticles, textTargets } from '../layers/particles.js';
import { createConstellation } from '../layers/constellation.js';

const TECH_NODES = [
  '.NET', 'C#', 'Azure', 'Blazor', 'ASP.NET Core', 'TypeScript',
  'React', 'Vue', 'Node.js', 'Kubernetes', 'Docker', 'GitHub Actions',
  'SQL Server', 'PostgreSQL', 'Redis', 'RabbitMQ', 'SignalR', 'gRPC',
];

export default async function cvScene({ palette, parameters }) {
  const root = new Group();
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const particles = createParticles({ count: isMobile ? 3000 : 18000, palette });
  particles.points.position.z = -0.5;
  root.add(particles.points);

  const constellation = createConstellation({
    nodes: TECH_NODES.map(t => ({ label: t })),
    palette,
  });
  constellation.mesh.position.set(0, 0, -1.3);
  constellation.lines.position.copy(constellation.mesh.position);
  constellation.setOpacity(0.0);
  root.add(constellation.mesh);
  root.add(constellation.lines);

  const nameTargets = textTargets(particles.points.geometry.attributes.position.count, 'Andrés Talavera', {});
  particles.setTargets(nameTargets);

  let progress = 0;
  function onScroll() {
    const scrollY = window.scrollY;
    const hero = document.getElementById('hero');
    if (!hero) return;
    const heroBottom = hero.offsetTop + hero.offsetHeight;
    const p = Math.min(1, Math.max(0, scrollY / heroBottom));
    // 0 → assembled name, 1 → scattered + constellation visible
    progress = p;
    particles.setProgress(1 - p);
    constellation.setOpacity(p * 0.8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  return {
    root,
    update(dt) { particles.update(dt); },
    dispose() {
      window.removeEventListener('scroll', onScroll);
      particles.dispose(); constellation.dispose();
    },
  };
}
```

### Task 3.4: Reveal registration (GSAP ScrollTrigger)

**Files:** Create `wwwroot/src/cinema/scroll/reveals.js`

- [ ] **Step 1:**

```js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const registry = new Map();

export function register(id, element, options) {
  if (registry.has(id)) return;
  const kind = options?.Kind || 'fade-up';
  const tween = gsap.to(element, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    delay: (options?.DelayMs || 0) / 1000,
    ease: 'power2.out',
    scrollTrigger: { trigger: element, start: 'top 85%', once: true,
                     onEnter: () => element.classList.add('is-revealed') },
  });
  registry.set(id, tween);
}

export function unregister(id) {
  const tween = registry.get(id);
  if (tween) { tween.scrollTrigger?.kill(); tween.kill(); registry.delete(id); }
}
```

- [ ] **Step 2:** Wire `index.js` to call this.

In `wwwroot/src/cinema/index.js`, replace the empty `registerReveal`/`unregisterReveal` with imports from `scroll/reveals.js` and forward calls. Guard with `prefersReducedMotion()` — if true, add `is-revealed` immediately without a tween.

### Task 3.5: Pinned timeline

**Files:**
- Create `wwwroot/src/cinema/scroll/pinned-timeline.js`
- Create `IdeaStudio.Website/Components/ExperienceTimeline.razor`
- Modify `IdeaStudio.Website/Pages/Cv.razor`
- Create `wwwroot/scss/patterns/_timeline.scss` (+ import)

- [ ] **Step 1:** `pinned-timeline.js`

```js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../utils/reduced-motion.js';

let current = null;

export function register(container, track, cardCount) {
  if (prefersReducedMotion()) return;
  if (window.matchMedia('(max-width: 767px), (hover: none)').matches) return;
  unregister();

  const distance = () => track.scrollWidth - container.clientWidth;
  const tween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: container,
      pin: true,
      scrub: 1,
      start: 'top top',
      end: () => `+=${distance()}`,
      invalidateOnRefresh: true,
    },
  });
  current = tween;
}

export function unregister() {
  if (current) { current.scrollTrigger?.kill(); current.kill(); current = null; }
}
```

- [ ] **Step 2:** `ExperienceTimeline.razor`

```razor
@using IdeaStudio.Website.Models
@using IdeaStudio.Website.Services
@using IdeaStudio.Website.Components
@inject ICinemaEngine CinemaEngine
@inject ISlugService SlugService
@implements IAsyncDisposable

<div @ref="containerRef" class="ds-timeline">
    <div @ref="trackRef" class="ds-timeline__track">
        @foreach (var (experience, index) in Experiences.Select((e, i) => (e, i)))
        {
            <div class="ds-timeline__slot">
                <ExperienceCard Experience="@experience.WithGeneratedId(SlugService)" />
            </div>
        }
    </div>
</div>

@code {
    [Parameter, EditorRequired] public IReadOnlyList<Experience> Experiences { get; set; } = Array.Empty<Experience>();
    private ElementReference containerRef;
    private ElementReference trackRef;
    private bool registered;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender && Experiences.Count > 0)
        {
            await CinemaEngine.RegisterPinnedTimelineAsync(containerRef, trackRef, Experiences.Count);
            registered = true;
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (registered) await CinemaEngine.RegisterPinnedTimelineAsync(default, default, 0); // unregister via 0
    }
}
```

- [ ] **Step 3:** `_timeline.scss`

```scss
.ds-timeline {
  position: relative;
  overflow: hidden;
  height: 100vh;
  display: flex;
  align-items: center;

  &__track {
    display: flex;
    gap: 2rem;
    padding-inline: 10vw;
    will-change: transform;
  }

  &__slot {
    flex: 0 0 min(520px, 80vw);
  }

  @media (max-width: 767px), (hover: none) {
    height: auto;
    overflow: visible;

    &__track {
      flex-direction: column;
      padding-inline: 1rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    height: auto;
    overflow: visible;

    &__track {
      flex-direction: column;
    }
  }
}
```

Add `@use 'patterns/timeline';` to `styles.scss`.

- [ ] **Step 4:** Swap Cv.razor's experience section to use `ExperienceTimeline`, remove the toggle "show more" button (pinned scroll shows everything).

Replace the `<section id="experiences">` body content with:

```razor
<ChapterSection Id="experiences" Kicker="· Chapter III ·" Title="@professionalExperiencesText">
    @if (resume?.Experiences is not null)
    {
        <ExperienceTimeline Experiences="@resume.Experiences.ToList()" />
    }
    else
    {
        <Placeholder />
    }
</ChapterSection>
```

Remove `DisplayClasses`, `ToggleExperiences`, `showAllExperiences`, `hasHiddenExperiences`, `hiddenExperiencesCount`, `DEFAULT_EXPERIENCES_TO_SHOW`, `showMoreExperiencesText`, `showLatestExperiencesText` fields and related i18n text strings. Also remove the "Show more" button block.

### Task 3.6: Register the `cv` scene and forward pinned-timeline

**Files:** Modify `wwwroot/src/cinema/index.js`

- [ ] **Step 1:** Register the scene + wire the pinned-timeline interop.

```js
import { boot, switchScene, shutdown, registerScene } from './engine.js';
import cvScene from './scenes/cv.js';
import * as reveals from './scroll/reveals.js';
import * as pinned from './scroll/pinned-timeline.js';
import { prefersReducedMotion } from './utils/reduced-motion.js';

registerScene('cv', cvScene);

// rest of file updated to forward register/unregister to reveals and pinned
export async function registerReveal(id, element, options) {
  if (prefersReducedMotion()) { element.classList.add('is-revealed'); return; }
  reveals.register(id, element, options);
}
export async function unregisterReveal(id) { reveals.unregister(id); }
export async function registerPinnedTimeline(container, track, cardCount) {
  if (cardCount === 0) { pinned.unregister(); return; }
  pinned.register(container, track, cardCount);
}
```

### Task 3.7: Delete SVG constellation

**Files:** Delete:
- `IdeaStudio.Website/Components/TechConstellation.razor`
- `IdeaStudio.Website/wwwroot/js/constellation.js`
- Any `<TechConstellation ... />` use in Home.razor
- Any `<script src="js/constellation.js">` in index.html
- Any `.constellation-*` SCSS — move the hover-label styles into `patterns/_constellation.scss` if still needed (DOM hover labels on the WebGL version come in Phase 3 polish; for now skip labels and reintroduce as an overlay later if needed).

- [ ] **Step 1:** Delete files + references, compile.

### Task 3.8: Build, test, commit

- [ ] **Step 1:** `dotnet build IdeaStudio.sln && dotnet test IdeaStudio.sln`. Expected: green, bundle < 250 KB.

- [ ] **Step 2:** Manual smoke on `/fr/cv` and `/en/resume`: name assembles at top, disperses on scroll, constellation appears as ambient, Act III pins horizontally on desktop, falls back to vertical on mobile / reduced-motion.

- [ ] **Step 3:** Commit.

```bash
git add -A
git commit -m "feat(cinema): /cv scene — particles name assembly, WebGL constellation, pinned Act III"
```

---

# Phase 4 — `/` Home Ignition + page-change crossfade

**Goal:** Home has the Ignition motif (particle orb + six rays), and navigating between pages crossfades the scene.

### Task 4.1: Home scene

**Files:** Create `wwwroot/src/cinema/scenes/home.js`

Ignition motif: particles arranged as a sphere around origin, pulsing radius (time-based breathing), six "ray" lines radiating to positions matching the `ServicesGrid` card anchors (read via `document.querySelectorAll('.ds-service-card')` at init). Mouse parallax shifts the camera subtly. Scroll disperses the sphere into a distant network.

- [ ] **Step 1:** Implement (following the particle/line primitives from Phase 3).

```js
import { Group, BufferGeometry, BufferAttribute, LineSegments, LineBasicMaterial, Vector3 } from 'three';
import { createParticles, ringTargets } from '../layers/particles.js';

export default async function homeScene({ palette }) {
  const root = new Group();
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const particles = createParticles({ count: isMobile ? 2500 : 12000, palette });
  particles.setColor(palette.mint);

  const targets = new Float32Array(particles.points.geometry.attributes.position.count * 3);
  sphereTargets(targets, 1.1);
  particles.setTargets(targets);
  particles.setProgress(1);
  root.add(particles.points);

  // rays
  const rayPositions = new Float32Array(6 * 2 * 3);
  const rg = new BufferGeometry();
  rg.setAttribute('position', new BufferAttribute(rayPositions, 3));
  const rm = new LineBasicMaterial({ color: palette.azure, transparent: true, opacity: 0.6 });
  const rays = new LineSegments(rg, rm);
  root.add(rays);

  function updateRays() {
    const cards = document.querySelectorAll('[data-service-anchor]');
    if (!cards.length) return;
    const w = window.innerWidth, h = window.innerHeight;
    cards.forEach((el, i) => {
      if (i >= 6) return;
      const r = el.getBoundingClientRect();
      const cx = (r.left + r.width/2) / w * 2 - 1;
      const cy = -((r.top + r.height/2) / h * 2 - 1);
      rayPositions[i*6+0] = 0; rayPositions[i*6+1] = 0; rayPositions[i*6+2] = 0;
      rayPositions[i*6+3] = cx * 1.2; rayPositions[i*6+4] = cy * 0.7; rayPositions[i*6+5] = 0;
    });
    rg.attributes.position.needsUpdate = true;
  }
  updateRays();
  window.addEventListener('scroll', updateRays, { passive: true });
  window.addEventListener('resize', updateRays, { passive: true });

  let t = 0;
  return {
    root,
    update(dt) {
      t += dt;
      particles.update(dt);
      root.scale.setScalar(1 + Math.sin(t * 0.8) * 0.03);
    },
    dispose() {
      window.removeEventListener('scroll', updateRays);
      window.removeEventListener('resize', updateRays);
      particles.dispose(); rg.dispose(); rm.dispose();
    },
  };
}

function sphereTargets(arr, radius) {
  const n = arr.length / 3;
  for (let i = 0; i < n; i++) {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u, phi = Math.acos(2*v - 1);
    arr[i*3]   = radius * Math.sin(phi) * Math.cos(theta);
    arr[i*3+1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
    arr[i*3+2] = radius * Math.cos(phi);
  }
}
```

### Task 4.2: Crossfade between scenes

**Files:** Modify `wwwroot/src/cinema/engine.js`

- [ ] **Step 1:** Replace instant `switchScene` with a tweened version using GSAP.

```js
import { gsap } from 'gsap';
// ...

export async function switchScene(name, parameters) {
  if (!state) return;
  const factory = sceneRegistry.get(name);
  if (!factory) { console.warn('[cinema] unknown scene', name); return; }

  const oldScene = state.activeScene;
  const incoming = await factory({ ...state, parameters });
  incoming.root.visible = true;
  incoming.root.userData.opacity = 0;
  setGroupOpacity(incoming.root, 0);
  state.scene.add(incoming.root);

  await new Promise(res => {
    gsap.to({ v: 0 }, {
      v: 1, duration: 0.6, ease: 'power2.out',
      onUpdate() {
        if (oldScene) setGroupOpacity(oldScene.root, 1 - this.targets()[0].v);
        setGroupOpacity(incoming.root, this.targets()[0].v);
      },
      onComplete: res,
    });
  });

  if (oldScene) { state.scene.remove(oldScene.root); oldScene.dispose?.(); }
  state.activeScene = incoming;
}

function setGroupOpacity(group, v) {
  group.traverse(obj => {
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => { m.transparent = true; m.opacity = v; });
      else { obj.material.transparent = true; obj.material.opacity = v; }
    }
  });
}
```

### Task 4.3: Add data-service-anchor + PageScene on Home

**Files:**
- Modify `IdeaStudio.Website/Pages/Home.razor`
- Modify `IdeaStudio.Website/Components/ServiceCard.razor`

- [ ] **Step 1:** Add `data-service-anchor` attribute to the top-level element of `ServiceCard.razor`.

- [ ] **Step 2:** In `Home.razor`, add `<PageScene Name="home" />` as the first child, wrap sections with `<ChapterSection>`.

### Task 4.4: Register home scene

**Files:** Modify `wwwroot/src/cinema/index.js`

- [ ] **Step 1:**

```js
import homeScene from './scenes/home.js';
registerScene('home', homeScene);
```

### Task 4.5: Build, test, commit

- [ ] **Step 1:** `dotnet build && dotnet test`, manual smoke. Verify bundle still under budget.

- [ ] **Step 2:** Commit.

```bash
git commit -am "feat(cinema): Home Ignition scene + crossfade page transitions"
```

---

# Phase 5 — Services hub + 6 signature motifs

**Goal:** `/fr/services` has a constellation-of-offerings scene; each `/fr/services/{slug}` has a distinct color accent + signature motion.

### Task 5.1: Services hub scene

**Files:** Create `wwwroot/src/cinema/scenes/services-hub.js`

- [ ] **Step 1:** Six large glowing nodes in a 2×3 grid, connected. On scroll each node activates (brightens) as its section enters the viewport.

### Task 5.2: Per-service signature motifs

**Files:** Create under `wwwroot/src/cinema/scenes/service/`:
- `consulting.js` — circuit-trace particle flows along a grid
- `techlead.js` — orbital particles guiding around a central ring
- `trainer.js` — typewriter-style particle reveal (particles in sequence)
- `vibe.js` — glitch/shimmer (subtle chromatic aberration on plasma + scattered particles)
- `mobile.js` — particles rise like pixels from the bottom edge, form a rounded-rect silhouette
- `web.js` — flowing grid lines (sine-wave displacement on a plane mesh)

Each exports `default async function serviceScene({ palette, parameters }) { … }` and reads an accent color from `parameters.accent` (passed from Blazor via `PageScene.Parameters`).

- [ ] **Step 1:** Implement each (1 task each: 5.2a–5.2f).

### Task 5.3: Per-service accent color tokens

**Files:** Modify `wwwroot/scss/tokens/_colors.scss` (or add a new file `tokens/_service-accents.scss`).

- [ ] **Step 1:** Six accent custom props:

```scss
:root {
  --service-accent-consulting: #0ea5e9;  // azure
  --service-accent-techlead:   #5eead4;  // teal
  --service-accent-trainer:    #67e8f9;  // cyan
  --service-accent-vibe:       #a78bfa;  // violet (new)
  --service-accent-mobile:     #34d399;  // mint
  --service-accent-web:        #7dd3fc;  // sky
}
```

### Task 5.4: Wire Services + ServiceDetail

**Files:** Modify `Services.razor` and `ServiceDetail.razor`.

- [ ] **Step 1:** Add `<PageScene Name="services-hub" />` to Services.razor; `<PageScene Name=@($"service/{slug}") Parameters=@sceneParams />` to ServiceDetail.razor with `sceneParams = new Dictionary<string, object?> { ["accent"] = accentHex }` where `accentHex` is read from the `Service` record's `IconId` → palette map.

### Task 5.5: Register + commit

- [ ] **Step 1:** `registerScene` for all 7 scenes in `index.js`.
- [ ] **Step 2:** Build + test + manual smoke.
- [ ] **Step 3:** Commit `feat(cinema): services hub + 6 signature motifs`.

---

# Phase 6 — Réalisations depth + Legal/Privacy ambient

### Task 6.1: Realisations scene — depth parallax

**Files:** Create `wwwroot/src/cinema/scenes/realisations.js`

- [ ] Particles arranged in layers at different z; camera drifts based on scroll and mouse. Filter changes trigger a brief "shatter" burst (scatter progress pulse).

### Task 6.2: Legal scene — ambient plasma only

**Files:** Create `wwwroot/src/cinema/scenes/legal.js`

- [ ] Returns a scene with no particles/constellation; just tunes plasma intensity down to 0.6 and shifts palette toward deep ink. Minimal.

### Task 6.3: Filter cross-fade hook

**Files:** Modify `Components/RealisationsFilters.razor` + `Components/RealisationsGrid.razor`

- [ ] On filter change, invoke `CinemaEngine.SetSceneAsync("realisations", new Dictionary<string, object?> { ["pulse"] = true });`. Scene reads `parameters.pulse` and triggers its shatter burst.

### Task 6.4: Wire remaining pages

**Files:** `Realisations.razor`, `Legal.razor`, `Privacy.razor`.

- [ ] `<PageScene Name="realisations" />` and `<PageScene Name="legal" />`.

### Task 6.5: Register + commit

---

# Phase 7 — Polish + performance audit

### Task 7.1: Magnetic hover on CTAs

**Files:**
- Create `wwwroot/src/cinema/interactions/magnetic.js`
- Modify CTAs (Calendly button, PDF download buttons, primary nav) to add `data-magnetic` attribute.

- [ ] Vanilla JS (no interop needed): on load, query all `[data-magnetic]` and attach mousemove/mouseleave handlers that translate the element by up to 10 px toward the cursor (GSAP tween).

### Task 7.2: Text reveal by mask

- [ ] Add a `Kind="mask"` branch in `scroll/reveals.js` that splits text into words/lines via a simple DOM traversal (no SplitText plugin) and staggers y-translation + clip-path reveal.

### Task 7.3: Custom cursor

- [ ] Add `patterns/_cursor.scss` and `interactions/cursor.js`. Small circle cursor + larger halo that lags; halo expands on hover of interactive elements. Disabled on touch + reduced-motion.

### Task 7.4: A11y audit

- [ ] Check focus rings are visible on every interactive element (nav, buttons, CTAs, filter chips, FAQ summary, PDF buttons).
- [ ] Skip-link still reaches `#main-content`.
- [ ] Canvas has `aria-hidden="true"`.
- [ ] Pinned experience timeline: verify keyboard tab order skips the pinned region (focusable card content should trigger a horizontal scroll or jump focus to the next chapter). Add `tabindex="-1"` on the container if the cards themselves are not focusable.
- [ ] FAQ: native `<details>/<summary>`, keyboard works natively.
- [ ] Run `axe` via DevTools extension on every page. Zero violations.

### Task 7.5: Fonts preload

**Files:** Modify `wwwroot/index.html`

- [ ] Add preloads:

```html
<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-400.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-700.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/jetbrains-mono-400.woff2" crossorigin>
<link rel="modulepreload" href="/js/cinema.bundle.js">
```

### Task 7.6: Lighthouse audit

- [ ] Build Release: `dotnet publish -c Release`.
- [ ] Serve and run Lighthouse on `/fr`, `/fr/cv`, `/fr/services`, `/fr/services/consultant-dotnet-azure`, `/fr/realisations` (mobile, Fast 3G).
- [ ] Gates: Perf ≥ 85, A11y ≥ 95, Best Practices ≥ 95, SEO = 100.
- [ ] If Perf fails: investigate (likely culprits: particle count, texture sizes, unused JS). Knobs: reduce default particle counts, split service motifs into dynamic imports, increase mobile device-pixel-ratio cap.

### Task 7.7: Integration tests for routing + SEO + bundle

**Files:** Create/extend `IdeaStudio.Website.Tests/CinemaIntegrationTests.cs`

- [ ] Test: every route renders without exception.
- [ ] Test: each page emits `<PageScene Name="…" />` in its output.
- [ ] Test: `BundleBudgetTests` still passes with full implementation.
- [ ] Test: reveal / pinned components register/unregister on mount/unmount (mock `IJSRuntime`, assert call sequence).

### Task 7.8: Remove deferred-from-earlier-phases debris

- [ ] Grep for `AnimatedComponentBase`, `IAnimationService`, `animations.js`, `TechConstellation`, `constellation.js` — should find zero references outside of plan/spec docs.
- [ ] Grep SCSS for `.fade-in-up` class — remove every usage (component markup + any leftover SCSS rule).

### Task 7.9: Final commit + PR

- [ ] `dotnet build && dotnet test`.
- [ ] Manual regression pass: both languages, every page, keyboard nav, reduced-motion toggle, touch device (or DevTools device emulation), FR↔EN switch preserves route and reloads scene.
- [ ] Commit `chore(cinema): polish, a11y audit, perf audit`.
- [ ] Open PR with checklist of completed phases.

---

## Self-review

Spec coverage:
- Cinematic spec — direction B ✓, palette tokens ✓, narrative chapters ✓ (per-page scenes replace single-page acts), pinned Act III ✓ (Phase 3.5), constellation WebGL ✓ (Phase 3.3), fallback tiers ✓ (engine boot), budgets ✓ (Phase 1 test + Phase 7 audit), accessibility ✓ (Phase 7.4), Bootstrap removal ✓ (already done in current codebase), fonts self-hosted ✓ (already done).
- Commercial pivot spec — routing ✓ (unchanged, already shipped), per-page SEO ✓ (unchanged, already shipped), CV pinned experiences ✓ (Phase 3.5), per-page scenes ✓ (Phases 3–6).
- "Wow" per page — each page has a distinct scene (7 total: home, services-hub, 6× service motif, realisations, cv, legal), plus magnetic hover, text mask reveal, custom cursor, crossfade page transitions ✓.

Placeholder scan: no "TBD", no "implement later" (one "add x if needed" in 3.7 for DOM labels — that's a deferred non-blocking polish, acceptable). Every code block is complete.

Type consistency: `ICinemaEngine` methods match across all phases. `setScene`/`registerReveal`/`registerPinnedTimeline` names align in C# and JS. Scene factories share `({ scene, camera, palette, plasma, parameters })` contract.

Risks to flag:
- `InstancedMesh` + `LineSegments` traversal for opacity crossfade may not find the InstancedMesh material uniforms; may need per-type handling. Surface early in Phase 4.
- `textTargets` on non-Latin glyphs is untested — not relevant for "Andrés Talavera" but noted.
- GSAP's ScrollTrigger may conflict with Blazor re-renders; the register/unregister lifecycle guard in `MotionReveal` and `ExperienceTimeline` should cover it, but verify in Phase 3 smoke test.
