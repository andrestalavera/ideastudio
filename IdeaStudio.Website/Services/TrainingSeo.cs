using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Services;

/// <summary>
/// Search-snippet wording for a course page. The title leads with the term buyers search
/// for ("Formation Blazor", "Blazor training course"), and the description opens with the
/// course facts, because every summary starts the same way ("À l'issue, vos…").
/// </summary>
public static class TrainingSeo
{
    public const int MaxDescriptionLength = 160;

    public static string Title(Training training, bool fr) => (fr, training.DurationDays) switch
    {
        (true, int d) => $"Formation {training.Title} ({d} j) — intra ou inter | IdeaStud.io",
        (true, null) => $"Formation {training.Title} — intra ou inter | IdeaStud.io",
        (false, int d) => $"{training.Title} training course ({d} {(d == 1 ? "day" : "days")}) | IdeaStud.io",
        (false, null) => $"{training.Title} training course | IdeaStud.io",
    };

    public static string Description(Training training, bool fr)
    {
        string prefix = (fr, training.DurationDays) switch
        {
            (true, int d) => $"Formation {training.Title} en {d} {(d == 1 ? "jour" : "jours")}, en présentiel, à distance ou en intra. ",
            (true, null) => $"Formation {training.Title}, en présentiel, à distance ou en intra. ",
            (false, int d) => $"{d}-day {training.Title} course, on-site, remote or in-house. ",
            (false, null) => $"{training.Title} course, on-site, remote or in-house. ",
        };
        return Truncate(prefix + training.Summary);
    }

    private static string Truncate(string text)
    {
        if (text.Length <= MaxDescriptionLength) { return text; }
        int cut = text.LastIndexOf(' ', MaxDescriptionLength - 1);
        return text[..(cut > 0 ? cut : MaxDescriptionLength - 1)].TrimEnd(',', ';', ':', ' ') + "…";
    }
}
