
namespace IdeaStudio.Website.Services;

public interface ILazyLoadingService
{
    Task<T?> LoadDataAsync<T>(string url, CancellationToken cancellationToken = default);
    Task<string?> LoadImageAsync(string imageUrl, CancellationToken cancellationToken = default);
}
