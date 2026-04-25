using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Services;

public static class RealisationFilter
{
    public static IEnumerable<Realisation> Apply(
        IEnumerable<Realisation> source,
        IReadOnlyCollection<string> selectedTechnologies,
        IReadOnlyCollection<RealisationType> selectedTypes)
    {
        IEnumerable<Realisation> q = source;

        if (selectedTechnologies.Count > 0)
        {
            q = q.Where(r => r.Technologies.Any(t => selectedTechnologies.Contains(t, StringComparer.OrdinalIgnoreCase)));
        }

        if (selectedTypes.Count > 0)
        {
            q = q.Where(r => selectedTypes.Contains(r.Type));
        }

        return q;
    }

    public static IEnumerable<string> AvailableTechnologies(IEnumerable<Realisation> source) =>
        source.SelectMany(r => r.Technologies)
              .Distinct(StringComparer.OrdinalIgnoreCase)
              .OrderBy(t => t, StringComparer.OrdinalIgnoreCase);
}
