using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Services;

/// <summary>
/// Builds the "trusted by" client roster shared by the Home logo strip and the
/// résumé Clients section: company names from the résumé experiences (most recent
/// first) plus the showcase-site clients (which carry a live URL). Own brands and
/// blanks are excluded; deduped by name (case-insensitive).
/// </summary>
public static class ClientRoster
{
    private static readonly HashSet<string> Exclude = new(StringComparer.OrdinalIgnoreCase)
    {
        "IdeaStudio", "IdeaStud.io", "Andrés Talavera",
    };

    public static List<(string Name, string? Url)> Build(Resume? resume, IReadOnlyList<Realisation> realisations)
    {
        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);
        List<(string Name, string? Url)> roster = new();

        if (resume?.Experiences is not null)
        {
            foreach (Experience e in resume.Experiences)
            {
                string name = Clean(e.Company);
                if (name.Length == 0 || Exclude.Contains(name)) continue;
                if (seen.Add(name)) roster.Add((name, null));
            }
        }

        foreach (Realisation r in realisations)
        {
            // Showcase brands only (descriptive "clients" without a live URL are skipped).
            if (string.IsNullOrWhiteSpace(r.LiveUrl)) continue;
            string name = Clean(r.Client);
            if (name.Length == 0 || Exclude.Contains(name)) continue;
            if (seen.Add(name)) roster.Add((name, r.LiveUrl));
        }

        return roster;
    }

    private static string Clean(string? raw) =>
        (raw ?? string.Empty).Trim().Replace("/", " / ");
}
