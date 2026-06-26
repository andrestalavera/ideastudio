using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Services;

public class SlugTranslator(IContentGateway content) : ISlugTranslator
{
    private readonly IContentGateway content = content;

    public async Task<string?> TranslateServiceSlugAsync(string sourceSlug, string sourceCulture, string targetCulture)
    {
        if (string.IsNullOrEmpty(sourceSlug)) return null;
        string src = sourceCulture.StartsWith("fr", StringComparison.Ordinal) ? "fr" : "en";
        string tgt = targetCulture.StartsWith("fr", StringComparison.Ordinal) ? "fr" : "en";
        if (src == tgt) return sourceSlug;

        IReadOnlyList<Service> sourceList = await content.GetServicesAsync(src);
        IReadOnlyList<Service> targetList = await content.GetServicesAsync(tgt);

        Service? match = sourceList.FirstOrDefault(s => string.Equals(s.Slug, sourceSlug, StringComparison.OrdinalIgnoreCase));
        if (match is null) return null;

        // Pair across cultures on IconId: a culture-invariant, unique identifier present in
        // both services-fr.json and services-en.json (e.g. "consulting"). Far more stable
        // than the previous Order-equality pairing, which broke if either list was reordered.
        Service? twin = targetList.FirstOrDefault(s => string.Equals(s.IconId, match.IconId, StringComparison.OrdinalIgnoreCase));
        return twin?.Slug;
    }
}
