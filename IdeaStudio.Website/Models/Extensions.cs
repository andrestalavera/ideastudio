using IdeaStudio.Website.Services;

namespace IdeaStudio.Website.Models;

public static partial class Extensions
{
	public static Experience? WithGeneratedId(this Experience experience, ISeoService seoService)
		=> experience! with
		{
			Id = seoService.GenerateSlug(experience.CompanyAndTitle)
		};

	public static TrainingCenter? WithGeneratedId(this TrainingCenter trainingCenter, ISeoService seoService)
		=> trainingCenter! with
		{
			Id = seoService.GenerateSlug(trainingCenter.Name)
		};
}
