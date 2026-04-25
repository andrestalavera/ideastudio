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
