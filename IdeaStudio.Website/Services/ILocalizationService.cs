namespace IdeaStudio.Website.Services;

public interface ILocalizationService
{
    string GetString(string key);
    Task LoadCultureAsync(string culture);
}

public class LocalizationService(ILazyLoadingService loader) : ILocalizationService
{
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
        Dictionary<string, string>? strings = await loader.LoadDataAsync<Dictionary<string, string>>($"i18n/{culture}.json");
        localizedStrings = strings ?? [];
    }
}
