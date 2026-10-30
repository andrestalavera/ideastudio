using IdeaStudio.Website.Services;

namespace IdeaStudio.Website.Tests;

/// <summary>
/// The article page already renders the post title as the only h1, so a body written
/// with top-level "#" sections must not add more h1s. Bodies written with "##" stay as-is.
/// </summary>
public class MarkdownRenderingTests
{
    [Fact]
    public void ToHtml_BodyWithH1Sections_DemotesEveryHeadingOneLevel()
    {
        string html = MarkdownRendering.ToHtml("# Section\n\ntext\n\n## Sub\n\n###### Deep");

        Assert.DoesNotContain("<h1", html);
        Assert.Contains("<h2", html);
        Assert.Contains("<h3", html);
        Assert.Contains("<h6", html);
    }

    [Fact]
    public void ToHtml_BodyWithH2Sections_KeepsLevels()
    {
        string html = MarkdownRendering.ToHtml("## Section\n\n### Sub");

        Assert.Contains("<h2", html);
        Assert.Contains("<h3", html);
        Assert.DoesNotContain("<h4", html);
    }

    [Fact]
    public void ToHtml_RawHtml_StaysEscaped()
        => Assert.DoesNotContain("<script", MarkdownRendering.ToHtml("# T\n\n<script>alert(1)</script>"));

    // RGAA 7.3 / WCAG 2.1.1: a code listing or table wider than the column scrolls inside
    // its frame, so keyboard users must be able to focus it to scroll it.
    [Fact]
    public void ToHtml_CodeBlock_IsKeyboardFocusable()
        => Assert.Contains("<pre tabindex=\"0\"", MarkdownRendering.ToHtml("```csharp\nvar x = 1;\n```"));

    [Fact]
    public void ToHtml_Table_IsKeyboardFocusable()
        => Assert.Contains("<table tabindex=\"0\"", MarkdownRendering.ToHtml("| A | B |\n| --- | --- |\n| 1 | 2 |"));
}
