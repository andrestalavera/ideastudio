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
    /// </summary>
    internal static string ToHtml(string markdown)
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
        return document.ToHtml(Pipeline);
    }
}
