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
    int DisplayOrder,
    CaseStudy? CaseStudy = null
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

/// <summary>
/// Long-form project story. Benefit-first (Challenge → Approach → Outcome),
/// then the technical depth: key decisions with their rationale, headline
/// metrics, deeper sections, and the stack. Optional on a <see cref="Realisation"/>;
/// when present, the project tile deep-links to the case-study page.
/// </summary>
public record CaseStudy(
    string Sector,
    string Role,
    string Timeline,
    string Challenge,
    string Approach,
    string Outcome,
    string? DiagramImage,
    string? DiagramAlt,
    IReadOnlyList<CaseStudyStat> Stats,
    IReadOnlyList<CaseStudyDecision> Decisions,
    IReadOnlyList<CaseStudySection> Sections,
    IReadOnlyList<string> Stack
);

public record CaseStudyStat(string Value, string Label);

/// <summary>A design/architecture choice and the reasoning behind it.</summary>
public record CaseStudyDecision(string Title, string Detail);

public record CaseStudySection(string Title, IReadOnlyList<string> Body);
