using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Services;

public class SlugTranslator(ILazyLoadingService lazyLoading) : ISlugTranslator
{
    private readonly ILazyLoadingService lazyLoading = lazyLoading;

    public async Task<string?> TranslateServiceSlugAsync(string sourceSlug, string sourceCulture, string targetCulture)
    {
        if (string.IsNullOrEmpty(sourceSlug)) return null;
        string src = sourceCulture.StartsWith("fr") ? "fr" : "en";
        string tgt = targetCulture.StartsWith("fr") ? "fr" : "en";
        if (src == tgt) return sourceSlug;

        List<Service>? sourceList = await lazyLoading.LoadDataAsync<List<Service>>($"data/services-{src}.json");
        List<Service>? targetList = await lazyLoading.LoadDataAsync<List<Service>>($"data/services-{tgt}.json");
        if (sourceList is null || targetList is null) return null;

        Service? match = sourceList.FirstOrDefault(s => string.Equals(s.Slug, sourceSlug, StringComparison.OrdinalIgnoreCase));
        if (match is null) return null;

        Service? twin = targetList.FirstOrDefault(s => s.Order == match.Order);
        return twin?.Slug;
    }
}
