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
	private Dictionary<string, string> _localizedStrings = [];

	public string GetString(string key)
	{
		if (_localizedStrings.TryGetValue(key, out var value))
			return value;

		return key; // Fallback to key if not found
	}

	public async Task LoadCultureAsync(string culture)
	{
		try
		{
			var response = await _httpClient.GetAsync($"i18n/{culture}.json");
			if (response.IsSuccessStatusCode)
			{
				var json = await response.Content.ReadAsStringAsync();
				_localizedStrings = JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? [];
			}
		}
		catch
		{
			// Fallback to empty dictionary if loading fails
			_localizedStrings = [];
		}
	}
}
