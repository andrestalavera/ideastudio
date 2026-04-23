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
