using System.Text.RegularExpressions;
using Xunit;

namespace IdeaStudio.Website.Tests;

// Guardrail for the utility-first refactor: class names must never contain BEM
// "--" / "__" again. The pattern matches a double-underscore or double-hyphen
// flanked by alphanumerics — which is exactly how BEM elements/modifiers read,
// and never how CSS custom properties (--x, preceded by space/"(") , decrements
// (i--), or vendor prefixes (-webkit-) read. So it is safe to run over whole
// .scss and .razor files.
public class NoBemClassNamesTests
{
    private static readonly Regex Bem = new(@"[A-Za-z0-9](?:__|--)[A-Za-z0-9]", RegexOptions.Compiled);

    [Theory]
    [InlineData("*.scss")]
    [InlineData("*.razor")]
    public void Source_HasNoBemDoubleHyphenOrUnderscore(string pattern)
    {
        string website = Path.Combine(RepoRoot(), "IdeaStudio.Website");
        var violations = new List<string>();

        foreach (string file in Directory.EnumerateFiles(website, pattern, SearchOption.AllDirectories))
        {
            if (file.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}") ||
                file.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}"))
                continue;

            string[] lines = File.ReadAllLines(file);
            for (int i = 0; i < lines.Length; i++)
                if (Bem.IsMatch(lines[i]))
                    violations.Add($"{Path.GetFileName(file)}:{i + 1}: {lines[i].Trim()}");
        }

        Assert.True(violations.Count == 0,
            $"BEM '--'/'__' found in {pattern} (use utility classes / flat names instead):\n" +
            string.Join("\n", violations));
    }

    private static string RepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "IdeaStudio.sln")))
            dir = dir.Parent;
        return dir?.FullName
            ?? throw new InvalidOperationException("Could not locate repo root (IdeaStudio.sln).");
    }
}
