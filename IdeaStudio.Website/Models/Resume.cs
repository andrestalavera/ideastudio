namespace IdeaStudio.Website.Models;


/// <summary>
/// Represents the about me section of the website
/// </summary>
/// <param name="PersonalInformation">Personal information</param>
/// <param name="AboutSections">About sections</param>
/// <param name="Experiences">Experiences</param>
/// <param name="TrainingCenters">Training centers</param>
/// <param name="Languages">Languages</param>
public record Resume
{
	public PersonalInformation? PersonalInformation { get; set; }
	public ICollection<AboutSection>? AboutSections { get; init; }
	public ICollection<Experience>? Experiences { get; set; }
	public ICollection<TrainingCenter>? TrainingCenters { get; set; }
}
