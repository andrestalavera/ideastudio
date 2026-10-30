using IdeaStudio.Website.Models;
using IdeaStudio.Website.Services;

namespace IdeaStudio.Website.Tests;

public class TrainingSeoTests
{
    private static Training Make(int? days, string summary = "À l'issue, vos équipes savent faire.", string title = "Blazor") => new()
    {
        Slug = "blazor",
        Title = title,
        Summary = summary,
        Category = ".NET",
        Modules = [],
        DurationDays = days,
    };

    [Theory]
    [InlineData(true, "Blazor — formation 3 j | IdeaStud.io")]
    [InlineData(false, "Blazor — 3-day training course | IdeaStud.io")]
    public void Title_WithDuration_AppendsCourseFormat(bool fr, string expected)
        => Assert.Equal(expected, TrainingSeo.Title(Make(3), fr));

    [Theory]
    [InlineData(true, "Blazor — formation | IdeaStud.io")]
    [InlineData(false, "Blazor — training course | IdeaStud.io")]
    public void Title_WithoutDuration_OmitsDays(bool fr, string expected)
        => Assert.Equal(expected, TrainingSeo.Title(Make(null), fr));

    // Many course titles start with a verb ("Concevoir des API…"): the format must follow
    // the title, never wrap it, or the snippet reads "Formation Concevoir…".
    [Theory]
    [InlineData(true, "Concevoir des API web — formation 2 j | IdeaStud.io")]
    [InlineData(false, "Concevoir des API web — 2-day training course | IdeaStud.io")]
    public void Title_VerbLedCourseTitle_KeepsTitleIntact(bool fr, string expected)
        => Assert.Equal(expected, TrainingSeo.Title(Make(2, title: "Concevoir des API web"), fr));

    [Fact]
    public void Description_OneDayFrench_ReadsNaturally()
        => Assert.StartsWith("Formation d'une journée,", TrainingSeo.Description(Make(1), fr: true));

    [Theory]
    [InlineData(true, "Formation de 3 jours, en présentiel, à distance ou en intra. À l'issue, vos équipes savent faire.")]
    [InlineData(false, "3-day training course, on-site, remote or in-house. À l'issue, vos équipes savent faire.")]
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
