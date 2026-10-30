using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Tests;

public class TrainingSeoTests
{
    private static Training Make(int? days, string summary = "À l'issue, vos équipes savent faire.") => new()
    {
        Slug = "blazor",
        Title = "Blazor",
        Summary = summary,
        Category = ".NET",
        Modules = [],
        DurationDays = days,
    };

    [Theory]
    [InlineData(true, "Formation Blazor (3 j) — intra ou inter | IdeaStud.io")]
    [InlineData(false, "Blazor training course (3 days) | IdeaStud.io")]
    public void Title_WithDuration_LeadsWithBuyerKeyword(bool fr, string expected)
        => Assert.Equal(expected, TrainingSeo.Title(Make(3), fr));

    [Theory]
    [InlineData(true, "Formation Blazor — intra ou inter | IdeaStud.io")]
    [InlineData(false, "Blazor training course | IdeaStud.io")]
    public void Title_WithoutDuration_OmitsDays(bool fr, string expected)
        => Assert.Equal(expected, TrainingSeo.Title(Make(null), fr));

    [Fact]
    public void Title_OneDayEnglish_UsesSingular()
        => Assert.Equal("Blazor training course (1 day) | IdeaStud.io", TrainingSeo.Title(Make(1), fr: false));

    [Theory]
    [InlineData(true, "Formation Blazor en 3 jours, en présentiel, à distance ou en intra. À l'issue, vos équipes savent faire.")]
    [InlineData(false, "3-day Blazor course, on-site, remote or in-house. À l'issue, vos équipes savent faire.")]
    public void Description_ShortSummary_PrefixesCourseFacts(bool fr, string expected)
        => Assert.Equal(expected, TrainingSeo.Description(Make(3), fr));

    [Fact]
    public void Description_LongSummary_TrimsAtWordBoundaryWithEllipsis()
    {
        string summary = string.Join(' ', Enumerable.Repeat("mot", 80));

        string description = TrainingSeo.Description(Make(3, summary), fr: true);

        Assert.True(description.Length <= TrainingSeo.MaxDescriptionLength, $"{description.Length} chars");
        Assert.EndsWith("mot…", description);
    }
}
