using IdeaStudio.Website.Services;

namespace IdeaStudio.Website.Models;

public static class Extensions
{
    public static Experience? WithGeneratedId(this Experience experience, ISlugService slugService)
    => experience with
    {
        Id = slugService.GenerateSlug(experience.CompanyAndTitle)
    };

    public static TrainingCenter? WithGeneratedId(this TrainingCenter trainingCenter, ISlugService slugService)
    => trainingCenter with
    {
        Id = slugService.GenerateSlug("training-center-centre-formation-" + trainingCenter.Name)
    };
}
