using Markdig;

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
}
