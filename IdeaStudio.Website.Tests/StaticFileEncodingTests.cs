using System.Text.Json;

namespace IdeaStudio.Website.Tests;

/// <summary>
/// Guards the encoding of hand-maintained static files under wwwroot. A leading UTF-8
/// BOM makes strict parsers throw (ai.txt is JSON consumed by crawlers/agents) or
/// mis-read the first line (robots.txt), so these files must have no BOM.
/// </summary>
public class StaticFileEncodingTests
{
    private static readonly byte[] Utf8Bom = [0xEF, 0xBB, 0xBF];

    [Theory]
    [InlineData("ai.txt")]
    [InlineData("robots.txt")]
    [InlineData("llms.txt")]
    [InlineData("sitemap.xml")]
    public void RootStaticFile_HasNoUtf8Bom(string fileName)
    {
        byte[] bytes = File.ReadAllBytes(LocateWwwrootFile(fileName));

        bool startsWithBom = bytes.Length >= 3
            && bytes[0] == Utf8Bom[0] && bytes[1] == Utf8Bom[1] && bytes[2] == Utf8Bom[2];
        Assert.False(startsWithBom, $"{fileName} starts with a UTF-8 BOM; re-save it without one.");
    }

    [Fact]
    public void AiTxt_ParsesAsJson()
    {
        using JsonDocument _ = JsonDocument.Parse(File.ReadAllText(LocateWwwrootFile("ai.txt")));
    }

    private static string LocateWwwrootFile(string fileName)
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "IdeaStudio.sln")))
            dir = dir.Parent;
        if (dir is null)
            throw new InvalidOperationException("Could not locate repo root from " + AppContext.BaseDirectory);
        return Path.Combine(dir.FullName, "IdeaStudio.Website", "wwwroot", fileName);
    }
}
