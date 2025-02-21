namespace IdeaStudio.Website.Models;


/// <summary>
/// Represents the about me section of the website
/// </summary>
/// <param name="Introduction"></param>
/// <param name="Cards"></param>
/// <param name="Industries"></param>
/// <param name="Languages"></param>
public record AboutMe
{
	public string? Introduction { get; init; }
	public IReadOnlyList<Card>? Cards { get; init; }
	public IReadOnlyList<string>? Languages { get; init; }
}
