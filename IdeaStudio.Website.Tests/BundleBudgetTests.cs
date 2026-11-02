using System.IO.Compression;
using Xunit;

namespace IdeaStudio.Website.Tests;

public class BundleBudgetTests
{
    // The bundle is a small hand-rolled runtime: a WebGL signature mesh plus the
    // interaction modules (reveals observer, cursor, nav-morph) and analytics.
    // No GSAP, no Three.js. It currently gzips to ~8.3 KB, so the budget is set
    // to 15 KB — tight enough to catch a real regression (a heavy dep sneaking in
    // ~doubles it) while leaving headroom for legitimate growth. If a change
    // needs more, profile the bundle before raising this.
    private const long MaxGzipBytes = 15 * 1024;

    // The article module (js/prose) is loaded by blog articles only: highlight.js core
    // plus a few grammars, ~17 KB. Mermaid is a separate chunk fetched only when an
    // article holds a diagram; if it were pulled into the entry this would blow by far.
    private const long MaxProseGzipBytes = 25 * 1024;

    [Fact]
    public void CinemaBundle_Gzipped_IsUnderBudget()
    {
        long gzipped = GzippedSize("cinema.bundle.js");

        Assert.True(gzipped <= MaxGzipBytes,
            $"cinema.bundle.js is {gzipped:N0} B gzipped, exceeds {MaxGzipBytes:N0} B budget.");
    }

    [Fact]
    public void ProseEntry_Gzipped_IsUnderBudget()
    {
        long gzipped = GzippedSize(Path.Combine("prose", "index.js"));

        Assert.True(gzipped <= MaxProseGzipBytes,
            $"prose/index.js is {gzipped:N0} B gzipped, exceeds {MaxProseGzipBytes:N0} B budget.");
    }

    private static long GzippedSize(string relativePath)
    {
        string bundlePath = Path.Combine(JsDirectory(), relativePath);
        Assert.True(File.Exists(bundlePath),
            $"Bundle not built at {bundlePath}. Run 'dotnet build' or 'npm run build' first.");

        using FileStream input = File.OpenRead(bundlePath);
        using MemoryStream output = new();
        using (GZipStream gz = new(output, CompressionLevel.SmallestSize, leaveOpen: true))
            input.CopyTo(gz);
        return output.Length;
    }

    private static string JsDirectory()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "IdeaStudio.sln")))
            dir = dir.Parent;
        if (dir is null)
            throw new InvalidOperationException(
                $"Could not locate repo root (looked for IdeaStudio.sln) starting from {AppContext.BaseDirectory}.");
        return Path.Combine(dir.FullName, "IdeaStudio.Website", "wwwroot", "js");
    }
}
