namespace IdeaStudio.Website.Models;

/// <summary>
/// Represents a training center
/// </summary>
/// <param name="Name">Name of the training center</param>
/// <param name="Id">Unique identifier</param>
/// <param name="Locations">Locations of the training center</param>
/// <param name="Courses">Courses offered by the training center</param>
public record TrainingCenter(
	string? Name,
	string? Id,
	IEnumerable<string>? Locations,
	IEnumerable<string>? Courses
);
