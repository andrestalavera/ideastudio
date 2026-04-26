# Analytics & Cookie Consent — Design Spec

**Date:** 2026-04-26
**Status:** Approved (brainstorming) — pending implementation plan

## Goal

Add three third-party analytics trackers to the IdeaStudio website:

1. **Google Analytics 4** — measurement ID `G-VFWV1QDJFB`
2. **Microsoft Clarity** — project ID `whf48fcfv3`
3. **Meta Pixel** — ID not yet available; must be wired-up but disabled until provided

Ship a CNIL-compliant cookie-consent banner that gates the trackers, persists the
user's choice for up to 13 months, and lets the user revisit the choice from the
footer.

## Constraints

- Blazor WebAssembly SPA — no server-side rendering, no HTTP cookies set by the
  app itself; consent state lives in `localStorage`.
- Editorial dark-first design system (`DESIGN.md`); banner must blend, not
  overlay-block.
- Bilingual (FR/EN) — every user-facing string lives in `wwwroot/i18n/{fr,en}.json`.
- Localhost (`localhost`, `127.0.0.1`) must never hit third-party endpoints.
- Bundle budget: `cinema.bundle.js` gzipped ≤ 50 KB
  (`BundleBudgetTests.cs`) — analytics module must respect this.
- No hard-coded routes — go through `ILocalizedRoute` for the
  privacy-page anchor link.
- Refuser must be as easy as Accepter (CNIL): same visual weight, side-by-side.

## Architecture

```text
┌───────────────────────────────────────────────────────────────┐
│ index.html (loads BEFORE Blazor)                              │
│  ├─ Consent Mode v2 init: all storage flags = "denied"        │
│  ├─ gtag.js?id=G-VFWV1QDJFB loaded (no PII collected yet)     │
│  └─ Clarity + fbq stubs (script tags injected on consent)     │
└───────────────────────────────────────────────────────────────┘
                  ▼
┌───────────────────────────────────────────────────────────────┐
│ Blazor WASM                                                   │
│                                                               │
│  IConsentService (Scoped)                                     │
│    - localStorage key 'idea_consent' = {state, ts}            │
│    - HasDecided / IsGranted                                   │
│    - Accept() / Decline() / Reset()                           │
│    - event Action OnChanged                                   │
│                                                               │
│  IAnalyticsService (Scoped)                                   │
│    - InitializeAsync()                                        │
│    - SetConsentAsync(bool granted)                            │
│    - TrackPageViewAsync(string url)                           │
│    Calls JS: window.ideaAnalytics.{setConsent,trackPageView}  │
│                                                               │
│  CookieBanner.razor                                           │
│    - Visible iff !ConsentService.HasDecided                   │
│    - Subscribes ConsentService.OnChanged                      │
│                                                               │
│  MainLayout.razor                                             │
│    - Subscribes NavigationManager.LocationChanged             │
│      → AnalyticsService.TrackPageViewAsync                    │
│    - Mounts <CookieBanner />                                  │
│                                                               │
│  Footer.razor                                                 │
│    - "Gestion des cookies" link → ConsentService.Reset()      │
│                                                               │
│  Privacy.razor                                                │
│    - New section anchored #cookies                            │
└───────────────────────────────────────────────────────────────┘
                  ▼
┌───────────────────────────────────────────────────────────────┐
│ JS module wwwroot/src/cinema/analytics/index.js               │
│  Exposes window.ideaAnalytics:                                │
│    - setConsent(granted)                                      │
│        → gtag('consent','update',{...granted/denied})         │
│        → if granted: lazy-load Clarity script                 │
│        → if granted && META_PIXEL_ID: lazy-load fbq script    │
│    - trackPageView(url)                                       │
│        → gtag('event','page_view',{page_location, page_title})│
│        → clarity('set','page', url)  (if loaded)              │
│        → fbq('track','PageView')     (if loaded)              │
│  Localhost short-circuit: all methods become no-ops           │
└───────────────────────────────────────────────────────────────┘
```

## Files

### New

| Path | Purpose |
| --- | --- |
| `IdeaStudio.Website/Services/IConsentService.cs` | Interface + `ConsentService` impl |
| `IdeaStudio.Website/Services/IAnalyticsService.cs` | Interface + `AnalyticsService` impl |
| `IdeaStudio.Website/Components/CookieBanner.razor` | Banner UI |
| `IdeaStudio.Website/wwwroot/src/cinema/analytics/index.js` | JS interop module |
| `IdeaStudio.Website/wwwroot/scss/components/_cookie-banner.scss` | Banner styles |
| `IdeaStudio.Website.Tests/ConsentServiceTests.cs` | Unit tests for state/persistence/expiry |

### Modified

| Path | Change |
| --- | --- |
| `IdeaStudio.Website/wwwroot/index.html` | Add Consent Mode v2 init + gtag.js + Clarity & fbq stubs |
| `IdeaStudio.Website/wwwroot/src/cinema/index.js` | Import analytics module so it ends up in the bundle |
| `IdeaStudio.Website/MainLayout.razor` | Hook `LocationChanged`; mount `<CookieBanner />` |
| `IdeaStudio.Website/Components/Footer.razor` | Add "Gestion des cookies" link |
| `IdeaStudio.Website/Pages/Privacy.razor` | Add `#cookies` section (FR + EN) |
| `IdeaStudio.Website/wwwroot/i18n/fr.json` | Banner & footer strings |
| `IdeaStudio.Website/wwwroot/i18n/en.json` | Banner & footer strings |
| `IdeaStudio.Website/wwwroot/scss/styles.scss` | `@use 'components/cookie-banner'` |
| `IdeaStudio.Website/Program.cs` | Register `IConsentService` + `IAnalyticsService` (scoped) |

## Detailed behavior

### Consent state

- localStorage key: `idea_consent`
- Value shape: `{"state": "granted" | "denied", "ts": 1714000000000}` (epoch ms, UTC)
- `HasDecided` returns `false` if key missing **or** `now - ts > 13 months`
  (CNIL maximum). Re-prompts after expiry.
- `Accept()` writes `{state:"granted", ts:Date.now()}` and raises `OnChanged`.
- `Decline()` writes `{state:"denied", ts:Date.now()}` and raises `OnChanged`.
- `Reset()` removes the key and raises `OnChanged` (used by footer link).
- `OnChanged` subscribers: `CookieBanner` (re-render) and `MainLayout` (call
  `AnalyticsService.SetConsentAsync`).

### Consent Mode v2 init (index.html, runs before Blazor)

```js
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
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
```

`send_page_view: false` because we drive page views manually from Blazor on
every `LocationChanged`.

### JS module API

```js
// wwwroot/src/cinema/analytics/index.js
const GA_ID        = 'G-VFWV1QDJFB';
const CLARITY_ID   = 'whf48fcfv3';
const META_PIXEL_ID = null; // ← TODO: replace when provided

const isLocalhost = ['localhost', '127.0.0.1'].includes(location.hostname);

function setConsent(granted) { ... }   // updates Consent Mode + lazy-loads
function trackPageView(url)  { ... }   // sends page_view to all loaded trackers

window.ideaAnalytics = { setConsent, trackPageView };
```

When `META_PIXEL_ID` is `null`, the Pixel branch is skipped entirely (no script
ever injected) — so leaving Meta out at launch is safe.

### Banner UX

- Position: `position: fixed; bottom: var(--space-4); left: var(--space-4); right: var(--space-4);`
  max-width 640 px, centered horizontally on wider viewports.
- Card style: dark glass — `background: rgba(5,22,26,.92); backdrop-filter:
  blur(12px); border: 1px solid var(--border-subtle); border-radius:
  var(--radius-lg);`
- Reveal animation: 240 ms `translateY(20px) → 0` + opacity, design-system easing.
- Buttons: `Refuser` (ghost) on the left + `Accepter` (primary) on the right,
  side-by-side. CNIL requires equivalent visual weight — same height, padding,
  font-size; only fill differs.
- a11y: `role="dialog" aria-labelledby="cookie-banner-title"`; banner stays open
  until the user picks a button (Esc does not dismiss).

### SPA page-view tracking

- `MainLayout` (`OnInitialized`) subscribes
  `NavigationManager.LocationChanged += OnLocationChanged;` and implements
  `IDisposable` to unsubscribe.
- Handler:

  ```csharp
  private async void OnLocationChanged(object? sender, LocationChangedEventArgs e)
  {
      await Analytics.TrackPageViewAsync(e.Location);
  }
  ```

- JS module reads `document.title` itself when it sends the page view, so it
  picks up the latest `<title>` after `SeoHead` has patched it.
- A `setTimeout(..., 50)` inside the JS module gives Blazor's render cycle a
  beat to update the DOM before the event fires.

### Localhost short-circuit

- The JS module checks `isLocalhost` once at load time. If true, all exported
  functions become no-ops (no fetch, no script injection).
- Banner is still rendered locally for QA, but clicks have no network impact.

### Privacy page section (`#cookies`)

Added after the existing privacy content. Same component, both cultures
(`Privacy.razor` is bilingual). Lists the three trackers in a small editorial
table:

| Service | Finalité | Durée |
| --- | --- | --- |
| Google Analytics 4 | Mesure d'audience anonymisée | 14 mois |
| Microsoft Clarity | Heatmaps, replays anonymisés | 1 an |
| Meta Pixel | Mesure de campagnes Meta | 13 mois |

Plain prose explains how to revoke via the footer link.

### Footer link

Added next to existing `Mentions légales` / `Confidentialité` links:

- FR: `Gestion des cookies`
- EN: `Cookie settings`

Click handler: `ConsentService.Reset()`. Banner reappears immediately because
`MainLayout` re-renders on `OnChanged`.

## Data flow — the three scenarios

**Scenario 1 — first visit, accepts:**

1. `index.html` runs → Consent Mode default = denied → gtag.js loads but
   collection is gated.
2. Blazor boots → `ConsentService.HasDecided == false` → banner visible.
3. User clicks Accepter → `ConsentService.Accept()` → `OnChanged` fires.
4. `MainLayout` calls `Analytics.SetConsentAsync(true)`.
5. JS module calls `gtag('consent','update', {analytics_storage:'granted', ...})`,
   then injects Clarity and (if `META_PIXEL_ID` set) Meta Pixel scripts.
6. First `page_view` fires for the current URL.
7. Banner unmounts.

**Scenario 2 — first visit, refuses:**
1–2. Same as above.
3. User clicks Refuser → `ConsentService.Decline()` → `OnChanged`.
4. `Analytics.SetConsentAsync(false)` → JS keeps Consent Mode in `denied`. GA
   continues to receive **modeled / cookieless** pings (Consent Mode v2
   behavior). Clarity & Meta scripts are **never** loaded.
5. Banner unmounts.

**Scenario 3 — return visit within 13 months, previously accepted:**

1. `index.html` runs (denied default).
2. Blazor boots → `ConsentService.HasDecided && IsGranted`.
3. `MainLayout` calls `Analytics.SetConsentAsync(true)` immediately on init.
4. Trackers load. No banner.

## Testing

- **Unit (`ConsentServiceTests`)**: state read/write, expiry boundary, reset
  behavior, event firing. Mock `IJSRuntime` for localStorage calls.
- **Bundle budget**: `BundleBudgetTests` already enforces ≤ 50 KB gzipped on
  `cinema.bundle.js`. The analytics module is small (a couple hundred lines)
  but verify after `npm run build`. If it pushes the budget, profile before
  raising.
- **Hardcoded paths**: `HardcodedPathsTests` may flag the `Privacy.razor`
  link to `#cookies`. Use `ILocalizedRoute.For("privacy", culture)` + `#cookies`
  to stay compliant.
- **Manual QA**:
  - DevTools Network: confirm zero analytics requests on localhost.
  - DevTools Network on staging: confirm `collect?...` to `google-analytics.com`
    only after Accepter; never after Refuser.
  - Clarity dashboard receives a session within 5 min of accepting.
  - GA4 DebugView receives `page_view` events on each navigation.
  - 13-month expiry: manually rewrite `localStorage.idea_consent.ts` to an old
    value and verify banner reappears.
  - Footer "Gestion des cookies" link reopens banner.

## Out of scope

- Per-category opt-in (analytics vs marketing) — single grouped consent only.
- Server-side consent storage / cross-device sync — localStorage only.
- Dedicated `/cookies` page — info lives in Privacy section.
- Custom event tracking (button clicks, scroll depth, etc.) — only `page_view`
  is wired. Future events can hang off `IAnalyticsService`.
- Meta Pixel activation — the code path exists but is gated behind
  `META_PIXEL_ID !== null`. Provide the ID later to enable.

## Open follow-ups

- When the Meta Pixel ID is available: replace `META_PIXEL_ID = null` in
  `wwwroot/src/cinema/analytics/index.js` and rebuild. No other change needed.
- Consider adding a `gtag('event', ...)` helper on `IAnalyticsService` if
  custom event tracking becomes a requirement.
