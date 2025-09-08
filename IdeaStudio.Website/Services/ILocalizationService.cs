using System.Text.Json;

namespace IdeaStudio.Website.Services;

public interface ILocalizationService
{
	string GetString(string key);
	Task LoadCultureAsync(string culture);
}

public class LocalizationService(HttpClient httpClient) : ILocalizationService
{
	private readonly HttpClient _httpClient = httpClient;
	private readonly Dictionary<string, Dictionary<string, string>> _cultureCache = [];
	private Dictionary<string, string> _localizedStrings = [];

	public string GetString(string key)
	{
		if (_localizedStrings.TryGetValue(key, out var value))
			return value;

		return key;
	}

	public async Task LoadCultureAsync(string culture)
	{
		// Check cache first
		if (_cultureCache.TryGetValue(culture, out var cachedStrings))
		{
			_localizedStrings = cachedStrings;
			return;
		}

		try
		{
			var response = await _httpClient.GetAsync($"i18n/{culture}.json");
			if (response.IsSuccessStatusCode)
			{
				var json = await response.Content.ReadAsStringAsync();
				var strings = JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? [];

				// Cache the loaded strings
				_cultureCache[culture] = strings;
				_localizedStrings = strings;
			}
		}
		catch
		{
			// Fallback to empty dictionary if loading fails
			_localizedStrings = [];
		}
	}
}
