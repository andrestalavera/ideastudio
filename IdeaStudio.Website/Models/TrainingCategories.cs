namespace IdeaStudio.Website.Models;

/// <summary>
/// Single source of truth for the training-family display order. Only the
/// "Vibe coding" track's label differs by culture (IA in FR, AI in EN); these
/// strings MUST match the <c>category</c> values in <c>trainings-{fr,en}.json</c>
/// so grouping never silently drops a whole family (the EN "AI" bug).
/// </summary>
public static class TrainingCategories
{
    public static string[] Ordered(bool fr) =>
        [".NET", "Azure", fr ? "Vibe coding & IA" : "Vibe coding & AI", "Architecture & DevOps"];
}
