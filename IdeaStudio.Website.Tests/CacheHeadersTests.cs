using System.Text.RegularExpressions;

namespace IdeaStudio.Website.Tests;

/// <summary>
/// The Blazor entry scripts keep the same file name on every deploy, and dotnet.js
/// carries the list of fingerprinted assets to load. Cached as immutable, a returning
/// visitor keeps the previous build's list, every asset 404s after a deploy and the app
/// never boots: the visitor is left on the static prerender shell (no catalogue, no
/// interactions). They must revalidate instead.
/// </summary>
public class CacheHeadersTests
{
    private static readonly Regex HeaderRule = new(
        @"\[\[headers\]\]\s*for\s*=\s*""(?<path>[^""]+)""\s*\[headers\.values\](?<values>(?:(?!\[\[)[\s\S])*)",
        RegexOptions.Compiled);

    private static string NetlifyToml =>
        Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "netlify.toml");

    private static string? CacheControlFor(string path)
    {
        foreach (Match rule in HeaderRule.Matches(File.ReadAllText(NetlifyToml)))
        {
            if (rule.Groups["path"].Value != path) continue;
            Match value = Regex.Match(rule.Groups["values"].Value, @"Cache-Control\s*=\s*""([^""]*)""");
            return value.Success ? value.Groups[1].Value : null;
        }
        return null;
    }

    [Theory]
    [InlineData("/_framework/blazor.webassembly.js")]
    [InlineData("/_framework/dotnet.js")]
    public void UnfingerprintedFrameworkEntry_Revalidates(string path)
    {
        string? cacheControl = CacheControlFor(path);

        Assert.NotNull(cacheControl);
        Assert.Contains("must-revalidate", cacheControl);
        Assert.DoesNotContain("immutable", cacheControl);
    }
}
