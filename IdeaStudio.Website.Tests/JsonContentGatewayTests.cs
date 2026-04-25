using System.Text.Json;
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
    public void TrainingsJson_HasTwentyModules_AndParityBetweenFrAndEn()
    {
        JsonSerializerOptions opts = new(JsonSerializerDefaults.Web);
        Training[]? fr = JsonSerializer.Deserialize<Training[]>(File.ReadAllText(LocateDataFile("trainings-fr.json")), opts);
        Training[]? en = JsonSerializer.Deserialize<Training[]>(File.ReadAllText(LocateDataFile("trainings-en.json")), opts);

        Assert.NotNull(fr);
        Assert.NotNull(en);
        Assert.Equal(20, fr!.Length);
        Assert.Equal(20, en!.Length);

        IEnumerable<string> frSlugs = fr.Select(t => t.Slug).OrderBy(s => s);
        IEnumerable<string> enSlugs = en.Select(t => t.Slug).OrderBy(s => s);
        Assert.Equal(frSlugs, enSlugs);
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

    [Fact]
    public void TrainingsJson_AllModulesUseValidCategory()
    {
        HashSet<string> allowed = new(StringComparer.Ordinal) { ".NET", "Azure", "Vibe coding & IA", "Architecture & DevOps" };
        Training[]? fr = JsonSerializer.Deserialize<Training[]>(
            File.ReadAllText(LocateDataFile("trainings-fr.json")),
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        Assert.NotNull(fr);
        Assert.All(fr!, t => Assert.Contains(t.Category, allowed));
    }

    private static Training Sample(string slug) => new()
    {
        Slug = slug,
        Title = slug,
        Summary = "summary",
        Category = ".NET",
        Outline = ["a", "b"],
    };

    private static string LocateDataFile(string fileName)
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "IdeaStudio.sln")))
            dir = dir.Parent;
        if (dir is null)
            throw new InvalidOperationException("Could not locate repo root from " + AppContext.BaseDirectory);
        return Path.Combine(dir.FullName, "IdeaStudio.Website", "wwwroot", "data", fileName);
    }
}
