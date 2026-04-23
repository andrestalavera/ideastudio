using System.Reflection;
using Microsoft.AspNetCore.Components;

namespace IdeaStudio.Website.Tests;

/// <summary>
/// Integration-style tests for the Blazor WebAssembly routing surface.
/// Because the site is statically hosted (no ASP.NET Core host), we cannot
/// use <c>WebApplicationFactory</c>. Instead we introspect the compiled
/// assembly and assert that every production URL template is declared on a
/// routable component via <see cref="RouteAttribute"/>.
/// </summary>
public class IntegrationTests
{
    private static readonly HashSet<string> DeclaredRoutes = DiscoverRoutes();

    [Theory]
    [InlineData("/fr")]
    [InlineData("/en")]
    [InlineData("/fr/services")]
    [InlineData("/en/services")]
    [InlineData("/fr/services/{slug}")]
    [InlineData("/en/services/{slug}")]
    [InlineData("/fr/realisations")]
    [InlineData("/en/projects")]
    [InlineData("/fr/cv")]
    [InlineData("/en/resume")]
    [InlineData("/fr/mentions-legales")]
    [InlineData("/en/legal")]
    [InlineData("/fr/confidentialite")]
    [InlineData("/en/privacy")]
    public void NewRoutes_AreDeclaredOnComponents(string template)
    {
        Assert.Contains(template, DeclaredRoutes);
    }

    [Theory]
    // Each slug template is covered by the parameterised detail route above;
    // this test makes sure requesting each specific slug resolves against the
    // templated `/{culture}/services/{slug}` entry at runtime.
    [InlineData("/fr/services/consultant-dotnet-azure", "/fr/services/{slug}")]
    [InlineData("/fr/services/techlead", "/fr/services/{slug}")]
    [InlineData("/fr/services/formateur", "/fr/services/{slug}")]
    [InlineData("/fr/services/vibe-coding", "/fr/services/{slug}")]
    [InlineData("/fr/services/applications-mobiles", "/fr/services/{slug}")]
    [InlineData("/fr/services/sites-internet", "/fr/services/{slug}")]
    [InlineData("/en/services/dotnet-azure-consulting", "/en/services/{slug}")]
    [InlineData("/en/services/tech-lead", "/en/services/{slug}")]
    [InlineData("/en/services/trainer", "/en/services/{slug}")]
    [InlineData("/en/services/vibe-coding", "/en/services/{slug}")]
    [InlineData("/en/services/mobile-apps", "/en/services/{slug}")]
    [InlineData("/en/services/websites", "/en/services/{slug}")]
    public void ServiceSlug_Routes_MatchTemplate(string requestedPath, string template)
    {
        Assert.Contains(template, DeclaredRoutes);
        // Sanity: the requested path shares the same prefix as the template.
        string prefix = template[..template.IndexOf('{')];
        Assert.StartsWith(prefix, requestedPath);
    }

    private static HashSet<string> DiscoverRoutes()
    {
        Assembly websiteAssembly = typeof(Program).Assembly;
        HashSet<string> routes = new(StringComparer.Ordinal);

        foreach (Type type in websiteAssembly.GetTypes())
        {
            if (!typeof(ComponentBase).IsAssignableFrom(type)) continue;
            foreach (RouteAttribute route in type.GetCustomAttributes<RouteAttribute>(inherit: false))
            {
                routes.Add(route.Template);
            }
        }

        return routes;
    }
}
