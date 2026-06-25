namespace IdeaStudio.Website.Models;

/// <summary>
/// A client / colleague recommendation. The quote is stored in both languages;
/// <see cref="OriginalLang"/> records the language it was actually written in so
/// the UI can mark the other version as a translation.
/// </summary>
public record Testimonial(
    string Name,
    string Role,
    string OriginalLang,
    string QuoteFr,
    string QuoteEn,
    string? ContextFr = null,
    string? ContextEn = null,
    int DisplayOrder = 0
);
