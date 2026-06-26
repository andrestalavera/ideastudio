using IdeaStudio.Website.State;
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

public class CultureService : ICultureService, IDisposable
{
    private readonly IJSRuntime jsRuntime;
    private readonly NavigationManager navigationManager;
    private readonly Store<AppState> store;
    private string lastSeen;
    private string? cachedCultureName;
    private CultureInfo? cachedCulture;

    public CultureService(IJSRuntime jsRuntime, NavigationManager navigationManager, Store<AppState> store)
    {
        this.jsRuntime = jsRuntime;
        this.navigationManager = navigationManager;
        this.store = store;
        lastSeen = store.State.Culture;
        store.Changed += RelayCultureChange;
    }

    public CultureInfo CurrentCulture
    {
        get
        {
            // The store is the source of truth; rebuild the CultureInfo only when the
            // underlying culture string changes, so frequent reads don't allocate.
            string name = store.State.Culture;
            if (cachedCulture is null || cachedCultureName != name)
            {
                cachedCultureName = name;
                cachedCulture = new CultureInfo(name);
            }
            return cachedCulture;
        }
    }

    public List<CultureInfo> SupportedCultures => [
        new CultureInfo("fr"),
        new CultureInfo("en")
    ];

    public event Action? CultureChanged;

    public Task InitializeAsync()
    {
        string path = new Uri(navigationManager.Uri).AbsolutePath;
        string? fromUrl = CulturePath.ExtractCulture(path);
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

        CultureInfo resolved = new(culture);
        CultureInfo.DefaultThreadCurrentCulture = resolved;
        CultureInfo.DefaultThreadCurrentUICulture = resolved;

        store.Dispatch(new SetCulture(culture));
        return Task.CompletedTask;
    }

    public async Task SwitchToAsync(string culture)
    {
        // The actual path translation is done by CultureSelector via ILocalizedRoute — this method
        // only updates the internal state. It exists to keep SetCultureAsync as a pure state change
        // while the selector composes with LocalizedRoute to navigate.
        await SetCultureAsync(culture);
    }

    public void Dispose() => store.Changed -= RelayCultureChange;

    private void RelayCultureChange()
    {
        string current = store.State.Culture;
        if (current == lastSeen) { return; }
        lastSeen = current;
        CultureChanged?.Invoke();
    }
}
