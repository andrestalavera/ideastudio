using System.Text.Json;
using System.Text.RegularExpressions;

namespace IdeaStudio.Website.Tests;

/// <summary>
/// Local builds and the Netlify build must use the same .NET SDK: a Razor compiler
/// difference between feature bands once let code compile locally and fail on deploy.
/// </summary>
public class SdkVersionConsistencyTests
{
    private static readonly string RepoRoot = LocateRepoRoot();

    [Fact]
    public void SdkVersion_GlobalJsonNetlifyTomlAndBuildScript_AreAligned()
    {
        using JsonDocument globalJson = JsonDocument.Parse(File.ReadAllText(Path.Combine(RepoRoot, "global.json")));
        string pinned = globalJson.RootElement.GetProperty("sdk").GetProperty("version").GetString()!;

        Match toml = Regex.Match(File.ReadAllText(Path.Combine(RepoRoot, "netlify.toml")), @"DOTNET_VERSION\s*=\s*""([^""]+)""");
        Match script = Regex.Match(File.ReadAllText(Path.Combine(RepoRoot, "scripts", "netlify-build.sh")), @"DOTNET_VERSION:-([0-9.]+)\}");

        Assert.True(toml.Success, "DOTNET_VERSION not found in netlify.toml");
        Assert.True(script.Success, "DOTNET_VERSION default not found in scripts/netlify-build.sh");
        Assert.Equal(pinned, toml.Groups[1].Value);
        Assert.Equal(pinned, script.Groups[1].Value);
    }

    private static string LocateRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "IdeaStudio.sln")))
            dir = dir.Parent;
        return dir?.FullName ?? throw new InvalidOperationException("Could not locate repo root from " + AppContext.BaseDirectory);
    }
}
