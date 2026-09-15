using System.Text.Json;
using System.Text.RegularExpressions;
using IdeaStudio.Website.Models;
using IdeaStudio.Website.Services;
using Moq;

namespace IdeaStudio.Website.Tests;

/// <summary>
/// Tests for <see cref="JsonContentGateway"/> covering the trainings + training-centers
/// surface added in V3.1, plus on-disk JSON file checks for the new wwwroot/data files.
/// </summary>
public class JsonContentGatewayTests
{
    [Fact]
    public async Task GetTrainingsAsync_ReturnsList_WhenLoaderReturnsItems()
    {
        Mock<ILazyLoadingService> loader = new();
        List<Training> sample = [Sample("a"), Sample("b")];
        loader.Setup(l => l.LoadDataAsync<List<Training>>("data/trainings-fr.json", It.IsAny<CancellationToken>()))
              .ReturnsAsync(sample);
        JsonContentGateway sut = new(loader.Object);

        IReadOnlyList<Training> result = await sut.GetTrainingsAsync("fr-FR");

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetTrainingsAsync_ReturnsEmpty_WhenLoaderReturnsNull()
    {
        Mock<ILazyLoadingService> loader = new();
        loader.Setup(l => l.LoadDataAsync<List<Training>>(It.IsAny<string>(), It.IsAny<CancellationToken>()))
              .ReturnsAsync((List<Training>?)null);
        JsonContentGateway sut = new(loader.Object);

        IReadOnlyList<Training> result = await sut.GetTrainingsAsync("en-US");

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetTrainingsAsync_NormalizesCultureToLang_FrAndEn()
    {
        Mock<ILazyLoadingService> loader = new();
        loader.Setup(l => l.LoadDataAsync<List<Training>>(It.IsAny<string>(), It.IsAny<CancellationToken>()))
              .ReturnsAsync(new List<Training>());
        JsonContentGateway sut = new(loader.Object);

        await sut.GetTrainingsAsync("fr-FR");
        await sut.GetTrainingsAsync("en-US");

        loader.Verify(l => l.LoadDataAsync<List<Training>>("data/trainings-fr.json", It.IsAny<CancellationToken>()), Times.Once);
        loader.Verify(l => l.LoadDataAsync<List<Training>>("data/trainings-en.json", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetTrainingCentersAsync_ReturnsList_WhenLoaderReturnsItems()
    {
        Mock<ILazyLoadingService> loader = new();
        List<TrainingCenter> sample = [new TrainingCenter { Name = "Center A" }];
        loader.Setup(l => l.LoadDataAsync<List<TrainingCenter>>("data/training-centers-fr.json", It.IsAny<CancellationToken>()))
              .ReturnsAsync(sample);
        JsonContentGateway sut = new(loader.Object);

        IReadOnlyList<TrainingCenter> result = await sut.GetTrainingCentersAsync("fr-FR");

        Assert.Single(result);
    }

    [Fact]
    public async Task GetTrainingCentersAsync_ReturnsEmpty_WhenLoaderReturnsNull()
    {
        Mock<ILazyLoadingService> loader = new();
        loader.Setup(l => l.LoadDataAsync<List<TrainingCenter>>(It.IsAny<string>(), It.IsAny<CancellationToken>()))
              .ReturnsAsync((List<TrainingCenter>?)null);
        JsonContentGateway sut = new(loader.Object);

        IReadOnlyList<TrainingCenter> result = await sut.GetTrainingCentersAsync("en-US");

        Assert.Empty(result);
    }

    [Theory]
    [InlineData("trainings-fr.json")]
    [InlineData("trainings-en.json")]
    [InlineData("training-centers-fr.json")]
    [InlineData("training-centers-en.json")]
    public void DataFile_Exists_AndIsValidJson(string fileName)
    {
        string path = LocateDataFile(fileName);
        Assert.True(File.Exists(path), $"Expected data file at {path}");

        string content = File.ReadAllText(path);
        // Smoke parse — throws if the JSON is malformed.
        using JsonDocument _ = JsonDocument.Parse(content);
    }

    [Fact]
    public void TrainingCentersJson_HasParity_BetweenFrAndEn()
    {
        TrainingCenter[]? fr = JsonSerializer.Deserialize<TrainingCenter[]>(
            File.ReadAllText(LocateDataFile("training-centers-fr.json")),
            new JsonSerializerOptions(JsonSerializerDefaults.Web));
        TrainingCenter[]? en = JsonSerializer.Deserialize<TrainingCenter[]>(
            File.ReadAllText(LocateDataFile("training-centers-en.json")),
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        Assert.NotNull(fr);
        Assert.NotNull(en);
        Assert.Equal(fr!.Length, en!.Length);
    }

    [Fact]
    public void ServicesJson_HasSevenEntries_InBothLanguages_WithUniqueOrders()
    {
        JsonSerializerOptions opts = new(JsonSerializerDefaults.Web);
        IdeaStudio.Website.Models.Service[]? fr = JsonSerializer.Deserialize<IdeaStudio.Website.Models.Service[]>(
            File.ReadAllText(LocateDataFile("services-fr.json")), opts);
        IdeaStudio.Website.Models.Service[]? en = JsonSerializer.Deserialize<IdeaStudio.Website.Models.Service[]>(
            File.ReadAllText(LocateDataFile("services-en.json")), opts);

        Assert.NotNull(fr);
        Assert.NotNull(en);
        Assert.Equal(7, fr!.Length);
        Assert.Equal(7, en!.Length);

        int[] expected = { 1, 2, 3, 4, 5, 6, 7 };
        Assert.Equal(expected, fr.Select(s => s.Order).OrderBy(o => o).ToArray());
        Assert.Equal(expected, en.Select(s => s.Order).OrderBy(o => o).ToArray());
    }

    [Fact]
    public void ServicesJson_NewAiEnterpriseSlug_PresentInBothLanguages()
    {
        JsonSerializerOptions opts = new(JsonSerializerDefaults.Web);
        IdeaStudio.Website.Models.Service[]? fr = JsonSerializer.Deserialize<IdeaStudio.Website.Models.Service[]>(
            File.ReadAllText(LocateDataFile("services-fr.json")), opts);
        IdeaStudio.Website.Models.Service[]? en = JsonSerializer.Deserialize<IdeaStudio.Website.Models.Service[]>(
            File.ReadAllText(LocateDataFile("services-en.json")), opts);

        Assert.Contains(fr!, s => s.Slug == "ia-en-entreprise");
        Assert.Contains(en!, s => s.Slug == "ai-enterprise");
    }

    // Guards the EN "AI" content-loss bug: TrainingCatalogue groups by TrainingCategories.Ordered,
    // so every category present in the data MUST appear in that ordered list for the culture, in
    // BOTH languages — otherwise the whole family is silently dropped from the rendered catalogue.
    [Theory]
    [InlineData(true, "trainings-fr.json")]
    [InlineData(false, "trainings-en.json")]
    public void TrainingCategories_Ordered_CoversEveryCategoryInData(bool fr, string file)
    {
        Training[]? items = JsonSerializer.Deserialize<Training[]>(
            File.ReadAllText(LocateDataFile(file)),
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        Assert.NotNull(items);
        HashSet<string> ordered = new(TrainingCategories.Ordered(fr), StringComparer.Ordinal);
        Assert.All(items!, t => Assert.Contains(t.Category, ordered));
    }

    // Module pages are routed by slug in both cultures, so FR and EN must list the same modules
    // with the same facts (duration, level, certification) and the same outline length.
    [Fact]
    public void TrainingsJson_FrAndEn_HaveMatchingModules()
    {
        Training[] fr = LoadTrainings("trainings-fr.json");
        Training[] en = LoadTrainings("trainings-en.json");

        Assert.Equal(fr.Select(t => t.Slug), en.Select(t => t.Slug));
        Assert.All(fr.Zip(en), pair =>
        {
            Assert.Equal(pair.First.DurationDays, pair.Second.DurationDays);
            Assert.Equal(pair.First.Level, pair.Second.Level);
            Assert.Equal(pair.First.Certification, pair.Second.Certification);
            Assert.Equal(pair.First.Outline.Count, pair.Second.Outline.Count);
        });
    }

    // The "N modules" marketing copy is hand-written (it must exist before the data loads for SEO),
    // so guard it against drifting from the actual catalogue size.
    [Theory]
    [InlineData("IdeaStudio.Website/Pages/Trainings.razor")]
    [InlineData("IdeaStudio.Website/Pages/ServiceDetail.razor")]
    [InlineData("IdeaStudio.Website/wwwroot/llms.txt")]
    public void TrainingCountCopy_MatchesCatalogueSize(string relativePath)
    {
        int expected = LoadTrainings("trainings-fr.json").Length;
        string text = File.ReadAllText(LocateRepoFile(relativePath));

        MatchCollection counts = Regex.Matches(text, @"\b(\d+) (?:hands-on |ready-to-run )?(?:training )?modules|modules: (\d+)");

        Assert.NotEmpty(counts);
        Assert.All(counts, m => Assert.Equal(expected, int.Parse(m.Groups[1].Success ? m.Groups[1].Value : m.Groups[2].Value)));
    }

    [Theory]
    [InlineData("trainings-fr.json", "https://ideastud.io/fr/formations/")]
    [InlineData("trainings-en.json", "https://ideastud.io/en/training/")]
    public void Sitemap_ListsEveryTrainingModule(string file, string hub)
    {
        string sitemap = File.ReadAllText(LocateRepoFile("IdeaStudio.Website/wwwroot/sitemap.xml"));

        Assert.All(LoadTrainings(file), t => Assert.Contains($"<loc>{hub}{t.Slug}</loc>", sitemap));
    }

    private static Training[] LoadTrainings(string file) =>
        JsonSerializer.Deserialize<Training[]>(
            File.ReadAllText(LocateDataFile(file)),
            new JsonSerializerOptions(JsonSerializerDefaults.Web))!;

    private static Training Sample(string slug) => new()
    {
        Slug = slug,
        Title = slug,
        Summary = "summary",
        Category = ".NET",
        Outline = ["a", "b"],
    };

    private static string LocateDataFile(string fileName) =>
        LocateRepoFile(Path.Combine("IdeaStudio.Website", "wwwroot", "data", fileName));

    private static string LocateRepoFile(string relativePath)
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "IdeaStudio.sln")))
            dir = dir.Parent;
        if (dir is null)
            throw new InvalidOperationException("Could not locate repo root from " + AppContext.BaseDirectory);
        return Path.Combine(dir.FullName, relativePath);
    }
}
