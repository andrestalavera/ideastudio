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
}
