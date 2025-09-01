using IdeaStudio.Website.Services;

namespace IdeaStudio.Website.Models;

public static partial class Extensions
{
	public static string ToSeoUrl(this string url) =>
		url.ToLowerInvariant()
		   .Replace("'", "-")
		   .Replace("é", "e")
		   .Replace("è", "e")
		   .Replace(" ", "-")
		   .Replace(".", "dot")
		   .Replace("#", "sharp")
		   .Replace("--", "-");

	public static Experience? WithGeneratedIds(this Experience experience, ISeoService seoService) => experience with
	{
		Id = seoService.GenerateId(experience.CompanyAndTitle)
	};

	public static TrainingCenter? WithGeneratedIds(this TrainingCenter? trainingCenter, ISeoService seoService) => trainingCenter with
	{
		Id = seoService.GenerateId(trainingCenter.Name)
	};
}
