using IdeaStudio.Website.Services;
using Markdig;

namespace IdeaStudio.Website.Tests;

/// <summary>
/// BlogArticle renders Markdown into a MarkupString, which bypasses Razor encoding.
/// The shared pipeline it uses must keep raw HTML inert across Markdig upgrades.
/// </summary>
public class MarkdownSanitizationTests
{
    [Theory]
    [InlineData("<script>alert(1)</script>")]
    [InlineData("Text <img src=x onerror=alert(1)> inline")]
    [InlineData("<iframe src=\"https://evil.example\"></iframe>")]
    public void ToHtml_RawHtml_IsEscaped(string markdown)
    {
        string html = Markdown.ToHtml(markdown, MarkdownRendering.Pipeline);

        Assert.DoesNotContain("<script", html, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("<img", html, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("<iframe", html, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("&lt;", html);
    }
}
