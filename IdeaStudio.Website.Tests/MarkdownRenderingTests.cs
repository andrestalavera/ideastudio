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

    // The highlighter (js/prose) colours a listing by its language-* class.
    [Fact]
    public void ToHtml_FencedCode_KeepsLanguageClassForHighlighter()
        => Assert.Contains("<code class=\"language-csharp\">", MarkdownRendering.ToHtml("```csharp\nvar x = 1;\n```"));

    // A mermaid fence becomes a diagram host (rendered to SVG by js/prose), its source
    // HTML-encoded so a label can never inject markup.
    [Fact]
    public void ToHtml_MermaidFence_RendersEncodedDiagramHost()
    {
        string html = MarkdownRendering.ToHtml("```mermaid\nflowchart TD\n  A[\"<b>x</b>\"] --> B\n```", diagramLabel: "Schéma");

        Assert.Contains("<figure class=\"ds-diagram\" tabindex=\"0\" aria-label=\"Schéma\"><pre class=\"mermaid\">", html);
        Assert.Contains("--> B\n</pre></figure>", html);
        Assert.Contains("&lt;b>", html);
        Assert.DoesNotContain("language-mermaid", html);
    }

    // The table itself stays a real table (display: block would drop its semantics in
    // Safari/VoiceOver); a named, focusable region around it does the scrolling.
    [Fact]
    public void ToHtml_Table_IsWrappedInNamedFocusableRegion()
    {
        string html = MarkdownRendering.ToHtml("| A | B |\n| --- | --- |\n| 1 | 2 |", tableLabel: "Tableau");

        Assert.Contains("<div class=\"ds-table-scroll\" role=\"region\" tabindex=\"0\" aria-label=\"Tableau\"><table>", html);
        Assert.Contains("</table></div>", html);
    }
}
