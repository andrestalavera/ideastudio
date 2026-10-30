using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Services;

/// <summary>
/// Search-snippet wording for a course page. The course title comes first, untouched
/// (many start with a verb: "Concevoir des API…"), followed by the format; the
/// description opens with the course facts, because every summary starts the same way
/// ("À l'issue, vos…").
/// </summary>
public static class TrainingSeo
{
    public const int MaxDescriptionLength = 160;

    public static string Title(Training training, bool fr) => (fr, training.DurationDays) switch
    {
        (true, int d) => $"{training.Title} — formation {d} j | IdeaStud.io",
        (true, null) => $"{training.Title} — formation | IdeaStud.io",
        (false, int d) => $"{training.Title} — {d}-day training course | IdeaStud.io",
        (false, null) => $"{training.Title} — training course | IdeaStud.io",
    };

    public static string Description(Training training, bool fr)
    {
        string prefix = (fr, training.DurationDays) switch
        {
            (true, 1) => "Formation d'une journée, en présentiel, à distance ou en intra. ",
            (true, int d) => $"Formation de {d} jours, en présentiel, à distance ou en intra. ",
            (true, null) => "Formation en présentiel, à distance ou en intra. ",
            (false, int d) => $"{d}-day training course, on-site, remote or in-house. ",
            (false, null) => "Training course, on-site, remote or in-house. ",
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
