using System.Text.RegularExpressions;
using Xunit;

namespace IdeaStudio.Website.Tests;

// Guards the accessibility floor of the colour palette the way BundleBudgetTests
// guards the JS bundle. The source of truth is the $themes map in
// IdeaStudio.Website/wwwroot/scss/tokens/_colors.scss — this test parses the hex
// tokens straight out of that map (per theme) so the palette can never silently
// regress below WCAG 2.2 AA.
//
// Asserts, for BOTH themes:
//   * body text (fg / fg-muted) on every page/card/surface  >= 4.5:1 (1.4.3)
//   * the duck accent used for focus rings / labels          >= 3.0:1 (1.4.11)
//   * the corrected masthead CTA rest border                 >= 3.0:1 (1.4.11)
//   * the project-tile frosted badge over ANY thumbnail      >= 4.5:1 (1.4.3)
//
// Contrast maths follow WCAG: sRGB relative luminance + (L1+0.05)/(L2+0.05).
public class TokenContrastTests
{
    // --- WCAG contrast helpers (sRGB relative luminance) ---------------------

    private static double Linearize(double channel8Bit)
    {
        double c = channel8Bit / 255.0;
        return c <= 0.03928 ? c / 12.92 : Math.Pow((c + 0.055) / 1.055, 2.4);
    }

    private static double RelativeLuminance((int r, int g, int b) c) =>
        0.2126 * Linearize(c.r) + 0.7152 * Linearize(c.g) + 0.0722 * Linearize(c.b);

    private static double ContrastRatio((int r, int g, int b) a, (int r, int g, int b) b)
    {
        double la = RelativeLuminance(a), lb = RelativeLuminance(b);
        double hi = Math.Max(la, lb), lo = Math.Min(la, lb);
        return (hi + 0.05) / (lo + 0.05);
    }

    // Composite an `alpha`-opaque foreground colour over an opaque background
    // (straight, non-premultiplied alpha) — models a translucent scrim / border
    // resolving against the surface behind it.
    private static (int r, int g, int b) Over((int r, int g, int b) fg, (int r, int g, int b) bg, double alpha) =>
        (
            (int)Math.Round(fg.r * alpha + bg.r * (1 - alpha)),
            (int)Math.Round(fg.g * alpha + bg.g * (1 - alpha)),
            (int)Math.Round(fg.b * alpha + bg.b * (1 - alpha))
        );

    private static (int r, int g, int b) Hex(string hex)
    {
        hex = hex.TrimStart('#');
        return (
            Convert.ToInt32(hex.Substring(0, 2), 16),
            Convert.ToInt32(hex.Substring(2, 2), 16),
            Convert.ToInt32(hex.Substring(4, 2), 16));
    }

    // --- Palette parsed from the $themes map (source of truth) ---------------

    private static Dictionary<string, (int r, int g, int b)> Theme(string name)
    {
        string colors = File.ReadAllText(Path.Combine(
            RepoRoot(), "IdeaStudio.Website", "wwwroot", "scss", "tokens", "_colors.scss"));

        // Slice out the `<name>: ( ... )` block of the $themes map. Each theme
        // block ends at the next theme key ("light:" / "dark:") or the closing
        // ");" of the map.
        var blockStart = Regex.Match(colors, $@"\b{name}:\s*\(");
        Assert.True(blockStart.Success, $"Theme '{name}' not found in _colors.scss $themes map.");
        string rest = colors.Substring(blockStart.Index + blockStart.Length);
        var nextTheme = Regex.Match(rest, @"\b(dark|light):\s*\(");
        string block = nextTheme.Success ? rest.Substring(0, nextTheme.Index) : rest;

        var map = new Dictionary<string, (int, int, int)>(StringComparer.OrdinalIgnoreCase);
        foreach (Match m in Regex.Matches(block, @"([\w-]+):\s*(#[0-9a-fA-F]{6})\b"))
            map[m.Groups[1].Value] = Hex(m.Groups[2].Value);

        // Sanity: the tokens this test reasons about must all be present.
        foreach (string required in new[] { "bg-void", "bg-deep", "bg-surface", "bg-raised", "fg", "fg-muted", "ir-duck" })
            Assert.True(map.ContainsKey(required), $"Token '{required}' missing from '{name}' theme.");
        return map;
    }

    public static IEnumerable<object[]> Themes() => new[] { new object[] { "dark" }, new object[] { "light" } };

    // --- Body text: AA (4.5:1) -----------------------------------------------

    [Theory]
    [MemberData(nameof(Themes))]
    public void BodyText_OnEverySurface_MeetsAa(string theme)
    {
        var c = Theme(theme);
        string[] textTokens = { "fg", "fg-muted" };
        string[] surfaces = { "bg-deep", "bg-surface", "bg-raised", "bg-void" };

        var failures = new List<string>();
        foreach (string text in textTokens)
            foreach (string surface in surfaces)
            {
                double ratio = ContrastRatio(c[text], c[surface]);
                if (ratio < 4.5)
                    failures.Add($"{theme}: {text} on {surface} = {ratio:0.00}:1 (<4.5)");
            }

        Assert.True(failures.Count == 0,
            "Body-text pairs below WCAG AA (4.5:1):\n" + string.Join("\n", failures));
    }

    // --- Duck accent (focus ring / labels): non-text 3:1 ---------------------

    [Theory]
    [MemberData(nameof(Themes))]
    public void DuckAccent_OnPillSurfaces_MeetsNonTextThreshold(string theme)
    {
        var c = Theme(theme);
        // The focus ring + label/accent colour is ir-duck (the `ring` token is the
        // same hue at 0.6 alpha). It must clear 3:1 against the surfaces it sits on.
        foreach (string surface in new[] { "bg-deep", "bg-surface" })
        {
            double ratio = ContrastRatio(c["ir-duck"], c[surface]);
            Assert.True(ratio >= 3.0, $"{theme}: ir-duck on {surface} = {ratio:0.00}:1 (<3.0)");
        }
    }

    // --- Masthead CTA rest border: non-text 3:1 (the fix) --------------------

    [Theory]
    [InlineData("dark", 0.55)]   // _masthead.scss: 55% duck mix on the dark pill
    [InlineData("light", 0.70)]  // _masthead.scss: raised to 70% on the near-white pill
    public void CtaRestBorder_OverPill_MeetsNonTextThreshold(string theme, double duckAlpha)
    {
        var c = Theme(theme);
        // Border = color-mix(in oklab, ir-duck <alpha>, transparent) resolving over
        // the bg-deep pill. Compared against the bare pill surface beside it.
        var border = Over(c["ir-duck"], c["bg-deep"], duckAlpha);
        double ratio = ContrastRatio(border, c["bg-deep"]);
        Assert.True(ratio >= 3.0,
            $"{theme}: CTA rest border (duck {duckAlpha:P0}) on bg-deep = {ratio:0.00}:1 (<3.0)");
    }

    // --- Project-tile frosted badge over arbitrary imagery: AA (4.5:1) -------

    [Theory]
    [MemberData(nameof(Themes))]
    public void TileBadge_OverAnyThumbnail_MeetsAa(string theme)
    {
        var c = Theme(theme);
        // _tile.scss: an opaque-enough scrim — bg-void at 65% — sits under the blur
        // so badge text (fg) never depends on the unknown thumbnail. The worst case
        // is the image that pulls the scrim closest to the text colour; test the
        // sRGB extremes + mid-grey and require the floor to clear AA.
        (int, int, int)[] images = { (255, 255, 255), (0, 0, 0), (128, 128, 128) };
        double floor = double.MaxValue;
        foreach (var image in images)
        {
            var scrim = Over(c["bg-void"], image, 0.65);
            floor = Math.Min(floor, ContrastRatio(c["fg"], scrim));
        }
        Assert.True(floor >= 4.5,
            $"{theme}: tile badge fg over bg-void@65% scrim floor = {floor:0.00}:1 (<4.5)");
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
