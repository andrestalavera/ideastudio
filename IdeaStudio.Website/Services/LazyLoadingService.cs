using System.Net.Http.Json;

namespace IdeaStudio.Website.Services;

public class LazyLoadingService(HttpClient httpClient) : ILazyLoadingService
{
	private readonly HttpClient _httpClient = httpClient;
	private readonly Dictionary<string, object> _cache = [];
	private readonly SemaphoreSlim _semaphore = new(1, 1);

	public async Task<T?> LoadDataAsync<T>(string url, CancellationToken cancellationToken = default)
	{
		await _semaphore.WaitAsync(cancellationToken);
		try
		{
			if (_cache.TryGetValue(url, out object? cachedData))
			{
				return (T)cachedData;
			}

			T? data = await _httpClient.GetFromJsonAsync<T>(url, cancellationToken);
			if (data != null)
			{
				_cache[url] = data;
			}
			return data;
		}
		finally
		{
			_semaphore.Release();
		}
	}

	public async Task<string?> LoadImageAsync(string imageUrl, CancellationToken cancellationToken = default)
	{
		await _semaphore.WaitAsync(cancellationToken);
		try
		{
			if (_cache.TryGetValue(imageUrl, out object? cachedUrl))
			{
				return (string)cachedUrl;
			}

			// In a real scenario, you might want to preload the image or validate it exists
			HttpResponseMessage response = await _httpClient.GetAsync(imageUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
			if (response.IsSuccessStatusCode)
			{
				_cache[imageUrl] = imageUrl;
				return imageUrl;
			}
			return null;
		}
		catch
		{
			return null;
		}
		finally
		{
			_semaphore.Release();
		}
	}
}
