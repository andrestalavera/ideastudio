using System.IO.Compression;
using Xunit;

namespace IdeaStudio.Website.Tests;

public class BundleBudgetTests
{
    private const long MaxGzipBytes = 250 * 1024;

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
