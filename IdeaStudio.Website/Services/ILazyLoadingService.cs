
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using System.Net.Http.Json;
using System.Text.Json;

namespace IdeaStudio.Website.Services;

public interface ILazyLoadingService
{
	Task<T?> LoadDataAsync<T>(string url, CancellationToken cancellationToken = default);
	Task<string?> LoadImageAsync(string imageUrl, CancellationToken cancellationToken = default);
}

public class LazyLoadingService(HttpClient httpClient, ILoggerFactory loggerFactory) : ILazyLoadingService
{
	private readonly ILogger<LazyLoadingService> logger = loggerFactory.CreateLogger<LazyLoadingService>();
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
		catch (HttpRequestException ex)
		{
			logger.LogCritical("HTTP error loading data from {Url}: {Message}", url, ex.Message);
		}
		catch (TaskCanceledException ex)
		{
			logger.LogCritical("Request canceled loading data from {Url}: {Message}", url, ex.Message);
			return default;
		}
		catch (JsonException ex)
		{
			logger.LogCritical("JSON error loading data from {Url}: {Message}", url, ex.Message);
			return default;
		}
		catch (Exception ex)
		{
			logger.LogCritical("Unknown error loading data from {Url}: {Message}", url, ex.Message);
		}
		return default;
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
		catch (HttpRequestException ex)
		{
			logger.LogError(ex, "HTTP request failed for image URL: {ImageUrl}", imageUrl);
			return null;
		}
		catch (TaskCanceledException ex)
		{
			logger.LogWarning(ex, "HTTP request was canceled for image URL: {ImageUrl}", imageUrl);
			return null;
		}
		catch (Exception ex)
		{
			logger.LogCritical("Error loading image from {ImageUrl}: {Message}", imageUrl, ex.Message);
			return null;
		}
	}
}
