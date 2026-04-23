using System.Text.RegularExpressions;

namespace IdeaStudio.Website.Tests;

public class HardcodedPathsTests
{
    private static readonly Regex LangPrefix = new(@"""\/(fr|en)(\/[a-zA-Z\-]+)?""", RegexOptions.Compiled);

    /// <summary>
    /// File names that are allowed to contain hardcoded language-prefixed
    /// literals. <c>LegacyRedirect.razor</c> is the legitimate home of the
    /// legacy path -> new path redirect table; those literals are its data,
    /// not coupling.
    /// </summary>
    private static readonly HashSet<string> AllowListedFileNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "LegacyRedirect.razor",
        "LegacyRedirect.razor.cs",
    };

    [Fact]
    public void NoLanguagePrefixedLiterals_OutsideRouteAttributesAndLocalizedRoute()
    {
        string root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "IdeaStudio.Website"));
        string[] targets = [Path.Combine(root, "Components"), Path.Combine(root, "Pages")];
        List<string> offenders = [];

        foreach (string dir in targets)
        {
            if (!Directory.Exists(dir)) continue;

            foreach (string file in Directory.EnumerateFiles(dir, "*.razor", SearchOption.AllDirectories)
                .Concat(Directory.EnumerateFiles(dir, "*.cs", SearchOption.AllDirectories)))
            {
                string fileName = Path.GetFileName(file);
                if (AllowListedFileNames.Contains(fileName)) continue;

                string content = File.ReadAllText(file);
                foreach (Match m in LangPrefix.Matches(content))
                {
                    // Allow `@page "/fr/..."` directive lines
                    string line = GetLine(content, m.Index);
                    if (line.TrimStart().StartsWith("@page ")) continue;
                    offenders.Add($"{file}: {line.Trim()}");
                }
            }
        }

        Assert.True(offenders.Count == 0, "Found hardcoded language-prefixed paths:\n" + string.Join("\n", offenders));
    }

    private static string GetLine(string content, int index)
    {
        int start = content.LastIndexOf('\n', Math.Max(0, index - 1)) + 1;
        int end = content.IndexOf('\n', index);
        if (end < 0) end = content.Length;
        return content[start..end];
    }
}
