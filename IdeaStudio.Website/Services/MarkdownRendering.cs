using System.Text.RegularExpressions;
using Markdig;
using Markdig.Syntax;

namespace IdeaStudio.Website.Services;

/// <summary>
/// The one Markdown pipeline for blog bodies. Its output goes into a MarkupString,
/// which bypasses Razor's HTML encoding, so raw HTML must stay disabled.
/// </summary>
internal static partial class MarkdownRendering
{
    internal static readonly MarkdownPipeline Pipeline =
        new MarkdownPipelineBuilder()
            .UseAdvancedExtensions()
            .DisableHtml()
            .Build();

    /// <summary>
    /// Renders a blog body. The page already owns the only h1 (the post title), so a body
    /// whose sections start at "#" is shifted down one level; "##" bodies are unchanged.
    /// <paramref name="tableLabel"/> names the scroll region around each table, and
    /// <paramref name="diagramLabel"/> each mermaid diagram, in the page language.
    /// </summary>
    internal static string ToHtml(string markdown, string tableLabel = "Table", string diagramLabel = "Diagram")
    {
        MarkdownDocument document = Markdown.Parse(markdown, Pipeline);
        List<HeadingBlock> headings = [.. document.Descendants<HeadingBlock>()];
        if (headings.Any(h => h.Level == 1))
        {
            foreach (HeadingBlock heading in headings)
            {
                heading.Level = Math.Min(heading.Level + 1, 6);
            }
        }
        // Code listings and tables scroll inside their frame when wider than the column
        // (RGAA 7.3, WCAG 2.1.1): make them focusable so the keyboard can scroll them. A table
        // keeps display: table (its semantics); a named region around it does the scrolling.
        // Raw HTML is disabled, so a literal "<pre>" or "<table>" here is always ours.
        // A mermaid fence comes out as <pre class="mermaid"> (encoded source, no <code>):
        // js/prose turns it into an SVG inside the same focusable, named frame.
        string region = $"<div class=\"ds-table-scroll\" role=\"region\" tabindex=\"0\" aria-label=\"{Attribute(tableLabel)}\">";
        string figure = $"<figure class=\"ds-diagram\" tabindex=\"0\" aria-label=\"{Attribute(diagramLabel)}\">";
        string html = document.ToHtml(Pipeline)
            .Replace("<pre>", "<pre tabindex=\"0\">", StringComparison.Ordinal)
            .Replace("<table>", region + "<table>", StringComparison.Ordinal)
            .Replace("</table>", "</table></div>", StringComparison.Ordinal);
        return MermaidBlock().Replace(html, m => figure + m.Value + "</figure>");
    }

    // WebUtility.HtmlEncode would turn "é" into "&#233;": only the characters that can
    // break out of a quoted attribute need escaping (the page is UTF-8).
    private static string Attribute(string value) => value
        .Replace("&", "&amp;", StringComparison.Ordinal)
        .Replace("\"", "&quot;", StringComparison.Ordinal)
        .Replace("<", "&lt;", StringComparison.Ordinal)
        .Replace(">", "&gt;", StringComparison.Ordinal);

    [GeneratedRegex("<pre class=\"mermaid\">.*?</pre>", RegexOptions.Singleline)]
    private static partial Regex MermaidBlock();
}
