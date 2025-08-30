using IdeaStudio.Website.Services;

namespace IdeaStudio.Website.Models;

public static class Extensions
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

    public static Experiences? WithGeneratedIds(this Experiences? experiences, ISeoService seoService)
    {
        if (experiences?.Items == null) return experiences;

        return experiences with
        {
            Items = [.. experiences.Items.Select((e, index) => e with
            {
                Id = seoService.GenerateId($"{e.Company} {e.Title}") ??
                     seoService.GenerateId($"experience-{index}")
            })]
		};
    }

	public static Experience WithGeneratedIds(this Experience experience, ISeoService seoService)
	{
		var id = seoService.GenerateId(experience.CompanyAndTitle);
		return experience with { Id = id };
	}

    public static TrainingCenters? WithGeneratedIds(this TrainingCenters? trainingCenters, ISeoService seoService)
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
