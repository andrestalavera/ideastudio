using System.Text.Json;

namespace IdeaStudio.Website.Services;

public interface ILocalizationService
{
	Task<string> GetStringAsync(string key);
	Task LoadCultureAsync(string culture);
}

public class LocalizationService : ILocalizationService
{
	private readonly HttpClient _httpClient;
	private Dictionary<string, string> _localizedStrings = new();

	public LocalizationService(HttpClient httpClient)
	{
		_httpClient = httpClient;
	}

	public async Task<string> GetStringAsync(string key)
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
				_localizedStrings = JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? new();
			}
		}
		catch
		{
			// Fallback to empty dictionary if loading fails
			_localizedStrings = new Dictionary<string, string>();
		}
	}
}
