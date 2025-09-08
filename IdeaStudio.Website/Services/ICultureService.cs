using Microsoft.JSInterop;
using System.Globalization;

namespace IdeaStudio.Website.Services;

public interface ICultureService
{
	CultureInfo CurrentCulture { get; }
	List<CultureInfo> SupportedCultures { get; }
	Task InitializeAsync();
	Task SetCultureAsync(string culture);
	event Action? CultureChanged;
}

public class CultureService(IJSRuntime jsRuntime) : ICultureService
{
    private readonly IJSRuntime _jsRuntime = jsRuntime;
    private CultureInfo _currentCulture = new("en");

	public CultureInfo CurrentCulture => _currentCulture;

    public List<CultureInfo> SupportedCultures =>
	[
		new CultureInfo("en"),
        new CultureInfo("fr")
    ];

    public event Action? CultureChanged;

    public async Task InitializeAsync()
    {
        try
        {
            // Try to get saved culture from localStorage
            var savedCulture = await _jsRuntime.InvokeAsync<string>("localStorage.getItem", "preferredCulture");

            if (!string.IsNullOrEmpty(savedCulture) && SupportedCultures.Any(c => c.Name == savedCulture))
            {
                await SetCultureAsync(savedCulture);
                return;
            }

            // Try to get browser language
            var browserLanguage = await _jsRuntime.InvokeAsync<string>("navigator.language");
            if (!string.IsNullOrEmpty(browserLanguage))
            {
                var cultureName = browserLanguage.Split('-')[0]; // Get language part (en from en-US)
                if (SupportedCultures.Any(c => c.Name == cultureName))
                {
                    await SetCultureAsync(cultureName);
                    return;
                }
            }
        }
        catch
        {
            // If any JavaScript call fails, fall back to default
        }

        // Default to English
        await SetCultureAsync("en");
    }

    public async Task SetCultureAsync(string culture)
    {
        if (string.IsNullOrWhiteSpace(culture) ||
            !SupportedCultures.Any(c => c.Name == culture))
            return;

        _currentCulture = new CultureInfo(culture);
        CultureInfo.DefaultThreadCurrentCulture = _currentCulture;
        CultureInfo.DefaultThreadCurrentUICulture = _currentCulture;

        // Save to localStorage
        try
        {
            await _jsRuntime.InvokeVoidAsync("localStorage.setItem", "preferredCulture", culture);
        }
        catch
        {
            // Ignore localStorage errors
        }

        CultureChanged?.Invoke();
    }
}

