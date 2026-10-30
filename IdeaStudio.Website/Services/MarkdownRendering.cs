using Markdig;
using Markdig.Syntax;

namespace IdeaStudio.Website.Services;

/// <summary>
/// The one Markdown pipeline for blog bodies. Its output goes into a MarkupString,
/// which bypasses Razor's HTML encoding, so raw HTML must stay disabled.
/// </summary>
internal static class MarkdownRendering
{
    internal static readonly MarkdownPipeline Pipeline =
        new MarkdownPipelineBuilder()
            .UseAdvancedExtensions()
            .DisableHtml()
            .Build();

    /// <summary>
    /// Renders a blog body. The page already owns the only h1 (the post title), so a body
    /// whose sections start at "#" is shifted down one level; "##" bodies are unchanged.
    /// <paramref name="tableLabel"/> names the scroll region around each table, in the page language.
    /// </summary>
    internal static string ToHtml(string markdown, string tableLabel = "Table")
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
        string region = $"<div class=\"ds-table-scroll\" role=\"region\" tabindex=\"0\" aria-label=\"{System.Net.WebUtility.HtmlEncode(tableLabel)}\">";
        return document.ToHtml(Pipeline)
            .Replace("<pre>", "<pre tabindex=\"0\">", StringComparison.Ordinal)
            .Replace("<table>", region + "<table>", StringComparison.Ordinal)
            .Replace("</table>", "</table></div>", StringComparison.Ordinal);
    }
}
