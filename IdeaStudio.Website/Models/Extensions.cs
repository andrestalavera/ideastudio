using IdeaStudio.Website.Services;

namespace IdeaStudio.Website.Models;

public static class Extensions
{
	public static string ToSeoUrl(this string url)
	=> url.ToLower()
		.Replace("'", "-")
		.Replace("é", "e")
		.Replace("è", "e")
		.Replace(" ", "-")
		.Replace(".", "dot")
		.Replace("#", "sharp")
		.Replace("--", "-")
		.Replace("--", "-")
		.Replace("--", "-");

	public static Experiences? WithGeneratedIds(this Experiences experiences, ISeoService seoService)
	{
		if (experiences?.Items == null) return experiences;

		return experiences with
		{
			Items = [.. experiences.Items.Select((e, index) => e with
			{
				Id = seoService.GenerateId($"{e.Company} {e.Title}") ?? seoService.GenerateId($"experience-{index}")
			})]
		};
	}

	public static TrainingCenters? WithGeneratedIds(this TrainingCenters trainingCenters, ISeoService seoService)
	{
		if (trainingCenters?.Items == null) return trainingCenters;

		return trainingCenters with
		{
			Items = [.. trainingCenters.Items.Select(t => t with
			{
				Id = seoService.GenerateId(t.Name)
			})]
		};
	}
}
