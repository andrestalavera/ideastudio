namespace IdeaStudio.Website.Services;

/// <summary>
/// Translates a content slug between cultures by loading both JSON files and
/// pairing entries by a stable integer id (e.g. Service.Order).
/// </summary>
public interface ISlugTranslator
{
    Task<string?> TranslateServiceSlugAsync(string sourceSlug, string sourceCulture, string targetCulture);
}
