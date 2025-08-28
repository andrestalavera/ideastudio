namespace IdeaStudio.Website.Models;

public record TrainingCenter(
    string? Name,
    string? Id,
    IEnumerable<string>? Locations,
    IEnumerable<string>? Courses
);
