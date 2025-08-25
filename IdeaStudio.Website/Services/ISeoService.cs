using System.Text.RegularExpressions;

namespace IdeaStudio.Website.Services;

public interface ISeoService
{
    string GenerateSlug(string? input);
    string GenerateId(string? input);
}

public partial class SeoService : ISeoService
{
    [GeneratedRegex(@"[ .:,'""/()&éèàâäçêëîïôöûüÿ\-_]+")]
    private static partial Regex SlugifyPattern();

    [GeneratedRegex(@"[^\w\-]")]
    private static partial Regex IdCleanupPattern();

    public string GenerateSlug(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Convert to lowercase and replace special characters with hyphens
        string slug = SlugifyPattern()
            .Replace(input.ToLowerInvariant().Trim(), "-");

        // Remove multiple consecutive hyphens and trim
        slug = Regex.Replace(slug, @"-+", "-").Trim('-');

        return slug;
    }

    public string GenerateId(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Generate slug first, then clean it up for HTML IDs
        string slug = GenerateSlug(input);
        
        // Ensure it starts with a letter (HTML ID requirement)
        if (!string.IsNullOrEmpty(slug) && char.IsDigit(slug[0]))
            slug = "id-" + slug;

        return IdCleanupPattern().Replace(slug, "");
    }
}