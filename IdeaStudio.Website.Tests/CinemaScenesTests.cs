using System.Text.RegularExpressions;
using Xunit;

namespace IdeaStudio.Website.Tests;

/// <summary>
/// Static-scan test guarding the per-page scene mapping. Pages declare their
/// scene via <c>&lt;PageScene Name="..." /&gt;</c>; the SCSS side exposes a
/// <c>html[data-scene="..."]</c> selector per scene in
/// <c>wwwroot/scss/base/_backdrop.scss</c>. A mismatch means a page falls
/// back to the default accent silently — these tests catch the regression.
/// Replaces the pre-Phase-C1 <c>registerScene(...)</c> invariant.
/// </summary>
public class CinemaScenesTests
{
    // Matches two Blazor forms:
    //   <PageScene Name="home" ... />                — literal
    //   <PageScene Name="@($"service/{x.Slug}")" ... /> — interpolated
    private static readonly Regex PageSceneRegex = new(
        """"<PageScene\s+Name="(?:@\(\$"(?<interp>[^"]+)"\)|(?<name>[^"@]+))"""",
        RegexOptions.Compiled);

    // Matches  html[data-scene="service/techlead"]  (whitespace tolerant).
    private static readonly Regex DataSceneSelectorRegex = new(
        """html\[data-scene\s*=\s*"(?<name>[^"]+)"\]""",
        RegexOptions.Compiled);

    private static readonly string[] KnownServiceIconIds =
        ["consulting", "techlead", "training", "vibe", "mobile", "web"];

    [Fact]
    public void EveryPageSceneName_HasMatchingBackdropSelector()
    {
        HashSet<string> pageNames = DiscoverPageSceneNames();
        HashSet<string> selectors = DiscoverBackdropSelectors();

        Assert.NotEmpty(pageNames);
        Assert.NotEmpty(selectors);

        List<string> missing = pageNames.Where(n => !selectors.Contains(n)).ToList();
        Assert.True(missing.Count == 0,
            $"PageScene Names without matching html[data-scene=\"...\"] in _backdrop.scss: {string.Join(", ", missing)}. "
            + $"Selectors present: {string.Join(", ", selectors.OrderBy(x => x))}");
    }

    [Fact]
    public void EveryBackdropSelector_IsReachableFromAPageScene()
    {
        HashSet<string> pageNames = DiscoverPageSceneNames();
        HashSet<string> selectors = DiscoverBackdropSelectors();

        List<string> unreachable = selectors.Where(n => !pageNames.Contains(n)).ToList();
        Assert.True(unreachable.Count == 0,
            $"_backdrop.scss selectors not referenced by any PageScene: {string.Join(", ", unreachable)}. "
            + $"Either remove the selector or add a PageScene that uses it.");
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

    private static HashSet<string> DiscoverBackdropSelectors()
    {
        string root = LocateRepoRoot();
        string backdrop = Path.Combine(
            root, "IdeaStudio.Website", "wwwroot", "scss", "base", "_backdrop.scss");
        Assert.True(File.Exists(backdrop), $"_backdrop.scss not found at {backdrop}.");

        string text = File.ReadAllText(backdrop);
        HashSet<string> names = new(StringComparer.Ordinal);
        foreach (Match m in DataSceneSelectorRegex.Matches(text))
            names.Add(m.Groups["name"].Value);
        return names;
    }

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
