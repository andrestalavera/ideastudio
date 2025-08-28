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
public partial record Experience
{
	public string CompanyAndTitle => $"{Company}-{Title}";
	public string? Id { get; init; }
	public string? Title { get; init; }
	public string? Company { get; init; }
	public string? Mode { get; init; }
	public DateTime? StartDate { get; init; }
	public DateTime? EndDate { get; init; }
	public IEnumerable<string?>? Locations { get; init; }
	public IEnumerable<string?>? Description { get; init; }
	public IEnumerable<string?>? Responsibilities { get; init; }
	public IEnumerable<string?>? Skills { get; init; }
}

public record Experiences
{
	public ICollection<Experience>? Items { get; init; }
}
