namespace IdeaStudio.Website.Models;

/// <summary>
/// A single training module from the public catalogue rendered on /services/formateur.
/// </summary>
public sealed class Training
{
    public required string Slug { get; init; }
    public required string Title { get; init; }
    public required string Summary { get; init; }
    public required string Category { get; init; }
    public required IReadOnlyList<string> Outline { get; init; }
    public string? Prerequisites { get; init; }
    public int? DurationDays { get; init; }
    public string? Level { get; init; }
    public string? Audience { get; init; }
    public string? Certification { get; init; }
}
