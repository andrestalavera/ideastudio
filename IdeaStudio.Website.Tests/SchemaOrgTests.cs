using System.Text.Json;
using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Tests;

public class SchemaOrgTests
{
    private static readonly SchemaOrg.Person Provider = new("Andrés Talavera");

    [Fact]
    public void ToJsonLd_ProfessionalService_OfferCatalogUsesJsonLdTypeKeys()
    {
        SchemaOrg.ProfessionalService professional = new(
            Name: "IdeaStud.io services",
            Description: "d",
            Url: "https://ideastud.io/en/services",
            AreaServed: SchemaOrg.ServedAreas(fr: false),
            Provider: Provider,
            Services: [new SchemaOrg.Service("Trainer", "d", Provider, SchemaOrg.ServedAreas(fr: false))]);

        using JsonDocument doc = JsonDocument.Parse(SchemaOrg.ToJsonLd(professional));
        JsonElement catalog = doc.RootElement.GetProperty("hasOfferCatalog");

        Assert.Equal("OfferCatalog", catalog.GetProperty("@type").GetString());
        Assert.Equal("Offer", catalog.GetProperty("itemListElement")[0].GetProperty("@type").GetString());
        Assert.False(catalog.TryGetProperty("type", out _));
    }

    [Theory]
    [InlineData(true, "Suisse")]
    [InlineData(false, "Switzerland")]
    public void ServedAreas_Culture_EmitsTypedPlaces(bool fr, string switzerland)
    {
        SchemaOrg.Service service = new("Trainer", "d", Provider, SchemaOrg.ServedAreas(fr));

        using JsonDocument doc = JsonDocument.Parse(SchemaOrg.ToJsonLd(service));
        JsonElement[] areas = [.. doc.RootElement.GetProperty("areaServed").EnumerateArray()];

        Assert.Equal(["Country", "Country", "Place"], areas.Select(a => a.GetProperty("@type").GetString()));
        Assert.Equal(["France", switzerland, "Europe"], areas.Select(a => a.GetProperty("name").GetString()));
    }
}
