using IdeaStudio.Website.State;
using Microsoft.AspNetCore.Components;
using System.Globalization;

namespace IdeaStudio.Website.Services;

public interface ICultureService
{
    CultureInfo CurrentCulture { get; }
    IReadOnlyList<CultureInfo> SupportedCultures { get; }
    Task InitializeAsync();
    Task SetCultureAsync(string culture);
    event Action? CultureChanged;
}

public sealed class CultureService : ICultureService, IDisposable
{
    private static readonly IReadOnlyList<CultureInfo> Supported =
        [CultureInfo.GetCultureInfo("fr"), CultureInfo.GetCultureInfo("en")];

    private readonly NavigationManager navigationManager;
    private readonly Store<AppState> store;
    private string lastSeen;
    private string? cachedCultureName;
    private CultureInfo? cachedCulture;

    public CultureService(NavigationManager navigationManager, Store<AppState> store)
    {
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
                cachedCulture = CultureInfo.GetCultureInfo(name);
            }
            return cachedCulture;
        }
    }

    public IReadOnlyList<CultureInfo> SupportedCultures => Supported;

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
            !Supported.Any(c => c.Name == culture))
        {
            return Task.CompletedTask;
        }

        CultureInfo resolved = CultureInfo.GetCultureInfo(culture);
        CultureInfo.DefaultThreadCurrentCulture = resolved;
        CultureInfo.DefaultThreadCurrentUICulture = resolved;

        store.Dispatch(new SetCulture(culture));
        return Task.CompletedTask;
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
