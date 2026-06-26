using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace IdeaStudio.Website.Services;

public interface ILazyLoadingService
{
    Task<T?> LoadDataAsync<T>(string url, CancellationToken cancellationToken = default);
    Task<string?> LoadImageAsync(string imageUrl, CancellationToken cancellationToken = default);
}

public class LazyLoadingService(HttpClient httpClient, ILoggerFactory loggerFactory) : ILazyLoadingService
{
    private readonly ILogger<LazyLoadingService> logger = loggerFactory.CreateLogger<LazyLoadingService>();
    private readonly Dictionary<string, object> cache = [];

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

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

            TData? data = await httpClient.GetFromJsonAsync<TData>(url, JsonOptions, cancellationToken);
            if (data is not null)
            {
                cache[url] = data;
            }
            return data;
        }
        // Only expected I/O / deserialization failures degrade gracefully to default
        // (e.g. a missing or malformed JSON file → empty content, not a crash). Any other
        // exception is a genuine bug and is allowed to propagate rather than be swallowed.
        catch (HttpRequestException ex)
        {
            logger.HttpError(url, ex.Message, ex);
            return default;
        }
        catch (TaskCanceledException ex)
        {
            logger.HttpRequestCanceled(url, ex.Message, ex);
            return default;
        }
        catch (JsonException ex)
        {
            logger.JsonError(url, ex.Message, ex);
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
        catch (HttpRequestException ex)
        {
            logger.HttpError(imageUrl, ex.Message, ex);
            return null;
        }
        catch (TaskCanceledException ex)
        {
            logger.HttpRequestCanceled(imageUrl, ex.Message, ex);
            return null;
        }
    }
}
