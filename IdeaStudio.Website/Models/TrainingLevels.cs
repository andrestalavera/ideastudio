namespace IdeaStudio.Website.Models;

/// <summary>
/// Single source of truth for the display label of a training's <c>level</c> code, so the
/// catalogue, the hub chips and the detail page never disagree on wording.
/// </summary>
public static class TrainingLevels
{
    public static string Label(string? level, bool fr) => level?.ToLowerInvariant() switch
    {
        "foundation" => fr ? "Fondamentaux" : "Foundation",
        "intermediate" => fr ? "Intermédiaire" : "Intermediate",
        "advanced" => fr ? "Avancé" : "Advanced",
        _ => level ?? string.Empty,
    };
}
