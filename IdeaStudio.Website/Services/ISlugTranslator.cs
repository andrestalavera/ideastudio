namespace IdeaStudio.Website.Services;

/// <summary>
/// Translates a content slug between cultures by reading both culture lists through
/// <see cref="IContentGateway"/> and pairing entries on <c>Service.IconId</c> — a
/// culture-invariant, unique key shared across the FR/EN service JSON files.
/// </summary>
public interface ISlugTranslator
{
    Task<string?> TranslateServiceSlugAsync(string sourceSlug, string sourceCulture, string targetCulture);
}
