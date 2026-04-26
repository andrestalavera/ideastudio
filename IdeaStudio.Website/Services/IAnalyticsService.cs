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
