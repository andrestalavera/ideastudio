namespace IdeaStudio.Website.Models;

/// <summary>
/// Represents the profile section of the website
/// </summary>
/// <param name="AboutMe">About me section text</param>
/// <param name="Experiences">List of experiences</param>
public record Profile(
    AboutMe AboutMe, 
    IEnumerable<Experience> Experiences,
    IEnumerable<string> TrainingCenters
);