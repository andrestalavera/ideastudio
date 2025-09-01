using System.Collections.Concurrent;
using System.Net.Http.Json;

namespace IdeaStudio.Website.Services;

public class LazyLoadingService(HttpClient httpClient) : ILazyLoadingService
{
	private readonly ConcurrentDictionary<string, object> cache = [];

	public async Task<TData?> LoadDataAsync<TData>(string url, CancellationToken cancellationToken = default)
	{
		try
		{
			if (cache.TryGetValue(url, out object? cachedData))
			{
				if (cachedData is TData typedCachedData)
				{
					return typedCachedData;
				}
			}

			TData? data = await httpClient.GetFromJsonAsync<TData>(url, cancellationToken);
			if (data is not null)
			{
				cache[url] = data;
			}
			return data;
		}

		catch (Exception ex)
		{
			Console.WriteLine($"Error loading data from {url}: {ex.Message}");
			return default;
		}
	}

	public async Task<string?> LoadImageAsync(string imageUrl, CancellationToken cancellationToken = default)
	{
		try
		{
			if (cache.TryGetValue(imageUrl, out object? cachedUrl))
			{
				if (cachedUrl is string stringCachedUrl)
				{
					return stringCachedUrl;
				}
			}

			HttpResponseMessage response = await httpClient.GetAsync(imageUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
			if (response.IsSuccessStatusCode)
			{
				cache[imageUrl] = imageUrl;
				return imageUrl;
			}
			return null;
		}
		catch (Exception ex)
		{
			Console.WriteLine($"Error loading image from {imageUrl}: {ex.Message}");
			return null;
		}
	}
}
