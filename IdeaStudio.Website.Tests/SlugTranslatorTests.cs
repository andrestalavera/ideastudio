using IdeaStudio.Website.Models;
using IdeaStudio.Website.Services;
using Moq;

namespace IdeaStudio.Website.Tests;

public class SlugTranslatorTests
{
    private static Service Svc(string slug, string iconId, int order = 0) =>
        new(slug, slug, "", "", iconId, "", Array.Empty<string>(), Array.Empty<UseCase>(),
            Array.Empty<FaqEntry>(), null, order);

    private static (SlugTranslator translator, Mock<IContentGateway> gateway) MakeTranslator(
        IReadOnlyList<Service> fr, IReadOnlyList<Service> en)
    {
        Mock<IContentGateway> gateway = new();
        gateway.Setup(g => g.GetServicesAsync("fr", It.IsAny<CancellationToken>())).ReturnsAsync(fr);
        gateway.Setup(g => g.GetServicesAsync("en", It.IsAny<CancellationToken>())).ReturnsAsync(en);
        return (new SlugTranslator(gateway.Object), gateway);
    }

    [Fact]
    public async Task TranslateServiceSlugAsync_KnownFrSlugToEn_ReturnsEnTwinPairedByIconId()
    {
        List<Service> fr = [Svc("consultant-dotnet-azure", "consulting"), Svc("formateur", "training")];
        List<Service> en = [Svc("dotnet-azure-consulting", "consulting"), Svc("trainer", "training")];
        (SlugTranslator translator, _) = MakeTranslator(fr, en);

        string? result = await translator.TranslateServiceSlugAsync("consultant-dotnet-azure", "fr", "en");

        Assert.Equal("dotnet-azure-consulting", result);
    }

    [Fact]
    public async Task TranslateServiceSlugAsync_KnownEnSlugToFr_ReturnsFrTwinPairedByIconId()
    {
        List<Service> fr = [Svc("consultant-dotnet-azure", "consulting"), Svc("formateur", "training")];
        List<Service> en = [Svc("dotnet-azure-consulting", "consulting"), Svc("trainer", "training")];
        (SlugTranslator translator, _) = MakeTranslator(fr, en);

        string? result = await translator.TranslateServiceSlugAsync("trainer", "en", "fr");

        Assert.Equal("formateur", result);
    }

    [Fact]
    public async Task TranslateServiceSlugAsync_SameCulture_ReturnsInputWithoutQueryingGateway()
    {
        List<Service> fr = [Svc("consultant-dotnet-azure", "consulting")];
        List<Service> en = [Svc("dotnet-azure-consulting", "consulting")];
        (SlugTranslator translator, Mock<IContentGateway> gateway) = MakeTranslator(fr, en);

        string? result = await translator.TranslateServiceSlugAsync("consultant-dotnet-azure", "fr", "fr");

        Assert.Equal("consultant-dotnet-azure", result);
        gateway.Verify(g => g.GetServicesAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task TranslateServiceSlugAsync_SameLanguageDifferentRegion_TreatedAsPassthrough()
    {
        List<Service> fr = [Svc("consultant-dotnet-azure", "consulting")];
        List<Service> en = [Svc("dotnet-azure-consulting", "consulting")];
        (SlugTranslator translator, Mock<IContentGateway> gateway) = MakeTranslator(fr, en);

        // "fr-FR" and "fr-CA" both normalize to "fr" → same-culture passthrough.
        string? result = await translator.TranslateServiceSlugAsync("consultant-dotnet-azure", "fr-FR", "fr-CA");

        Assert.Equal("consultant-dotnet-azure", result);
        gateway.Verify(g => g.GetServicesAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task TranslateServiceSlugAsync_RegionQualifiedCultures_NormalizeAndTranslate()
    {
        List<Service> fr = [Svc("formateur", "training")];
        List<Service> en = [Svc("trainer", "training")];
        (SlugTranslator translator, _) = MakeTranslator(fr, en);

        // "fr-FR" → "fr" source, "en-US" → "en" target.
        string? result = await translator.TranslateServiceSlugAsync("formateur", "fr-FR", "en-US");

        Assert.Equal("trainer", result);
    }

    [Fact]
    public async Task TranslateServiceSlugAsync_UnknownSlug_ReturnsNull()
    {
        List<Service> fr = [Svc("consultant-dotnet-azure", "consulting")];
        List<Service> en = [Svc("dotnet-azure-consulting", "consulting")];
        (SlugTranslator translator, _) = MakeTranslator(fr, en);

        string? result = await translator.TranslateServiceSlugAsync("does-not-exist", "fr", "en");

        Assert.Null(result);
    }

    [Fact]
    public async Task TranslateServiceSlugAsync_KnownSourceButNoTwinIconId_ReturnsNull()
    {
        // Source slug exists, but the target list has no service sharing its IconId.
        List<Service> fr = [Svc("consultant-dotnet-azure", "consulting")];
        List<Service> en = [Svc("trainer", "training")];
        (SlugTranslator translator, _) = MakeTranslator(fr, en);

        string? result = await translator.TranslateServiceSlugAsync("consultant-dotnet-azure", "fr", "en");

        Assert.Null(result);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public async Task TranslateServiceSlugAsync_EmptyOrNullSlug_ReturnsNull(string? slug)
    {
        List<Service> fr = [Svc("consultant-dotnet-azure", "consulting")];
        List<Service> en = [Svc("dotnet-azure-consulting", "consulting")];
        (SlugTranslator translator, _) = MakeTranslator(fr, en);

        string? result = await translator.TranslateServiceSlugAsync(slug!, "fr", "en");

        Assert.Null(result);
    }

    [Fact]
    public async Task TranslateServiceSlugAsync_SlugCasingDiffers_MatchesCaseInsensitively()
    {
        List<Service> fr = [Svc("consultant-dotnet-azure", "consulting")];
        List<Service> en = [Svc("dotnet-azure-consulting", "consulting")];
        (SlugTranslator translator, _) = MakeTranslator(fr, en);

        string? result = await translator.TranslateServiceSlugAsync("Consultant-DotNet-Azure", "fr", "en");

        Assert.Equal("dotnet-azure-consulting", result);
    }

    [Fact]
    public async Task TranslateServiceSlugAsync_ListsInDifferentOrder_PairsByIconIdNotPosition()
    {
        // FR and EN lists are intentionally in DIFFERENT positional order. Pairing must
        // follow IconId, not index — otherwise "formateur" would wrongly map to "websites".
        List<Service> fr =
        [
            Svc("consultant-dotnet-azure", "consulting", order: 0),
            Svc("formateur", "training", order: 1),
            Svc("sites-internet", "websites", order: 2),
        ];
        List<Service> en =
        [
            Svc("websites", "websites", order: 0),
            Svc("trainer", "training", order: 1),
            Svc("dotnet-azure-consulting", "consulting", order: 2),
        ];
        (SlugTranslator translator, _) = MakeTranslator(fr, en);

        Assert.Equal("trainer", await translator.TranslateServiceSlugAsync("formateur", "fr", "en"));
        Assert.Equal("dotnet-azure-consulting", await translator.TranslateServiceSlugAsync("consultant-dotnet-azure", "fr", "en"));
        Assert.Equal("websites", await translator.TranslateServiceSlugAsync("sites-internet", "fr", "en"));
    }
}
