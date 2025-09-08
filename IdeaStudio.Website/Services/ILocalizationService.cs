using System.Text.Json;

namespace IdeaStudio.Website.Services;

public interface ILocalizationService
{
    string GetString(string key);
    Task LoadCultureAsync(string culture);
}

public class LocalizationService(HttpClient httpClient) : ILocalizationService
{
    private readonly HttpClient httpClient = httpClient;
    private readonly Dictionary<string, Dictionary<string, string>> cultureCache = [];
    private Dictionary<string, string> localizedStrings = [];

    public string GetString(string key)
    {
        if (localizedStrings.TryGetValue(key, out string? value))
        {
            return value;
        }

        return key;
    }

    public async Task LoadCultureAsync(string culture)
    {
        // Check cache first
        if (cultureCache.TryGetValue(culture, out Dictionary<string, string>? cachedStrings))
        {
            localizedStrings = cachedStrings;
            return;
        }

        try
        {
            HttpResponseMessage response = await httpClient.GetAsync($"i18n/{culture}.json");
            if (response.IsSuccessStatusCode)
            {
                string? json = await response.Content.ReadAsStringAsync();
                var strings = JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? [];

                // Cache the loaded strings
                cultureCache[culture] = strings;
                localizedStrings = strings;
            }
        }
        catch
        {
            // Fallback to empty dictionary if loading fails
            localizedStrings = [];
        }
    }
}
