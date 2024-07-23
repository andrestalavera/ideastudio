namespace IdeaStudio.Website.Models;

/// <summary>
/// Represents the about me section of the website
/// </summary>
/// <param name="Introduction"></param>
/// <param name="KeyTechnologies"></param>
/// <param name="Industries"></param>
/// <param name="RecentProjects"></param>
/// <param name="PersonalAttributes"></param>
/// <param name="Languages"></param>
public record AboutMeSection(
    IReadOnlyList<string> Introduction,
    IReadOnlyList<Card> KeyTechnologies,
    IReadOnlyList<string> Industries,
    IReadOnlyList<string> RecentProjects,
    IReadOnlyList<string> PersonalAttributes,
    IReadOnlyList<string> Languages
);
