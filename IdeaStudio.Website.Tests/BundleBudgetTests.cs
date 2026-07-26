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

    [Fact]
    public void CinemaBundle_Gzipped_IsUnderBudget()
    {
        string bundlePath = LocateBundle();
        Assert.True(File.Exists(bundlePath),
            $"Bundle not built at {bundlePath}. Run 'dotnet build' or 'npm run build' first.");

        using FileStream input = File.OpenRead(bundlePath);
        using MemoryStream output = new();
        using (GZipStream gz = new(output, CompressionLevel.SmallestSize, leaveOpen: true))
            input.CopyTo(gz);
        long gzipped = output.Length;

        Assert.True(gzipped <= MaxGzipBytes,
            $"cinema.bundle.js is {gzipped:N0} B gzipped, exceeds {MaxGzipBytes:N0} B budget.");
    }

    private static string LocateBundle()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "IdeaStudio.sln")))
            dir = dir.Parent;
        if (dir is null)
            throw new InvalidOperationException(
                $"Could not locate repo root (looked for IdeaStudio.sln) starting from {AppContext.BaseDirectory}.");
        return Path.Combine(dir.FullName, "IdeaStudio.Website", "wwwroot", "js", "cinema.bundle.js");
    }
}
