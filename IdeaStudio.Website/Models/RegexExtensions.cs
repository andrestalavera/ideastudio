using System.Text.RegularExpressions;

namespace IdeaStudio.Website.Models;

public static partial class RegexExtensions
{
    [GeneratedRegex(@"[ .:,'""/()&éè]+")]
    public static partial Regex ProcessTitleToId();
}
