using System.Collections.Concurrent;
using System.Net.Http.Json;

namespace IdeaStudio.Website.Services;

public class LazyLoadingService(HttpClient httpClient) : ILazyLoadingService
{
	private readonly HttpClient httpClient = httpClient;
	private readonly ConcurrentDictionary<string, object> cache = [];
	private readonly SemaphoreSlim semaphore = new(1, 1);

	public async Task<TData?> LoadDataAsync<TData>(string url, CancellationToken cancellationToken = default)
	{
		await semaphore.WaitAsync(cancellationToken);
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
			if (data != null)
			{
				cache[url] = data;
			}
			return data;
		}
		finally
		{
			semaphore.Release();
		}
	}

	public async Task<string?> LoadImageAsync(string imageUrl, CancellationToken cancellationToken = default)
	{
		await semaphore.WaitAsync(cancellationToken);
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
		catch
		{
			return null;
		}
		finally
		{
			semaphore.Release();
		}
	}
}
