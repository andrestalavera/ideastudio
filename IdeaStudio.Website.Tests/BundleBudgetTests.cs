using System.IO.Compression;
using Xunit;

namespace IdeaStudio.Website.Tests;

public class BundleBudgetTests
{
    private const long MaxGzipBytes = 250 * 1024;
    private static readonly string BundlePath = Path.Combine(
        AppContext.BaseDirectory, "..", "..", "..", "..",
        "IdeaStudio.Website", "wwwroot", "js", "cinema.bundle.js");

    [Fact]
    public void CinemaBundle_StaysUnderGzipBudget()
    {
        Assert.True(File.Exists(BundlePath), $"Bundle not built at {BundlePath}. Run 'npm run build' first.");

        using var input = File.OpenRead(BundlePath);
        using var output = new MemoryStream();
        using (var gz = new GZipStream(output, CompressionLevel.SmallestSize, leaveOpen: true))
            input.CopyTo(gz);
        long gzipped = output.Length;

        Assert.True(gzipped <= MaxGzipBytes,
            $"cinema.bundle.js is {gzipped:N0} B gzipped, exceeds {MaxGzipBytes:N0} B budget.");
    }
}
