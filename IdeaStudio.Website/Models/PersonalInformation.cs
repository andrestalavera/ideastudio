namespace IdeaStudio.Website.Models;

/// <summary>
/// Represents the personal information section of someone's resume
/// </summary>
/// <param name="Name">Full name</param>
/// <param name="Hero">Hero text</param>
/// <param name="Title">Job title</param>
/// <param name="Introduction">Short introduction</param>
/// <param name="Email">Email address</param>
public record PersonalInformation
{
    public string? Name { get; set; }
    public string? Hero { get; set; }
    public string? Title { get; set; }
    public string? Introduction { get; init; }
    public IDictionary<string, string>? Languages { get; set; }
    public string? Email { get; set; }
    public string? GitHub { get; set; }
    public string? LinkedIn { get; set; }
    public string? Website { get; set; }
}
