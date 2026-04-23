using IdeaStudio.Website.Services;
using Moq;

namespace IdeaStudio.Website.Tests;

public class LocalizedRouteTests
{
    private static ILocalizedRoute Make(string culture = "fr")
    {
        Mock<ICultureService> mock = new();
        mock.Setup(s => s.CurrentCulture).Returns(new System.Globalization.CultureInfo(culture));
        return new LocalizedRoute(mock.Object);
    }

    [Theory]
    [InlineData("home", "fr", "/fr")]
    [InlineData("home", "en", "/en")]
    [InlineData("cv", "fr", "/fr/cv")]
    [InlineData("cv", "en", "/en/resume")]
    [InlineData("realisations", "fr", "/fr/realisations")]
    [InlineData("realisations", "en", "/en/projects")]
    [InlineData("legal", "fr", "/fr/mentions-legales")]
    [InlineData("legal", "en", "/en/legal")]
    [InlineData("privacy", "fr", "/fr/confidentialite")]
    [InlineData("privacy", "en", "/en/privacy")]
    public void For_KnownPageIdAndCulture_ReturnsExpectedPath(string pageId, string culture, string expected)
    {
        string actual = Make().For(pageId, culture);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void For_UnknownPageId_FallsBackToCultureHome()
    {
        Assert.Equal("/fr", Make().For("definitely-not-a-page", "fr"));
    }

    [Theory]
    [InlineData("/fr", "fr")]
    [InlineData("/fr/cv", "fr")]
    [InlineData("/en", "en")]
    [InlineData("/en/resume", "en")]
    [InlineData("/", null)]
    [InlineData("/something-else", null)]
    public void ExtractCulture_ReturnsFirstSegmentIfFrOrEn(string path, string? expected)
    {
        Assert.Equal(expected, Make().ExtractCulture(path));
    }

    [Theory]
    [InlineData("/fr", "home")]
    [InlineData("/fr/cv", "cv")]
    [InlineData("/en/resume", "cv")]
    [InlineData("/fr/realisations", "realisations")]
    [InlineData("/en/projects", "realisations")]
    [InlineData("/fr/mentions-legales", "legal")]
    [InlineData("/en/legal", "legal")]
    [InlineData("/unknown", null)]
    public void MatchPageId_ReturnsPageIdOrNull(string path, string? expected)
    {
        Assert.Equal(expected, Make().MatchPageId(path));
    }

    [Theory]
    [InlineData("/fr/cv", "en", "/en/resume")]
    [InlineData("/en/resume", "fr", "/fr/cv")]
    [InlineData("/fr/realisations", "en", "/en/projects")]
    [InlineData("/en/projects", "fr", "/fr/realisations")]
    [InlineData("/fr", "en", "/en")]
    public void Translate_StaticRoute_ReturnsTargetCultureEquivalent(string currentPath, string target, string expected)
    {
        Assert.Equal(expected, Make().Translate(currentPath, target));
    }

    [Fact]
    public void Translate_UnknownPath_FallsBackToTargetHome()
    {
        Assert.Equal("/en", Make().Translate("/whatever", "en"));
    }
}
