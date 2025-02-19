using System.Collections.Generic;

namespace IdeaStudio.Website.Models;

/// <summary>
/// Represents an individual work experience
/// </summary>
/// <param name="Title">Title of experience</param>
/// <param name="Company">Name of company</param>
/// <param name="Mode">Full remote, hybrid, on-site</param>
/// <param name="Interval">Dates of start and end</param>
/// <param name="Location">Location (if hybrid or on-site)</param>
/// <param name="Description">Description of job</param>
/// <param name="Responsibilities">Key responsibilities</param>
/// <param name="Skills">Skills</param>
public record Experience(
    string Title,
    string Company,
    string Mode,
    DateTime? StartDate,
    DateTime? EndDate,
    string Location,
    string Description,
    IEnumerable<string> Responsibilities,
    IEnumerable<string> Skills
);
public record Experiences(IEnumerable<Experience> Items);
