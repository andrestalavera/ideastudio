namespace IdeaStudio.Website.Models;

public record Realisation(
    string Slug,
    string Title,
    string Client,
    string Summary,
    string ImageUrl,
    string ImageAlt,
    string LiveUrl,
    RealisationType Type,
    IReadOnlyList<string> Technologies,
    DateOnly CompletedOn,
    int DisplayOrder
);

public enum RealisationType
{
    SiteVitrine,
    ApplicationWeb,
    ApplicationMobile,
    ApiBackend,
    Formation,
    Autre
}
