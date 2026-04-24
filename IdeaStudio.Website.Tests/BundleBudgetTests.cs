using System.IO.Compression;
using Xunit;

namespace IdeaStudio.Website.Tests;

public class BundleBudgetTests
{
    // Phase C3 re-introduced Three.js (aurora backdrop shader) and GSAP (hero
    // entrance timeline) where they earn their keep. The plan's "~70-90 KB"
    // estimate underestimated Three.js core: r170 lands at ~120 KB gzipped on
    // its own; adding GSAP core + CSSPlugin + our modules measures ~150 KB
    // gzipped. Phase C4 added ScrollTrigger for the CV Chronicles scrubbed
    // timeline (~18 KB gzipped) — budget raised to 170 KB to accommodate it
    // with a small margin for future C4.x additions. Still well under the
    // pre-refactor 250 KB starting point.
    private const long MaxGzipBytes = 170 * 1024;

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
