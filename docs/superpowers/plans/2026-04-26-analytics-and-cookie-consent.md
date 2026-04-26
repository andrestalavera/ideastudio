# Analytics & Cookie Consent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Google Analytics 4, Microsoft Clarity, and (placeholder) Meta Pixel
behind a CNIL-compliant cookie-consent banner, with SPA page-view tracking and
13-month consent persistence.

**Architecture:** A small JS module loaded by `index.html` defines Consent
Mode v2 defaults (all denied) before any tracker fires. Two Blazor services
manage state (`IConsentService`) and JS-interop (`IAnalyticsService`). A
`<CookieBanner />` mounted in `MainLayout` collects consent. `MainLayout` hooks
`NavigationManager.LocationChanged` to fire `page_view` events on every SPA
navigation. The Privacy page is rewritten to truthfully disclose the trackers
and link to the consent toggle.

**Tech Stack:** Blazor WebAssembly (.NET 10), xUnit + Moq, custom SCSS,
esbuild-bundled JS module (`cinema.bundle.js`), localStorage for persistence.

**Spec:** `docs/superpowers/specs/2026-04-26-analytics-and-cookie-consent-design.md`

**Constants used across tasks:**

- GA4 measurement ID: `G-VFWV1QDJFB`
- Microsoft Clarity project ID: `whf48fcfv3`
- Meta Pixel ID: `null` (not yet provided; tracker stays disabled)
- localStorage key: `idea_consent`
- Consent expiry: 13 months (`TimeSpan.FromDays(395)`)

---

## File Structure

| Status | Path | Responsibility |
| --- | --- | --- |
| Create | `IdeaStudio.Website/Services/IConsentService.cs` | Consent state interface + `ConsentService` impl (localStorage-backed, 13-month expiry, `OnChanged` event) |
| Create | `IdeaStudio.Website/Services/IAnalyticsService.cs` | JS-interop interface + `AnalyticsService` impl wrapping `window.ideaAnalytics` |
| Create | `IdeaStudio.Website/Components/CookieBanner.razor` | Bottom-fixed banner with Refuser/Accepter buttons |
| Create | `IdeaStudio.Website/wwwroot/src/cinema/analytics/index.js` | JS module: defines `window.ideaAnalytics.{setConsent,trackPageView}` |
| Create | `IdeaStudio.Website/wwwroot/scss/components/_cookie-banner.scss` | Banner styles |
| Create | `IdeaStudio.Website.Tests/ConsentServiceTests.cs` | Unit tests for state machine + 13-month expiry |
| Modify | `IdeaStudio.Website/wwwroot/index.html` | Inline Consent Mode v2 init + load gtag.js + Clarity & fbq stubs |
| Modify | `IdeaStudio.Website/wwwroot/src/cinema/index.js` | Side-effect import of analytics module |
| Modify | `IdeaStudio.Website/MainLayout.razor` | Mount banner; hook `LocationChanged` for `trackPageView`; react to `OnChanged` to flip consent |
| Modify | `IdeaStudio.Website/Components/Footer.razor` | Add "Gestion des cookies" link calling `ConsentService.Reset()` |
| Modify | `IdeaStudio.Website/Pages/Privacy.razor` | Rewrite to truthfully describe analytics; add `#cookies` anchor section |
| Modify | `IdeaStudio.Website/wwwroot/i18n/fr.json` | Banner + footer + Privacy strings |
| Modify | `IdeaStudio.Website/wwwroot/i18n/en.json` | Banner + footer + Privacy strings |
| Modify | `IdeaStudio.Website/wwwroot/scss/styles.scss` | `@use 'components/cookie-banner'` |
| Modify | `IdeaStudio.Website/Program.cs` | Register `IConsentService` + `IAnalyticsService` (scoped) |

---

## Task 1 — `ConsentService` state-machine tests

**Files:**

- Create: `IdeaStudio.Website.Tests/ConsentServiceTests.cs`

We TDD the consent state machine first. The service depends on `IJSRuntime` (for
`localStorage`) and `TimeProvider` (for testable expiry). The tests use Moq for
the JS runtime and `FakeTimeProvider`-style hand-rolled clock injection.

- [ ] **Step 1 — Create the failing test file**

```csharp
// IdeaStudio.Website.Tests/ConsentServiceTests.cs
using IdeaStudio.Website.Services;
using Microsoft.JSInterop;
using Moq;

namespace IdeaStudio.Website.Tests;

public class ConsentServiceTests
{
    private const string Key = "idea_consent";

    private static (ConsentService svc, Mock<IJSRuntime> js, FakeTimeProvider clock) Make(
        string? storedRaw = null,
        DateTimeOffset? now = null)
    {
        Mock<IJSRuntime> js = new();
        js.Setup(j => j.InvokeAsync<string?>("localStorage.getItem", It.Is<object[]>(a => (string)a[0] == Key)))
            .ReturnsAsync(storedRaw);
        FakeTimeProvider clock = new(now ?? new DateTimeOffset(2026, 4, 26, 12, 0, 0, TimeSpan.Zero));
        ConsentService svc = new(js.Object, clock);
        return (svc, js, clock);
    }

    [Fact]
    public async Task LoadAsync_NoStoredValue_HasDecidedFalse()
    {
        (ConsentService svc, _, _) = Make(storedRaw: null);
        await svc.LoadAsync();
        Assert.False(svc.HasDecided);
        Assert.False(svc.IsGranted);
    }

    [Fact]
    public async Task LoadAsync_StoredGrantedRecent_HasDecidedTrueGrantedTrue()
    {
        DateTimeOffset now = new(2026, 4, 26, 12, 0, 0, TimeSpan.Zero);
        long ts = now.AddDays(-30).ToUnixTimeMilliseconds();
        string raw = $"{{\"state\":\"granted\",\"ts\":{ts}}}";
        (ConsentService svc, _, _) = Make(storedRaw: raw, now: now);
        await svc.LoadAsync();
        Assert.True(svc.HasDecided);
        Assert.True(svc.IsGranted);
    }

    [Fact]
    public async Task LoadAsync_StoredDeniedRecent_HasDecidedTrueGrantedFalse()
    {
        DateTimeOffset now = new(2026, 4, 26, 12, 0, 0, TimeSpan.Zero);
        long ts = now.AddDays(-30).ToUnixTimeMilliseconds();
        string raw = $"{{\"state\":\"denied\",\"ts\":{ts}}}";
        (ConsentService svc, _, _) = Make(storedRaw: raw, now: now);
        await svc.LoadAsync();
        Assert.True(svc.HasDecided);
        Assert.False(svc.IsGranted);
    }

    [Fact]
    public async Task LoadAsync_StoredOlderThanThirteenMonths_HasDecidedFalse()
    {
        DateTimeOffset now = new(2026, 4, 26, 12, 0, 0, TimeSpan.Zero);
        long ts = now.AddDays(-396).ToUnixTimeMilliseconds(); // > 395-day expiry
        string raw = $"{{\"state\":\"granted\",\"ts\":{ts}}}";
        (ConsentService svc, _, _) = Make(storedRaw: raw, now: now);
        await svc.LoadAsync();
        Assert.False(svc.HasDecided);
    }

    [Fact]
    public async Task LoadAsync_StoredMalformedJson_HasDecidedFalse()
    {
        (ConsentService svc, _, _) = Make(storedRaw: "{not-json}");
        await svc.LoadAsync();
        Assert.False(svc.HasDecided);
    }

    [Fact]
    public async Task AcceptAsync_PersistsGrantedAndRaisesOnChanged()
    {
        (ConsentService svc, Mock<IJSRuntime> js, _) = Make();
        await svc.LoadAsync();
        int fired = 0;
        svc.OnChanged += () => fired++;
        await svc.AcceptAsync();
        Assert.True(svc.HasDecided);
        Assert.True(svc.IsGranted);
        Assert.Equal(1, fired);
        js.Verify(j => j.InvokeAsync<object>(
            "localStorage.setItem",
            It.Is<object[]>(a => (string)a[0] == Key && ((string)a[1]).Contains("\"granted\""))),
            Times.Once);
    }

    [Fact]
    public async Task DeclineAsync_PersistsDeniedAndRaisesOnChanged()
    {
        (ConsentService svc, Mock<IJSRuntime> js, _) = Make();
        await svc.LoadAsync();
        int fired = 0;
        svc.OnChanged += () => fired++;
        await svc.DeclineAsync();
        Assert.True(svc.HasDecided);
        Assert.False(svc.IsGranted);
        Assert.Equal(1, fired);
        js.Verify(j => j.InvokeAsync<object>(
            "localStorage.setItem",
            It.Is<object[]>(a => (string)a[0] == Key && ((string)a[1]).Contains("\"denied\""))),
            Times.Once);
    }

    [Fact]
    public async Task ResetAsync_RemovesStorageAndRaisesOnChanged()
    {
        DateTimeOffset now = new(2026, 4, 26, 12, 0, 0, TimeSpan.Zero);
        long ts = now.AddDays(-30).ToUnixTimeMilliseconds();
        string raw = $"{{\"state\":\"granted\",\"ts\":{ts}}}";
        (ConsentService svc, Mock<IJSRuntime> js, _) = Make(storedRaw: raw, now: now);
        await svc.LoadAsync();
        int fired = 0;
        svc.OnChanged += () => fired++;
        await svc.ResetAsync();
        Assert.False(svc.HasDecided);
        Assert.Equal(1, fired);
        js.Verify(j => j.InvokeAsync<object>(
            "localStorage.removeItem",
            It.Is<object[]>(a => (string)a[0] == Key)),
            Times.Once);
    }
}

internal sealed class FakeTimeProvider : TimeProvider
{
    private DateTimeOffset now;
    public FakeTimeProvider(DateTimeOffset start) => now = start;
    public override DateTimeOffset GetUtcNow() => now;
    public void Advance(TimeSpan by) => now = now.Add(by);
}
```

- [ ] **Step 2 — Run tests, verify they fail**

Run: `dotnet test IdeaStudio.sln --filter "FullyQualifiedName~ConsentServiceTests"`

Expected: 8 failures with `CS0246: type 'ConsentService' could not be found` (or
similar). The compile error is the failure signal.

---

## Task 2 — `ConsentService` implementation

**Files:**

- Create: `IdeaStudio.Website/Services/IConsentService.cs`

Single file holding interface + sealed implementation per project convention
(`IContentGateway.cs` follows the same pattern).

- [ ] **Step 1 — Create the service file**

```csharp
// IdeaStudio.Website/Services/IConsentService.cs
using System.Text.Json;
using Microsoft.JSInterop;

namespace IdeaStudio.Website.Services;

/// <summary>Cookie / tracker consent state, persisted in localStorage with a
/// 13-month expiry (CNIL maximum).</summary>
public interface IConsentService
{
    bool HasDecided { get; }
    bool IsGranted { get; }
    event Action? OnChanged;
    Task LoadAsync();
    Task AcceptAsync();
    Task DeclineAsync();
    Task ResetAsync();
}

public sealed class ConsentService(IJSRuntime js, TimeProvider clock) : IConsentService
{
    private const string StorageKey = "idea_consent";
    private static readonly TimeSpan Expiry = TimeSpan.FromDays(395); // ~13 months
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    private readonly IJSRuntime js = js;
    private readonly TimeProvider clock = clock;

    private bool decided;
    private bool granted;

    public bool HasDecided => decided;
    public bool IsGranted => granted;
    public event Action? OnChanged;

    public async Task LoadAsync()
    {
        string? raw = null;
        try { raw = await js.InvokeAsync<string?>("localStorage.getItem", StorageKey); }
        catch (JSException) { /* prerender or storage unavailable */ }

        if (string.IsNullOrWhiteSpace(raw)) { decided = false; granted = false; return; }

        StoredConsent? parsed;
        try { parsed = JsonSerializer.Deserialize<StoredConsent>(raw, JsonOpts); }
        catch (JsonException) { decided = false; granted = false; return; }

        if (parsed is null || (parsed.State != "granted" && parsed.State != "denied"))
        {
            decided = false; granted = false; return;
        }

        DateTimeOffset stored = DateTimeOffset.FromUnixTimeMilliseconds(parsed.Ts);
        if (clock.GetUtcNow() - stored > Expiry)
        {
            decided = false; granted = false; return;
        }

        decided = true;
        granted = parsed.State == "granted";
    }

    public Task AcceptAsync() => PersistAsync(true);
    public Task DeclineAsync() => PersistAsync(false);

    public async Task ResetAsync()
    {
        try { await js.InvokeAsync<object>("localStorage.removeItem", StorageKey); }
        catch (JSException) { /* storage gone */ }
        decided = false;
        granted = false;
        OnChanged?.Invoke();
    }

    private async Task PersistAsync(bool grant)
    {
        long ts = clock.GetUtcNow().ToUnixTimeMilliseconds();
        StoredConsent payload = new(grant ? "granted" : "denied", ts);
        string raw = JsonSerializer.Serialize(payload);
        try { await js.InvokeAsync<object>("localStorage.setItem", StorageKey, raw); }
        catch (JSException) { /* storage gone — keep in-memory state anyway */ }
        decided = true;
        granted = grant;
        OnChanged?.Invoke();
    }

    private sealed record StoredConsent(string State, long Ts);
}
```

- [ ] **Step 2 — Run tests, verify all pass**

Run: `dotnet test IdeaStudio.sln --filter "FullyQualifiedName~ConsentServiceTests"`

Expected: 8 passes.

- [ ] **Step 3 — Commit**

```bash
git add IdeaStudio.Website/Services/IConsentService.cs IdeaStudio.Website.Tests/ConsentServiceTests.cs
git commit -m "feat(consent): add ConsentService with localStorage + 13-month expiry"
```

---

## Task 3 — `index.html` Consent Mode v2 bootstrap

**Files:**

- Modify: `IdeaStudio.Website/wwwroot/index.html`

Inject the Consent Mode v2 defaults BEFORE any tracker can fire, then load
`gtag.js` async. Clarity and Meta loaders stay in the JS module (Task 5)
because they only fire on consent.

- [ ] **Step 1 — Add preconnect + Consent Mode bootstrap + gtag loader**

Find this block (lines 29–32):

```html
    <!-- Preconnect -->
    <link rel="preconnect" href="https://assets.calendly.com" crossorigin />
```

Replace with:

```html
    <!-- Preconnect -->
    <link rel="preconnect" href="https://assets.calendly.com" crossorigin />
    <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin />
    <link rel="preconnect" href="https://www.google-analytics.com" crossorigin />

    <!-- Google Consent Mode v2 — defaults to denied. Updated by IdeaStudio
         analytics module (wwwroot/src/cinema/analytics/index.js) once the user
         decides via the cookie banner. localhost short-circuit lives there. -->
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            functionality_storage: 'granted',
            security_storage: 'granted',
            wait_for_update: 500
        });
        gtag('js', new Date());
        gtag('config', 'G-VFWV1QDJFB', { send_page_view: false });
    </script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-VFWV1QDJFB"></script>
```

- [ ] **Step 2 — Verify the file still parses (build + smoke open)**

Run: `dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj`

Expected: build succeeds. `index.html` is static and not parsed by MSBuild, so a
local `python3 -c "import html.parser, sys; html.parser.HTMLParser().feed(open('IdeaStudio.Website/wwwroot/index.html').read())"` is enough to catch a syntax slip.

- [ ] **Step 3 — Commit**

```bash
git add IdeaStudio.Website/wwwroot/index.html
git commit -m "feat(analytics): bootstrap Google Consent Mode v2 + gtag.js"
```

---

## Task 4 — Analytics JS module

**Files:**

- Create: `IdeaStudio.Website/wwwroot/src/cinema/analytics/index.js`

Exposes `window.ideaAnalytics` with two methods. Lazy-loads Clarity and Meta
Pixel scripts ONLY on `setConsent(true)`. Localhost short-circuits everything.

- [ ] **Step 1 — Create the module**

```js
// wwwroot/src/cinema/analytics/index.js
// Runtime for analytics consent + page-view tracking.
// Loaded as part of cinema.bundle.js. Exposes window.ideaAnalytics.
//
// Behavior:
//   - On localhost: every call is a no-op (no scripts, no fetches).
//   - setConsent(true)  -> updates Consent Mode v2 to granted; lazy-loads
//                          Clarity and (if META_PIXEL_ID is set) Meta Pixel.
//   - setConsent(false) -> updates Consent Mode v2 to denied (idempotent).
//   - trackPageView(url) -> always fires gtag page_view; calls clarity/fbq
//                           page hooks if those scripts are loaded.
//
// To enable Meta Pixel later: replace META_PIXEL_ID = null with the actual ID.

const GA_ID = 'G-VFWV1QDJFB';
const CLARITY_ID = 'whf48fcfv3';
const META_PIXEL_ID = null; // TODO: set when Meta Pixel ID is available

const isLocalhost =
  typeof location !== 'undefined' &&
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

let clarityLoaded = false;
let pixelLoaded = false;
let granted = false;

function gtag() {
  if (typeof window === 'undefined' || !window.dataLayer) return;
  window.dataLayer.push(arguments);
}

function loadClarity() {
  if (clarityLoaded || isLocalhost) return;
  clarityLoaded = true;
  // Standard Microsoft Clarity loader, inlined to avoid a separate file.
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_ID);
}

function loadMetaPixel() {
  if (pixelLoaded || isLocalhost || !META_PIXEL_ID) return;
  pixelLoaded = true;
  // Standard Meta Pixel loader.
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
    n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
}

export function setConsent(grant) {
  if (isLocalhost) return;
  granted = !!grant;
  if (granted) {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
    loadClarity();
    loadMetaPixel();
  } else {
    gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
  }
}

export function trackPageView(url) {
  if (isLocalhost) return;
  // Defer one tick so SeoHead has a chance to update document.title first.
  setTimeout(() => {
    gtag('event', 'page_view', {
      page_location: url || (typeof location !== 'undefined' ? location.href : ''),
      page_title: typeof document !== 'undefined' ? document.title : ''
    });
    if (clarityLoaded && window.clarity) {
      window.clarity('set', 'page', url || location.href);
    }
    if (pixelLoaded && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, 50);
}

if (typeof window !== 'undefined') {
  window.ideaAnalytics = { setConsent, trackPageView };
}
```

- [ ] **Step 2 — Wire it into the cinema bundle**

Modify `IdeaStudio.Website/wwwroot/src/cinema/index.js`. Find this line (line 14):

```js
export { mountSignature } from './signature/signature-name.js';
```

Add immediately after it:

```js
import './analytics/index.js'; // side-effect: defines window.ideaAnalytics
```

- [ ] **Step 3 — Build the bundle and confirm the budget still passes**

Run from the website directory:

```bash
cd IdeaStudio.Website && npm run build
```

Expected: `wwwroot/js/cinema.bundle.js` regenerated (was ~20 KB raw / ~7.5 KB
gzipped before — analytics adds <2 KB gzipped, well under the 50 KB ceiling).

Run: `dotnet test IdeaStudio.sln --filter "FullyQualifiedName~BundleBudgetTests"`

Expected: PASS.

- [ ] **Step 4 — Commit**

```bash
git add IdeaStudio.Website/wwwroot/src/cinema/analytics/index.js \
       IdeaStudio.Website/wwwroot/src/cinema/index.js \
       IdeaStudio.Website/wwwroot/js/cinema.bundle.js \
       IdeaStudio.Website/wwwroot/js/cinema.bundle.js.map
git commit -m "feat(analytics): JS module for consent + page-view tracking"
```

---

## Task 5 — `AnalyticsService` (Blazor wrapper)

**Files:**

- Create: `IdeaStudio.Website/Services/IAnalyticsService.cs`

Thin JS-interop wrapper that calls `window.ideaAnalytics.{setConsent,trackPageView}`.
Mirrors the pattern of `SceneTheme` for consistency.

- [ ] **Step 1 — Create the service file**

```csharp
// IdeaStudio.Website/Services/IAnalyticsService.cs
using Microsoft.JSInterop;

namespace IdeaStudio.Website.Services;

/// <summary>JS-interop facade for the analytics runtime
/// (<c>wwwroot/src/cinema/analytics/index.js</c>).</summary>
public interface IAnalyticsService
{
    /// <summary>Updates Google Consent Mode v2 and lazy-loads Clarity / Meta when granted.</summary>
    Task SetConsentAsync(bool granted);

    /// <summary>Sends a <c>page_view</c> event to all loaded trackers.</summary>
    Task TrackPageViewAsync(string url);
}

public sealed class AnalyticsService(IJSRuntime js) : IAnalyticsService
{
    private readonly IJSRuntime js = js;

    public async Task SetConsentAsync(bool granted)
    {
        try { await js.InvokeVoidAsync("ideaAnalytics.setConsent", granted); }
        catch (JSException) { /* runtime not yet present (e.g. before bundle loads) */ }
        catch (JSDisconnectedException) { /* circuit gone */ }
    }

    public async Task TrackPageViewAsync(string url)
    {
        try { await js.InvokeVoidAsync("ideaAnalytics.trackPageView", url); }
        catch (JSException) { /* runtime not yet present */ }
        catch (JSDisconnectedException) { /* circuit gone */ }
    }
}
```

- [ ] **Step 2 — Build to confirm it compiles**

Run: `dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj`

Expected: build succeeds.

- [ ] **Step 3 — Commit**

```bash
git add IdeaStudio.Website/Services/IAnalyticsService.cs
git commit -m "feat(analytics): AnalyticsService JS-interop wrapper"
```

---

## Task 6 — DI registration + `TimeProvider`

**Files:**

- Modify: `IdeaStudio.Website/Program.cs`

Register both services scoped, and provide `TimeProvider.System` so
`ConsentService` can resolve it.

- [ ] **Step 1 — Add registrations**

Find this block (around lines 14–15):

```csharp
builder.Services.AddScoped<ISlugService, SlugService>();
builder.Services.AddScoped<ISlugTranslator, SlugTranslator>();
```

Add immediately after:

```csharp

// Analytics + consent
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<IConsentService, ConsentService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
```

- [ ] **Step 2 — Build to confirm wiring**

Run: `dotnet build IdeaStudio.sln`

Expected: build succeeds (tests still pass since they construct the service
directly without DI).

- [ ] **Step 3 — Commit**

```bash
git add IdeaStudio.Website/Program.cs
git commit -m "feat(analytics): register ConsentService + AnalyticsService"
```

---

## Task 7 — i18n strings (FR + EN)

**Files:**

- Modify: `IdeaStudio.Website/wwwroot/i18n/fr.json`
- Modify: `IdeaStudio.Website/wwwroot/i18n/en.json`

Add keys for the banner, the footer link, and the new Privacy section title.

- [ ] **Step 1 — Append to `fr.json`**

Open `IdeaStudio.Website/wwwroot/i18n/fr.json` and add the following entries
**before** the closing `}` (the file uses flat key/value pairs — append after
the last existing entry, separating with a comma):

```json
  "Cookies.BannerTitle": "Cookies & mesure d'audience",
  "Cookies.BannerDescription": "Nous utilisons Google Analytics, Microsoft Clarity et Meta Pixel pour comprendre comment ce site est utilisé.",
  "Cookies.BannerLearnMore": "En savoir plus",
  "Cookies.BannerAccept": "Accepter",
  "Cookies.BannerDecline": "Refuser",
  "Cookies.FooterManage": "Gestion des cookies",
  "Privacy.CookiesTitle": "Cookies & traceurs"
```

- [ ] **Step 2 — Append to `en.json`**

Open `IdeaStudio.Website/wwwroot/i18n/en.json` and add the equivalent block
in the same way:

```json
  "Cookies.BannerTitle": "Cookies & analytics",
  "Cookies.BannerDescription": "We use Google Analytics, Microsoft Clarity and Meta Pixel to understand how this site is used.",
  "Cookies.BannerLearnMore": "Learn more",
  "Cookies.BannerAccept": "Accept",
  "Cookies.BannerDecline": "Decline",
  "Cookies.FooterManage": "Cookie settings",
  "Privacy.CookiesTitle": "Cookies & trackers"
```

- [ ] **Step 3 — Verify both files are valid JSON**

Run from the repo root:

```bash
python3 -m json.tool IdeaStudio.Website/wwwroot/i18n/fr.json > /dev/null && \
python3 -m json.tool IdeaStudio.Website/wwwroot/i18n/en.json > /dev/null && \
echo OK
```

Expected: `OK`.

- [ ] **Step 4 — Commit**

```bash
git add IdeaStudio.Website/wwwroot/i18n/fr.json IdeaStudio.Website/wwwroot/i18n/en.json
git commit -m "feat(i18n): add cookie banner + footer + privacy strings (FR/EN)"
```

---

## Task 8 — `CookieBanner` component

**Files:**

- Create: `IdeaStudio.Website/Components/CookieBanner.razor`

The banner subscribes to `IConsentService.OnChanged`, hides itself once a
decision exists, and renders only when `!HasDecided`. Uses
`LocalizedComponent` for i18n. `Privacy` route comes from `ILocalizedRoute`
to avoid the `HardcodedPathsTests` regex.

- [ ] **Step 1 — Create the component**

```razor
@* IdeaStudio.Website/Components/CookieBanner.razor *@
@using IdeaStudio.Website.Services
@inherits LocalizedComponent
@implements IDisposable
@inject IConsentService Consent
@inject IAnalyticsService Analytics
@inject ILocalizedRoute LocalizedRoute

@if (showBanner)
{
    <div class="ds-cookie-banner" role="dialog" aria-labelledby="ds-cookie-banner-title" aria-describedby="ds-cookie-banner-desc">
        <div class="ds-cookie-banner__inner">
            <div class="ds-cookie-banner__copy">
                <h2 id="ds-cookie-banner-title" class="ds-cookie-banner__title">@titleText</h2>
                <p id="ds-cookie-banner-desc" class="ds-cookie-banner__desc">
                    @descText
                    <a class="ds-link" href="@privacyAnchor">@learnMoreText</a>
                </p>
            </div>
            <div class="ds-cookie-banner__actions">
                <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" @onclick="OnDecline">@declineText</button>
                <button type="button" class="ds-btn ds-btn--primary ds-btn--sm" @onclick="OnAccept">@acceptText</button>
            </div>
        </div>
    </div>
}

@code {
    private bool showBanner;
    private bool initialized;
    private string titleText = "Cookies & mesure d'audience";
    private string descText = "Nous utilisons Google Analytics, Microsoft Clarity et Meta Pixel.";
    private string learnMoreText = "En savoir plus";
    private string acceptText = "Accepter";
    private string declineText = "Refuser";
    private string privacyAnchor = "/fr/confidentialite#cookies";

    protected override async Task OnInitializedAsync()
    {
        await base.OnInitializedAsync();
        Consent.OnChanged += OnConsentChanged;
        await Consent.LoadAsync();
        initialized = true;
        showBanner = !Consent.HasDecided;
        StateHasChanged();
    }

    protected override void LoadTexts()
    {
        titleText      = LocalizationService.GetString("Cookies.BannerTitle");
        descText       = LocalizationService.GetString("Cookies.BannerDescription");
        learnMoreText  = LocalizationService.GetString("Cookies.BannerLearnMore");
        acceptText     = LocalizationService.GetString("Cookies.BannerAccept");
        declineText    = LocalizationService.GetString("Cookies.BannerDecline");
        privacyAnchor  = LocalizedRoute.For("privacy") + "#cookies";
    }

    private async Task OnAccept()
    {
        await Consent.AcceptAsync();
        // OnConsentChanged will close the banner.
    }

    private async Task OnDecline()
    {
        await Consent.DeclineAsync();
    }

    private void OnConsentChanged()
    {
        if (!initialized) return;
        showBanner = !Consent.HasDecided;
        InvokeAsync(StateHasChanged);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            Consent.OnChanged -= OnConsentChanged;
        }
        base.Dispose(disposing);
    }
}
```

- [ ] **Step 2 — Build to confirm it compiles**

Run: `dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj`

Expected: build succeeds. `HardcodedPathsTests` should not flag this file
because the only "/fr|en" string here comes from `LocalizedRoute.For()` (a
function call, not a literal).

- [ ] **Step 3 — Run the hardcoded-paths test to confirm**

Run: `dotnet test IdeaStudio.sln --filter "FullyQualifiedName~HardcodedPathsTests"`

Expected: PASS.

- [ ] **Step 4 — Commit**

```bash
git add IdeaStudio.Website/Components/CookieBanner.razor
git commit -m "feat(cookies): add CookieBanner component"
```

---

## Task 9 — Banner SCSS

**Files:**

- Create: `IdeaStudio.Website/wwwroot/scss/components/_cookie-banner.scss`
- Modify: `IdeaStudio.Website/wwwroot/scss/styles.scss`

Editorial dark-glass card pinned to the bottom edge. Mobile: full-width with
margins. Desktop: max 640 px, centered.

- [ ] **Step 1 — Create the SCSS partial**

```scss
// components/_cookie-banner.scss — bottom-fixed dark glass consent banner.

@use '../tokens/colors' as c;
@use '../tokens/space' as s;
@use '../tokens/type' as t;
@use '../tokens/motion' as m;

.ds-cookie-banner {
  position: fixed;
  inset: auto s.$s-4 s.$s-4 s.$s-4;
  z-index: 1000;
  display: flex;
  justify-content: center;
  pointer-events: none; // wrapper is just for centering
  animation: ds-cookie-banner-in m.$t-medium m.$ease-out both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.ds-cookie-banner__inner {
  pointer-events: auto;
  inline-size: 100%;
  max-inline-size: 640px;
  padding: s.$s-5;
  display: flex;
  flex-direction: column;
  gap: s.$s-4;
  background: rgba(5, 22, 26, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid c.$rule;
  border-radius: 16px;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.4);

}

@media (min-width: 32rem) {
  .ds-cookie-banner__inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.ds-cookie-banner__copy {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: s.$s-2;
}

.ds-cookie-banner__title {
  margin: 0;
  font-family: t.$font-sans;
  font-size: t.$fs-small;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: c.$fg;
}

.ds-cookie-banner__desc {
  margin: 0;
  font-family: t.$font-sans;
  font-size: t.$fs-small;
  line-height: 1.45;
  color: c.$fg-muted;
}

.ds-cookie-banner__actions {
  display: flex;
  gap: s.$s-2;
  flex-shrink: 0;
}

@keyframes ds-cookie-banner-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 2 — Register the partial in `styles.scss`**

Find this line (around line 40):

```scss
@use 'components/footer';
```

Add immediately after:

```scss
@use 'components/cookie-banner';
```

- [ ] **Step 3 — Compile styles and confirm no SCSS errors**

Run from the website directory:

```bash
cd IdeaStudio.Website && npm run compile-styles
```

Expected: no errors; `wwwroot/css/styles.min.css` updated with the new rules.

- [ ] **Step 4 — Commit**

```bash
git add IdeaStudio.Website/wwwroot/scss/components/_cookie-banner.scss \
       IdeaStudio.Website/wwwroot/scss/styles.scss \
       IdeaStudio.Website/wwwroot/css/styles.min.css
git commit -m "feat(cookies): add cookie banner styles"
```

---

## Task 10 — Wire `MainLayout` (mount banner, page-view, consent reaction)

**Files:**

- Modify: `IdeaStudio.Website/MainLayout.razor`

Three concerns added to the existing layout:

1. Mount `<CookieBanner />` once (always rendered, but it self-hides until
   needed).
2. Push a `page_view` to analytics on every `LocationChanged` (extending the
   existing handler).
3. Subscribe to `IConsentService.OnChanged`: when fired, call
   `IAnalyticsService.SetConsentAsync(IsGranted)`. Also fire the initial
   consent state once after `LoadAsync` so a returning visitor has trackers
   re-armed without seeing the banner.

- [ ] **Step 1 — Add the new injects + IDisposable participation**

Open `IdeaStudio.Website/MainLayout.razor`. Find the inject block
(lines 4–7):

```razor
@inject ICultureService CultureService
@inject ILocalizationService LocalizationService
@inject NavigationManager Navigation
@inject ISceneTheme SceneTheme
```

Add two more lines below:

```razor
@inject IConsentService Consent
@inject IAnalyticsService Analytics
```

- [ ] **Step 2 — Add `<CookieBanner />` inside the cascading-value block**

Find the closing `</main>` and the conditional `<CtaBand />` (lines 18–24):

```razor
    <main id="main-content" role="main">
        @Body
    </main>

    @if (showCta)
    {
        <CtaBand />
    }
    <Footer />
```

Append `<CookieBanner />` immediately before the closing `</CascadingValue>`:

```razor
    <main id="main-content" role="main">
        @Body
    </main>

    @if (showCta)
    {
        <CtaBand />
    }
    <Footer />
    <CookieBanner />
```

- [ ] **Step 3 — Subscribe to consent + load initial state in `OnInitializedAsync`**

Find `OnInitializedAsync` (lines 32–38):

```csharp
    protected override async Task OnInitializedAsync()
    {
        CultureService.CultureChanged += OnCultureChanged;
        Navigation.LocationChanged += OnLocationChanged;
        await LoadLocalizedStringsAsync();
        UpdateCtaVisibility(Navigation.Uri);
    }
```

Replace with:

```csharp
    protected override async Task OnInitializedAsync()
    {
        CultureService.CultureChanged += OnCultureChanged;
        Navigation.LocationChanged += OnLocationChanged;
        Consent.OnChanged += OnConsentChanged;
        await LoadLocalizedStringsAsync();
        UpdateCtaVisibility(Navigation.Uri);
        await Consent.LoadAsync();
        if (Consent.HasDecided)
        {
            await Analytics.SetConsentAsync(Consent.IsGranted);
        }
    }
```

- [ ] **Step 4 — Extend `OnLocationChanged` to fire page views**

Find the existing handler (lines 66–70):

```csharp
    private void OnLocationChanged(object? sender, Microsoft.AspNetCore.Components.Routing.LocationChangedEventArgs e)
    {
        UpdateCtaVisibility(e.Location);
        StateHasChanged();
    }
```

Replace with:

```csharp
    private void OnLocationChanged(object? sender, Microsoft.AspNetCore.Components.Routing.LocationChangedEventArgs e)
    {
        UpdateCtaVisibility(e.Location);
        StateHasChanged();
        _ = Analytics.TrackPageViewAsync(e.Location);
    }
```

- [ ] **Step 5 — Add the `OnConsentChanged` handler**

Find the closing `}` of `OnLocationChanged` (just edited above) and insert
the new handler immediately after `OnLocationChanged`:

```csharp
    private void OnConsentChanged()
    {
        _ = Analytics.SetConsentAsync(Consent.IsGranted);
    }
```

- [ ] **Step 6 — Unsubscribe in `Dispose`**

Find the existing `Dispose` (lines 80–85):

```csharp
    public void Dispose()
    {
        CultureService.CultureChanged -= OnCultureChanged;
        Navigation.LocationChanged -= OnLocationChanged;
        GC.SuppressFinalize(this);
    }
```

Replace with:

```csharp
    public void Dispose()
    {
        CultureService.CultureChanged -= OnCultureChanged;
        Navigation.LocationChanged -= OnLocationChanged;
        Consent.OnChanged -= OnConsentChanged;
        GC.SuppressFinalize(this);
    }
```

- [ ] **Step 7 — Build to confirm everything compiles**

Run: `dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj`

Expected: build succeeds.

- [ ] **Step 8 — Commit**

```bash
git add IdeaStudio.Website/MainLayout.razor
git commit -m "feat(cookies): mount banner + hook page-view + consent in MainLayout"
```

---

## Task 11 — Footer "Gestion des cookies" link

**Files:**

- Modify: `IdeaStudio.Website/Components/Footer.razor`

Add a button that calls `IConsentService.Reset()`. We use a `<button>` styled
as a link (not an `<a>`) because there is no destination URL — the action is
state mutation.

- [ ] **Step 1 — Inject the consent service**

Open `IdeaStudio.Website/Components/Footer.razor`. Find the existing inject
(line 3):

```razor
@inject ILocalizedRoute LocalizedRoute
```

Add immediately after:

```razor
@inject IConsentService Consent
```

- [ ] **Step 2 — Add the link inside the legal column**

Find the legal column (lines 27–31):

```razor
        <div class="ds-footer__col">
            <div class="ds-footer__label">@legalLabel</div>
            <a href="@LocalizedRoute.For("legal")">@legalText</a>
            <a href="@LocalizedRoute.For("privacy")">@privacyText</a>
        </div>
```

Replace with:

```razor
        <div class="ds-footer__col">
            <div class="ds-footer__label">@legalLabel</div>
            <a href="@LocalizedRoute.For("legal")">@legalText</a>
            <a href="@LocalizedRoute.For("privacy")">@privacyText</a>
            <button type="button" class="ds-footer__link-btn" @onclick="OpenCookieSettings">@manageCookiesText</button>
        </div>
```

- [ ] **Step 3 — Add the field, the i18n loader, and the click handler**

Find the field declarations (lines 36–45):

```csharp
    private string taglineText = "Lyon · Paris · Genève · Fribourg — remote";
    private string sitemapLabel = "Plan du site";
    private string homeText = "Accueil";
    private string servicesText = "Services";
    private string realisationsText = "Réalisations";
    private string cvText = "Parcours";
    private string contactLabel = "Contact";
    private string legalLabel = "Légal";
    private string legalText = "Mentions légales";
    private string privacyText = "Confidentialité";
```

Add a new line at the bottom:

```csharp
    private string manageCookiesText = "Gestion des cookies";
```

Find `LoadTexts()` (lines 47–60). Replace the whole method body with this
expanded version (adds the new key + uses `LocalizationService` like the
banner does, while keeping the existing inline-FR/EN choice for the lines that
were already there — we keep the existing pattern to minimize diff):

```csharp
    protected override void LoadTexts()
    {
        bool fr = CultureService.CurrentCulture.Name.StartsWith("fr");
        taglineText        = fr ? "Lyon · Paris · Genève · Fribourg — remote" : "Lyon · Paris · Geneva · Fribourg — remote";
        sitemapLabel       = fr ? "Plan du site" : "Sitemap";
        homeText           = fr ? "Accueil" : "Home";
        servicesText       = fr ? "Services" : "Services";
        realisationsText   = fr ? "Réalisations" : "Projects";
        cvText             = fr ? "Parcours" : "Resume";
        contactLabel       = fr ? "Contact" : "Contact";
        legalLabel         = fr ? "Légal" : "Legal";
        legalText          = fr ? "Mentions légales" : "Legal";
        privacyText        = fr ? "Confidentialité" : "Privacy";
        manageCookiesText  = LocalizationService.GetString("Cookies.FooterManage");
    }
```

Then, immediately after `LoadTexts()`, add the click handler:

```csharp

    private async Task OpenCookieSettings()
    {
        await Consent.ResetAsync();
    }
```

- [ ] **Step 4 — Add a tiny SCSS rule for the link-styled button**

Open `IdeaStudio.Website/wwwroot/scss/components/_footer.scss`, scroll to
the bottom, and append:

```scss
.ds-footer__link-btn {
  appearance: none;
  background: none;
  border: 0;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  text-align: start;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 0.2em;
  transition: text-decoration-color 180ms var(--ease-out);

  &:hover,
  &:focus-visible {
    text-decoration-color: currentColor;
  }
}
```

- [ ] **Step 5 — Recompile styles and build**

```bash
cd IdeaStudio.Website && npm run compile-styles
cd .. && dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: both succeed.

- [ ] **Step 6 — Commit**

```bash
git add IdeaStudio.Website/Components/Footer.razor \
       IdeaStudio.Website/wwwroot/scss/components/_footer.scss \
       IdeaStudio.Website/wwwroot/css/styles.min.css
git commit -m "feat(cookies): add 'Gestion des cookies' footer link"
```

---

## Task 12 — Rewrite `Privacy.razor`

**Files:**

- Modify: `IdeaStudio.Website/Pages/Privacy.razor`

The current page wrongly states "Ce site ne collecte aucune donnée
personnelle et n'utilise aucun cookie de suivi." Once trackers ship, this is
false and a CNIL liability. We rewrite the "Données collectées" / "Data we
collect" section, **add a new `#cookies` anchor section** (linked from the
banner), and update the lead text to match.

- [ ] **Step 1 — Replace the FR `<h2>Données collectées</h2>` paragraph**

Find this block (lines 17–21 in `Pages/Privacy.razor`):

```razor
            @if (isFr)
            {
                <h2 class="ds-longform__h2">Données collectées</h2>
                <p>Ce site ne collecte aucune donnée personnelle et n'utilise aucun cookie de suivi. Aucun outil
                   d'analyse tiers (Google Analytics, Plausible, etc.) n'est installé.</p>
```

Replace with:

```razor
            @if (isFr)
            {
                <h2 class="ds-longform__h2">Données collectées</h2>
                <p>Ce site n'exige pas de compte et ne collecte aucune donnée d'identification directe.
                   Une mesure d'audience anonymisée est en place — voir la section
                   <a class="ds-link" href="#cookies">Cookies & traceurs</a> ci-dessous pour la liste complète.</p>

                <h2 id="cookies" class="ds-longform__h2">@cookiesTitle</h2>
                <p>Lorsque vous visitez le site pour la première fois, une bannière vous propose d'accepter ou
                   de refuser ces traceurs. Tant que vous n'avez pas choisi, aucun cookie de mesure n'est déposé
                   (Google Consent Mode v2). Vous pouvez modifier votre choix à tout moment via le lien
                   <em>Gestion des cookies</em> dans le pied de page.</p>
                <ul class="ds-longform__list">
                    <li><strong>Google Analytics 4</strong> — mesure d'audience anonymisée. Conservation : 14 mois.</li>
                    <li><strong>Microsoft Clarity</strong> — heatmaps et replays anonymisés. Conservation : 1 an.</li>
                    <li><strong>Meta Pixel</strong> — mesure de campagnes Meta. Conservation : 13 mois.
                        Désactivé tant qu'aucun identifiant n'est configuré.</li>
                </ul>
                <p>Votre choix est conservé localement (localStorage) pendant 13 mois maximum, conformément
                   aux recommandations de la CNIL.</p>
```

- [ ] **Step 2 — Replace the EN `<h2>Data we collect</h2>` paragraph**

Find this block (lines 38–40):

```razor
                <h2 class="ds-longform__h2">Data we collect</h2>
                <p>This site collects no personal data and uses no tracking cookies. No third-party analytics
                   (Google Analytics, Plausible, etc.) are installed.</p>
```

Replace with:

```razor
                <h2 class="ds-longform__h2">Data we collect</h2>
                <p>This site requires no account and collects no directly-identifying data.
                   Anonymous audience measurement is enabled — see the
                   <a class="ds-link" href="#cookies">Cookies &amp; trackers</a> section below for the full list.</p>

                <h2 id="cookies" class="ds-longform__h2">@cookiesTitle</h2>
                <p>On your first visit, a banner lets you accept or decline these trackers. Until you choose,
                   no measurement cookies are set (Google Consent Mode v2). You can change your decision at any
                   time via the <em>Cookie settings</em> link in the footer.</p>
                <ul class="ds-longform__list">
                    <li><strong>Google Analytics 4</strong> — anonymous audience measurement. Retention: 14 months.</li>
                    <li><strong>Microsoft Clarity</strong> — anonymous heatmaps and session replays. Retention: 1 year.</li>
                    <li><strong>Meta Pixel</strong> — Meta campaign measurement. Retention: 13 months.
                        Disabled until an ID is configured.</li>
                </ul>
                <p>Your choice is stored locally (localStorage) for at most 13 months, per CNIL guidance.</p>
```

- [ ] **Step 3 — Update the lead text and add the `cookiesTitle` field**

Find the `LoadTexts` method (lines 69–82):

```csharp
    protected override void LoadTexts()
    {
        isFr = CultureService.CurrentCulture.Name.StartsWith("fr");
        seoLocale    = isFr ? "fr_FR" : "en_US";
        seoCanonical = isFr ? "https://ideastud.io/fr/confidentialite" : "https://ideastud.io/en/privacy";
        seoTitle     = isFr ? "Confidentialité — IdeaStud.io" : "Privacy — IdeaStud.io";
        kicker       = isFr ? "— Légal" : "— Legal";
        titleText    = isFr ? "Confidentialité." : "Privacy.";
        leadText     = isFr
            ? "Zéro tracking, zéro cookie tiers. Voici ce que ça implique."
            : "Zero tracking, zero third-party cookies. Here's what that means.";
        seoDescription = leadText;
    }
```

Replace with:

```csharp
    protected override void LoadTexts()
    {
        isFr = CultureService.CurrentCulture.Name.StartsWith("fr");
        seoLocale    = isFr ? "fr_FR" : "en_US";
        seoCanonical = isFr ? "https://ideastud.io/fr/confidentialite" : "https://ideastud.io/en/privacy";
        seoTitle     = isFr ? "Confidentialité — IdeaStud.io" : "Privacy — IdeaStud.io";
        kicker       = isFr ? "— Légal" : "— Legal";
        titleText    = isFr ? "Confidentialité." : "Privacy.";
        leadText     = isFr
            ? "Mesure d'audience anonymisée, opt-in explicite, choix réversible à tout moment."
            : "Anonymous audience measurement, explicit opt-in, reversible at any time.";
        seoDescription = leadText;
        cookiesTitle = LocalizationService.GetString("Privacy.CookiesTitle");
    }
```

Then add the field next to the other strings (around line 67, after
`private bool isFr = true;`):

```csharp
    private string cookiesTitle = "Cookies & traceurs";
```

- [ ] **Step 4 — Build and run integration tests**

Run: `dotnet test IdeaStudio.sln --filter "FullyQualifiedName~IntegrationTests"`

Expected: PASS — `/fr/confidentialite` and `/en/privacy` routes still
declared on the same component.

- [ ] **Step 5 — Commit**

```bash
git add IdeaStudio.Website/Pages/Privacy.razor
git commit -m "docs(privacy): rewrite to disclose analytics + add #cookies section"
```

---

## Task 13 — Verification & cleanup

**Files:** none (verification only)

- [ ] **Step 1 — Full build, all tests**

Run: `dotnet test IdeaStudio.sln`

Expected: every existing test still passes; `ConsentServiceTests` (8) added.

- [ ] **Step 2 — Bundle budget after analytics module**

Confirm the cinema bundle is still well under 50 KB gzipped:

```bash
gzip -c IdeaStudio.Website/wwwroot/js/cinema.bundle.js | wc -c
```

Expected: under ~10 000 bytes (was ~7.5 KB before; analytics adds < 2 KB).

- [ ] **Step 3 — Manual QA on `dotnet watch`**

Start the site:

```bash
dotnet watch run --project IdeaStudio.Website/IdeaStudio.Website.csproj
```

In a browser, with DevTools → Network filtered to `google-analytics.com,
clarity.ms, facebook.net`:

1. Visit `http://localhost:<port>/fr` — banner appears. **No analytics
   requests** (localhost short-circuit).
2. Click `Accepter` — banner disappears. (Still no requests on localhost; the
   short-circuit is JS-side. Toggle a non-localhost preview if you need to
   observe live network traffic.)
3. Click `Refuser` — banner disappears.
4. Open footer "Gestion des cookies" — banner reappears.
5. Reload — banner stays hidden because consent is persisted.
6. In DevTools → Application → Local Storage, find key `idea_consent` and
   manually edit `ts` to `1` (Unix epoch). Reload — banner reappears
   (13-month expiry).

- [ ] **Step 4 — Production smoke (optional, requires deploy)**

After deploy, on the live site, repeat the network observation. Confirm:

- Without consent: only the gtag.js bootstrap script is loaded; no `collect?...`
  beacons.
- With consent: `collect?...` to `google-analytics.com`, `tag/whf48fcfv3` to
  `clarity.ms`. No `facebook.net` (Pixel ID still null — expected).

- [ ] **Step 5 — Commit any straggler files**

If `cinema.bundle.js` or `styles.min.css` rebuilt during verification, commit them:

```bash
git status
git add IdeaStudio.Website/wwwroot/js/cinema.bundle.js \
       IdeaStudio.Website/wwwroot/js/cinema.bundle.js.map \
       IdeaStudio.Website/wwwroot/css/styles.min.css 2>/dev/null || true
git diff --cached --quiet || git commit -m "chore: rebuild assets after analytics integration"
```

---

## Self-review notes

**Spec coverage check:**

- Spec § "Architecture" → Tasks 1–12 (every layer represented)
- Spec § "Files / New" → Tasks 1, 2, 4, 5, 8, 9 (all 6 new files created)
- Spec § "Files / Modified" → Tasks 3, 4, 6, 7, 9, 10, 11, 12 (all 9 modified files touched)
- Spec § "Consent state" → Task 2 (`ConsentService` impl), Task 1 (tests)
- Spec § "Consent Mode v2 init" → Task 3
- Spec § "JS module API" → Task 4
- Spec § "Banner UX" → Tasks 8 + 9
- Spec § "SPA page-view tracking" → Task 10 (steps 4–6)
- Spec § "Localhost short-circuit" → Task 4 (built into `setConsent`/`trackPageView`)
- Spec § "Privacy page section" → Task 12
- Spec § "Footer link" → Task 11
- Spec § "Three scenarios" → covered by Task 10 wiring (`HasDecided ⇒ SetConsentAsync`, `OnChanged ⇒ SetConsentAsync`, `LocationChanged ⇒ TrackPageViewAsync`)
- Spec § "Testing" → Task 1 (unit), Task 13 (bundle budget, hardcoded paths, integration, manual QA)

**Type / signature consistency:**

- `IConsentService.LoadAsync / AcceptAsync / DeclineAsync / ResetAsync / HasDecided / IsGranted / OnChanged` — all defined in Task 2, used identically in Tasks 8 + 10 + 11.
- `IAnalyticsService.SetConsentAsync(bool) / TrackPageViewAsync(string)` — defined in Task 5, called identically in Task 10.
- `window.ideaAnalytics.setConsent / trackPageView` — defined in Task 4, called by Task 5.
- localStorage key `idea_consent` matches between Task 2 (C#) and Task 13 step 3 (manual QA).
- `Cookies.*` and `Privacy.CookiesTitle` i18n keys defined in Task 7, used in Tasks 8, 11, 12.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-26-analytics-and-cookie-consent.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
