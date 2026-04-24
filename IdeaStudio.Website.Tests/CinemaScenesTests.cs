using System.Text.RegularExpressions;
using Xunit;

namespace IdeaStudio.Website.Tests;

/// <summary>
/// Static-scan tests guarding the per-page scene registry. The Blazor side
/// declares scenes via <c>&lt;PageScene Name="..." /&gt;</c> in pages and
/// components; the JS side registers scene factories in
/// <c>wwwroot/src/cinema/index.js</c>. A mismatch produces a silent runtime
/// warning (the engine just logs '[cinema] unknown scene'), so these tests
/// catch regressions at build time.
/// </summary>
public class CinemaScenesTests
{
    // Matches two Blazor forms:
    //   <PageScene Name="home" ... />                — literal
    //   <PageScene Name="@($"service/{x.Slug}")" ... /> — interpolated
    // The interpolated branch runs first so the literal branch (which
    // excludes '@' from its character class) doesn't swallow the leading '@'.
    private static readonly Regex PageSceneRegex = new(
        """"<PageScene\s+Name="(?:@\(\$"(?<interp>[^"]+)"\)|(?<name>[^"@]+))"""",
        RegexOptions.Compiled);

    private static readonly Regex RegisterSceneRegex = new(
        """registerScene\s*\(\s*['"](?<name>[^'"]+)['"]""",
        RegexOptions.Compiled);

    [Fact]
    public void EveryPageSceneName_IsRegisteredInIndexJs()
    {
        HashSet<string> pageNames = DiscoverPageSceneNames();
        HashSet<string> registered = DiscoverRegisteredScenes();

        Assert.NotEmpty(pageNames);
        Assert.NotEmpty(registered);

        List<string> missing = pageNames.Where(n => !registered.Contains(n)).ToList();
        Assert.True(missing.Count == 0,
            $"PageScene Names without matching registerScene in index.js: {string.Join(", ", missing)}. "
            + $"Registered: {string.Join(", ", registered.OrderBy(x => x))}");
    }

    [Fact]
    public void EveryRegisteredScene_IsReachableFromAPageScene()
    {
        HashSet<string> pageNames = DiscoverPageSceneNames();
        HashSet<string> registered = DiscoverRegisteredScenes();

        List<string> unreachable = registered.Where(n => !pageNames.Contains(n)).ToList();
        Assert.True(unreachable.Count == 0,
            $"Registered scenes not referenced by any PageScene: {string.Join(", ", unreachable)}. "
            + $"Either remove the registration or add a PageScene that uses it.");
    }

    private static HashSet<string> DiscoverPageSceneNames()
    {
        string root = LocateRepoRoot();
        string websiteRoot = Path.Combine(root, "IdeaStudio.Website");
        HashSet<string> names = new(StringComparer.Ordinal);

        IEnumerable<string> razorFiles = Directory
            .EnumerateFiles(websiteRoot, "*.razor", SearchOption.AllDirectories)
            .Where(p => !p.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}")
                     && !p.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}"));

        foreach (string file in razorFiles)
        {
            string text = File.ReadAllText(file);
            foreach (Match m in PageSceneRegex.Matches(text))
            {
                string raw = m.Groups["name"].Success ? m.Groups["name"].Value : m.Groups["interp"].Value;
                // Expand the one known interpolation: service/{service.IconId} → service/<iconId>.
                // The iconIds are defined in ServiceDetail.razor's AccentsByIconId dict.
                if (raw.Contains("{service.IconId}"))
                {
                    foreach (string iconId in KnownServiceIconIds)
                        names.Add(raw.Replace("{service.IconId}", iconId));
                }
                else
                {
                    names.Add(raw);
                }
            }
        }

        return names;
    }

    private static HashSet<string> DiscoverRegisteredScenes()
    {
        string root = LocateRepoRoot();
        string indexJs = Path.Combine(root, "IdeaStudio.Website", "wwwroot", "src", "cinema", "index.js");
        Assert.True(File.Exists(indexJs), $"index.js not found at {indexJs}.");

        string text = File.ReadAllText(indexJs);
        HashSet<string> names = new(StringComparer.Ordinal);
        foreach (Match m in RegisterSceneRegex.Matches(text))
            names.Add(m.Groups["name"].Value);
        return names;
    }

    private static readonly string[] KnownServiceIconIds =
        ["consulting", "techlead", "training", "vibe", "mobile", "web"];

    private static string LocateRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "IdeaStudio.sln")))
            dir = dir.Parent;
        return dir?.FullName
            ?? throw new InvalidOperationException(
                $"Could not locate repo root starting from {AppContext.BaseDirectory}.");
    }
}
