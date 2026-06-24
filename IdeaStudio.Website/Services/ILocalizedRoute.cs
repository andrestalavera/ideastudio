namespace IdeaStudio.Website.Services;

public interface ILocalizedRoute
{
    /// <summary>Returns the absolute path for a known pageId in the given culture.</summary>
    string For(string pageId, string? cultureName = null);

    /// <summary>Translates a current absolute path into the equivalent in the target culture, preserving dynamic segments.</summary>
    string Translate(string currentPath, string targetCulture);

    /// <summary>Resolves a path to its pageId, or null if unknown.</summary>
    string? MatchPageId(string path);

    /// <summary>Extracts culture code ("fr" or "en") from the first segment of a path, or null if not present.</summary>
    string? ExtractCulture(string path);
}

public sealed class LocalizedRoute(ICultureService cultureService) : ILocalizedRoute
{
    private readonly ICultureService cultureService = cultureService;

    // (pageId, culture) -> path
    private static readonly IReadOnlyDictionary<(string PageId, string Culture), string> StaticRoutes =
        new Dictionary<(string, string), string>
        {
            [("home", "fr")] = "/fr",
            [("home", "en")] = "/en",
            [("services.hub", "fr")] = "/fr/services",
            [("services.hub", "en")] = "/en/services",
            [("about", "fr")] = "/fr/a-propos",
            [("about", "en")] = "/en/about",
            [("faq", "fr")] = "/fr/faq",
            [("faq", "en")] = "/en/faq",
            [("contact", "fr")] = "/fr/contact",
            [("contact", "en")] = "/en/contact",
            [("realisations", "fr")] = "/fr/realisations",
            [("realisations", "en")] = "/en/projects",
            [("cv", "fr")] = "/fr/cv",
            [("cv", "en")] = "/en/resume",
            [("legal", "fr")] = "/fr/mentions-legales",
            [("legal", "en")] = "/en/legal",
            [("privacy", "fr")] = "/fr/confidentialite",
            [("privacy", "en")] = "/en/privacy"
        };

    public string For(string pageId, string? cultureName = null)
    {
        string culture = cultureName ?? cultureService.CurrentCulture.Name;
        if (StaticRoutes.TryGetValue((pageId, culture), out string? path))
        {
            return path;
        }
        // Unknown pageId: fall back to home in current culture.
        return StaticRoutes[("home", culture)];
    }

    public string Translate(string currentPath, string targetCulture)
    {
        string? sourceCulture = ExtractCulture(currentPath);
        if (sourceCulture == null)
        {
            return For("home", targetCulture);
        }

        // Service pages need dynamic-slug translation via data; this fallback covers only static routes.
        // Service slug translation is resolved inside ServicePage itself (by slug lookup in the target-culture JSON).
        // For static routes, we look up the pageId by path then emit the target-culture path.
        string? pageId = MatchPageId(currentPath);
        if (pageId != null)
        {
            return For(pageId, targetCulture);
        }

        // Realisation case-study detail: /fr/realisations/{slug} <-> /en/projects/{slug}.
        // Slugs are brand names, identical across cultures, so just swap the hub.
        string sourceHub = For("realisations", sourceCulture);
        if (currentPath.StartsWith(sourceHub + "/", StringComparison.OrdinalIgnoreCase))
        {
            string slug = currentPath[(sourceHub.Length + 1)..];
            return $"{For("realisations", targetCulture)}/{slug}";
        }

        return For("home", targetCulture);
    }

    public string? MatchPageId(string path)
    {
        foreach (KeyValuePair<(string, string), string> kv in StaticRoutes)
        {
            if (string.Equals(kv.Value, path, StringComparison.OrdinalIgnoreCase))
            {
                return kv.Key.Item1;
            }
        }
        return null;
    }

    public string? ExtractCulture(string path)
    {
        if (string.IsNullOrEmpty(path)) return null;
        string trimmed = path.TrimStart('/');
        int slash = trimmed.IndexOf('/');
        string first = slash < 0 ? trimmed : trimmed[..slash];
        return first is "fr" or "en" ? first : null;
    }
}
