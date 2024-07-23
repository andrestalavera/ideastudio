namespace IdeaStudio.Website.Models;

public record TrainingCenter(
    string Name,
    IEnumerable<string> Locations,
    IEnumerable<string> Courses
);
