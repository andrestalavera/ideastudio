namespace IdeaStudio.Website.Models;

/// <summary>
/// Represents a generic card
/// </summary>
/// <param name="Title"></param>
/// <param name="Banner"></param>
/// <param name="Paragraphs"></param>
/// <param name="Images"></param>
/// <param name="Icons"></param>
/// <param name="Link"></param>
public record Card
{
	public string? Title { get; init; }
	public string? Banner { get; init; }
	public IEnumerable<string>? Paragraphs { get; init; }
	public IEnumerable<string>? Images { get; init; }
	public IEnumerable<string>? Icons { get; init; }
	public string? Link { get; init; }
}
