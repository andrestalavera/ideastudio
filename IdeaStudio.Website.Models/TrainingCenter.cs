namespace IdeaStudio.Website.Models;

/// <summary>
/// Represents a training center
/// </summary>
/// <param name="Name">Name of the training center</param>
/// <param name="Id">Unique identifier</param>
/// <param name="Locations">Locations of the training center</param>
/// <param name="Courses">Courses offered by the training center</param>
public record TrainingCenter
{
    public string? Name { get; init; }
    public string? Id { get; set; }
    public IEnumerable<string>? Locations { get; init; }
    public IEnumerable<string>? Courses { get; init; }
}
