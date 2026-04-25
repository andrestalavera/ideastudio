using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Services;

/// <summary>
/// Content gateway — the abstraction pages consume to read services, realisations and
/// resume data. The current implementation reads from static JSON in wwwroot/data/ via
/// ILazyLoadingService. A future HTTP-backed implementation can be swapped in via DI.
/// </summary>
public interface IContentGateway
{
    /// <summary>Returns the services list for the given culture, sorted by <see cref="Service.Order"/>.</summary>
    Task<IReadOnlyList<Service>> GetServicesAsync(string culture, CancellationToken ct = default);

    /// <summary>Returns the realisations list for the given culture, sorted by <see cref="Realisation.DisplayOrder"/>.</summary>
    Task<IReadOnlyList<Realisation>> GetRealisationsAsync(string culture, CancellationToken ct = default);

    /// <summary>Returns the resume for the given culture.</summary>
    Task<Resume?> GetResumeAsync(string culture, CancellationToken ct = default);

    /// <summary>Returns the trainings catalogue for the given culture.</summary>
    Task<IReadOnlyList<Training>> GetTrainingsAsync(string culture, CancellationToken ct = default);

    /// <summary>Returns the training centers list for the given culture.</summary>
    Task<IReadOnlyList<TrainingCenter>> GetTrainingCentersAsync(string culture, CancellationToken ct = default);
}

public sealed class JsonContentGateway(ILazyLoadingService loader) : IContentGateway
{
    public async Task<IReadOnlyList<Service>> GetServicesAsync(string culture, CancellationToken ct = default)
    {
        string lang = Normalize(culture);
        List<Service>? items = await loader.LoadDataAsync<List<Service>>($"data/services-{lang}.json", ct);
        return items is null ? Array.Empty<Service>() : items.OrderBy(s => s.Order).ToArray();
    }

    public async Task<IReadOnlyList<Realisation>> GetRealisationsAsync(string culture, CancellationToken ct = default)
    {
        string lang = Normalize(culture);
        List<Realisation>? items = await loader.LoadDataAsync<List<Realisation>>($"data/realisations-{lang}.json", ct);
        return items is null ? Array.Empty<Realisation>() : items.OrderBy(r => r.DisplayOrder).ToArray();
    }

    public Task<Resume?> GetResumeAsync(string culture, CancellationToken ct = default)
    {
        string lang = Normalize(culture);
        return loader.LoadDataAsync<Resume>($"data/resume-{lang}.json", ct);
    }

    public async Task<IReadOnlyList<Training>> GetTrainingsAsync(string culture, CancellationToken ct = default)
    {
        string lang = Normalize(culture);
        List<Training>? items = await loader.LoadDataAsync<List<Training>>($"data/trainings-{lang}.json", ct);
        return items is null ? Array.Empty<Training>() : items;
    }

    public async Task<IReadOnlyList<TrainingCenter>> GetTrainingCentersAsync(string culture, CancellationToken ct = default)
    {
        string lang = Normalize(culture);
        List<TrainingCenter>? items = await loader.LoadDataAsync<List<TrainingCenter>>($"data/training-centers-{lang}.json", ct);
        return items is null ? Array.Empty<TrainingCenter>() : items;
    }

    private static string Normalize(string culture) =>
        string.IsNullOrWhiteSpace(culture) || culture.StartsWith("fr", StringComparison.OrdinalIgnoreCase) ? "fr" : "en";
}
