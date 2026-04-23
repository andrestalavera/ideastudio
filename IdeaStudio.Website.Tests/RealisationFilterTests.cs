using IdeaStudio.Website.Models;
using IdeaStudio.Website.Services;

namespace IdeaStudio.Website.Tests;

public class RealisationFilterTests
{
    private static Realisation R(string slug, RealisationType type, params string[] tech) =>
        new(slug, slug, "", "", "", "", "", type, tech, new DateOnly(2025, 1, 1), 0);

    [Fact]
    public void Apply_NoFilters_ReturnsAll()
    {
        List<Realisation> all = [R("a", RealisationType.SiteVitrine, ".NET"), R("b", RealisationType.Formation, "Azure")];
        List<Realisation> result = RealisationFilter.Apply(all, [], []).ToList();
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public void Apply_TypeFilter_OnlyMatchingTypes()
    {
        List<Realisation> all = [R("a", RealisationType.SiteVitrine, ".NET"), R("b", RealisationType.Formation, "Azure")];
        List<Realisation> result = RealisationFilter.Apply(all, [], [RealisationType.Formation]).ToList();
        Assert.Single(result);
        Assert.Equal("b", result[0].Slug);
    }

    [Fact]
    public void Apply_TechFilter_OrWithinGroup()
    {
        List<Realisation> all =
        [
            R("a", RealisationType.SiteVitrine, ".NET"),
            R("b", RealisationType.SiteVitrine, "Azure"),
            R("c", RealisationType.SiteVitrine, "React")
        ];
        List<Realisation> result = RealisationFilter.Apply(all, [".NET", "Azure"], []).ToList();
        Assert.Equal(2, result.Count);
        Assert.Contains(result, r => r.Slug == "a");
        Assert.Contains(result, r => r.Slug == "b");
    }

    [Fact]
    public void Apply_CombinedFilters_AndBetweenGroups()
    {
        List<Realisation> all =
        [
            R("a", RealisationType.SiteVitrine, ".NET"),
            R("b", RealisationType.Formation, ".NET"),
            R("c", RealisationType.SiteVitrine, "Azure")
        ];
        List<Realisation> result = RealisationFilter.Apply(all, [".NET"], [RealisationType.SiteVitrine]).ToList();
        Assert.Single(result);
        Assert.Equal("a", result[0].Slug);
    }

    [Fact]
    public void AvailableTechnologies_UnionAcrossRealisations_Sorted()
    {
        List<Realisation> all =
        [
            R("a", RealisationType.SiteVitrine, ".NET", "Azure"),
            R("b", RealisationType.Formation, "Blazor", ".NET"),
        ];
        List<string> techs = RealisationFilter.AvailableTechnologies(all).ToList();
        Assert.Equal([".NET", "Azure", "Blazor"], techs);
    }
}
