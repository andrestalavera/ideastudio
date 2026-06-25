using Microsoft.JSInterop;

namespace IdeaStudio.Website.Services;

/// <summary>
/// Light/dark theme state. The heavy lifting (no-flash bootstrap, OS-preference
/// resolution, localStorage persistence) lives in the inline script in
/// index.html which exposes <c>window.ideastudioTheme</c>; this service is a
/// thin typed wrapper over it so components stay free of <see cref="IJSRuntime"/>.
/// </summary>
public interface IThemeService
{
    /// <summary>The active theme: <c>"light"</c> or <c>"dark"</c>.</summary>
    Task<string> GetThemeAsync();

    /// <summary>Persist and apply an explicit theme choice.</summary>
    Task SetThemeAsync(string theme);

    /// <summary>Flip the active theme; returns the new theme.</summary>
    Task<string> ToggleAsync();
}

public sealed class ThemeService : IThemeService
{
    private const string Fallback = "dark";
    private readonly IJSRuntime js;

    public ThemeService(IJSRuntime js) => this.js = js;

    public async Task<string> GetThemeAsync()
    {
        try { return await js.InvokeAsync<string>("ideastudioTheme.get"); }
        catch { return Fallback; }
    }

    public async Task SetThemeAsync(string theme)
    {
        try { await js.InvokeVoidAsync("ideastudioTheme.set", theme); }
        catch { /* JS not ready (e.g. prerender) — no-op */ }
    }

    public async Task<string> ToggleAsync()
    {
        try { return await js.InvokeAsync<string>("ideastudioTheme.toggle"); }
        catch { return Fallback; }
    }
}
