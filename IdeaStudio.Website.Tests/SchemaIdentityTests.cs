using System.Text.Json;
using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Tests;

/// <summary>
/// Guards the Schema.org identity shared by every page: stable @ids and the name variants
/// people actually search for ("Andres Talavera", "IdeaStudio").
/// </summary>
public class SchemaIdentityTests
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void Person_JsonLd_CarriesIdAndNameVariants(bool fr)
    {
        using JsonDocument doc = JsonDocument.Parse(SchemaOrg.ToJsonLd(SchemaIdentity.Person(fr)));
        JsonElement root = doc.RootElement;

        Assert.Equal(SchemaIdentity.PersonId, root.GetProperty("@id").GetString());
        Assert.Equal("Andrés Talavera", root.GetProperty("name").GetString());
        Assert.Contains("Andres Talavera", root.GetProperty("alternateName").EnumerateArray().Select(e => e.GetString()));

        JsonElement org = root.GetProperty("worksFor");
        Assert.Equal(SchemaIdentity.OrganizationId, org.GetProperty("@id").GetString());
        Assert.Contains("IdeaStudio", org.GetProperty("alternateName").EnumerateArray().Select(e => e.GetString()));
    }

    [Fact]
    public void WebSite_JsonLd_PointsAtSiteRootWithBrandVariants()
    {
        using JsonDocument doc = JsonDocument.Parse(SchemaOrg.ToJsonLd(SchemaIdentity.WebSite(fr: true)));
        JsonElement root = doc.RootElement;

        Assert.Equal(SchemaIdentity.WebSiteId, root.GetProperty("@id").GetString());
        Assert.Equal(SchemaIdentity.SiteUrl, root.GetProperty("url").GetString());
        Assert.Contains("IdeaStudio", root.GetProperty("alternateName").EnumerateArray().Select(e => e.GetString()));
    }

    // Modules prepare for exams; they must never claim to award a credential.
    [Fact]
    public void Course_JsonLd_UsesOrganizationProviderAndAwardsNoCredential()
    {
        SchemaOrg.Course course = new(
            Name: "Module",
            Description: "Summary",
            Provider: SchemaIdentity.Organization(),
            Offers: new SchemaOrg.CourseOffer("Paid"),
            HasCourseInstance: new SchemaOrg.CourseInstance(["Onsite", "Online"], "P2D", SchemaIdentity.PersonRef()));

        string json = SchemaOrg.ToJsonLd(course);
        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        Assert.Equal(SchemaIdentity.OrganizationId, root.GetProperty("provider").GetProperty("@id").GetString());
        Assert.Equal(SchemaIdentity.PersonId, root.GetProperty("hasCourseInstance").GetProperty("instructor").GetProperty("@id").GetString());
        Assert.DoesNotContain("educationalCredentialAwarded", json);
    }
}
