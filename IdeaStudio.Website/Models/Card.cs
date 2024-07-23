namespace IdeaStudio.Website.Models;

/// <summary>
/// Represents a generic card
/// </summary>
/// <param name="Icon"></param>
/// <param name="Title"></param>
/// <param name="Subtitle"></param>
/// <param name="Paragraphs1"></param>
/// <param name="Images"></param>
/// <param name="Paragraphs2"></param>
public record Card(
    string Icon,
    string Title,
    string Subtitle,
    IEnumerable<string> Paragraphs1,
    IEnumerable<string> Images,
    IEnumerable<string> Paragraphs2);