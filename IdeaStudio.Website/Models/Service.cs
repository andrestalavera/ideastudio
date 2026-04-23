namespace IdeaStudio.Website.Models;

public record Service(
    string Slug,
    string Title,
    string Kicker,
    string Tagline,
    string IconId,
    string Summary,
    IReadOnlyList<string> Highlights,
    IReadOnlyList<UseCase> UseCases,
    IReadOnlyList<FaqEntry> Faq,
    string? CtaLabel,
    int Order
);

public record UseCase(string Title, string Description);

public record FaqEntry(string Question, string Answer);
