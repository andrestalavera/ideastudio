namespace IdeaStudio.Website.Models;

public static class Extensions
{
    public static string ToSeoUrl(this string url) 
    => url.ToLower().Replace("'", "-").Replace("é", "e").Replace(" ", "-");
}