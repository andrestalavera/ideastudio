using IdeaStudio.Website.State;
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

public sealed class ThemeService(IJSRuntime js, Store<AppState> store) : IThemeService
{
    private readonly IJSRuntime js = js;
    private readonly Store<AppState> store = store;

    public async Task<string> GetThemeAsync()
    {
        string theme;
        try { theme = await js.InvokeAsync<string>("ideastudioTheme.get"); }
        catch { theme = store.State.Theme; }
        store.Dispatch(new SetTheme(theme));
        return theme;
    }

    public async Task SetThemeAsync(string theme)
    {
        try { await js.InvokeVoidAsync("ideastudioTheme.set", theme); }
        catch { /* JS not ready (e.g. prerender) — no-op */ }
        store.Dispatch(new SetTheme(theme));
    }

    public async Task<string> ToggleAsync()
    {
        string theme;
        try { theme = await js.InvokeAsync<string>("ideastudioTheme.toggle"); }
        catch { theme = store.State.Theme == "dark" ? "light" : "dark"; }
        store.Dispatch(new SetTheme(theme));
        return theme;
    }
}
