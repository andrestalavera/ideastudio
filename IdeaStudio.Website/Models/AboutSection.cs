namespace IdeaStudio.Website.Models;

/// <summary>
/// Represents an about section
/// </summary>
/// <param name="Title">About section title</param>
/// <param name="Paragraphs">About section paragraphs</param>
public record AboutSection
{
    public string? Title { get; init; }
    public IEnumerable<string>? Paragraphs { get; init; }
}
