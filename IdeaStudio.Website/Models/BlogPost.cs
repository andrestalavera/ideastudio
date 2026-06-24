namespace IdeaStudio.Website.Models;

/// <summary>A blog article. <see cref="Body"/> is Markdown, rendered to HTML at display time.</summary>
public record BlogPost(
    string Slug,
    string Title,
    string Summary,
    string Date,
    int ReadingMinutes,
    IReadOnlyList<string> Tags,
    string Body
);
