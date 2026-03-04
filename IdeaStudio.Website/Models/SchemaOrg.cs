using System.Text.Json;
using System.Text.Json.Serialization;

namespace IdeaStudio.Website.Models;

/// <summary>
/// Schema.org structured data models for SEO, AEO, and GEO optimization.
/// These models generate JSON-LD for search engines and AI assistants.
/// </summary>
public static class SchemaOrg
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    /// <summary>
    /// Serializes a schema object to JSON-LD string.
    /// </summary>
    public static string ToJsonLd<T>(T schema) where T : class
        => JsonSerializer.Serialize(schema, JsonOptions);

    /// <summary>
    /// Schema.org Person for professional profiles.
    /// </summary>
    public record Person(
        string Name,
        string? JobTitle = null,
        string? Description = null,
        string? Url = null,
        string? Image = null,
        string[]? SameAs = null,
        string[]? KnowsAbout = null,
        PostalAddress? Address = null,
        Organization? WorksFor = null,
        string? Email = null,
        string? Telephone = null)
    {
        [JsonPropertyName("@context")]
        public string Context => "https://schema.org";

        [JsonPropertyName("@type")]
        public string Type => "Person";
    }

    /// <summary>
    /// Schema.org Organization.
    /// </summary>
    public record Organization(
        string Name,
        string? Url = null,
        string? Logo = null,
        string? Description = null,
        string? AlternateName = null,
        PostalAddress? Address = null,
        string[]? SameAs = null,
        string? Email = null,
        string? Telephone = null)
    {
        [JsonPropertyName("@context")]
        public string Context => "https://schema.org";

        [JsonPropertyName("@type")]
        public string Type => "Organization";
    }

    /// <summary>
    /// Schema.org PostalAddress.
    /// </summary>
    public record PostalAddress(
        string? StreetAddress = null,
        string? AddressLocality = null,
        string? AddressRegion = null,
        string? PostalCode = null,
        string? AddressCountry = null)
    {
        [JsonPropertyName("@type")]
        public string Type => "PostalAddress";
    }

    /// <summary>
    /// Schema.org WebSite for site-wide search features.
    /// </summary>
    public record WebSite(
        string Name,
        string Url,
        string? Description = null,
        string? AlternateName = null,
        Organization? Publisher = null)
    {
        [JsonPropertyName("@context")]
        public string Context => "https://schema.org";

        [JsonPropertyName("@type")]
        public string Type => "WebSite";
    }

    /// <summary>
    /// Schema.org WebPage for individual pages.
    /// </summary>
    public record WebPage(
        string Name,
        string Url,
        string? Description = null,
        string? DatePublished = null,
        string? DateModified = null,
        Person? Author = null,
        Organization? Publisher = null,
        BreadcrumbList? Breadcrumb = null)
    {
        [JsonPropertyName("@context")]
        public string Context => "https://schema.org";

        [JsonPropertyName("@type")]
        public string Type => "WebPage";
    }

    /// <summary>
    /// Schema.org BreadcrumbList for navigation.
    /// </summary>
    public record BreadcrumbList(ListItem[] ItemListElement)
    {
        [JsonPropertyName("@context")]
        public string Context => "https://schema.org";

        [JsonPropertyName("@type")]
        public string Type => "BreadcrumbList";
    }

    /// <summary>
    /// Schema.org ListItem for breadcrumbs.
    /// </summary>
    public record ListItem(int Position, string Name, string? Item = null)
    {
        [JsonPropertyName("@type")]
        public string Type => "ListItem";
    }

    /// <summary>
    /// Schema.org Product for e-commerce.
    /// </summary>
    public record Product(
        string Name,
        string? Description = null,
        string? Image = null,
        string? Url = null,
        string? Sku = null,
        string? Brand = null,
        string? Category = null,
        Offer? Offers = null,
        AggregateRating? AggregateRating = null)
    {
        [JsonPropertyName("@context")]
        public string Context => "https://schema.org";

        [JsonPropertyName("@type")]
        public string Type => "Product";

        [JsonPropertyName("brand")]
        public object? BrandObject => Brand is not null
            ? new { @type = "Brand", name = Brand }
            : null;
    }

    /// <summary>
    /// Schema.org Offer for product pricing.
    /// </summary>
    public record Offer(
        string Price,
        string PriceCurrency = "EUR",
        string Availability = "https://schema.org/InStock",
        string? Url = null,
        string? ValidFrom = null,
        string? ValidThrough = null)
    {
        [JsonPropertyName("@type")]
        public string Type => "Offer";
    }

    /// <summary>
    /// Schema.org AggregateRating for reviews.
    /// </summary>
    public record AggregateRating(
        double RatingValue,
        int ReviewCount,
        double BestRating = 5,
        double WorstRating = 1)
    {
        [JsonPropertyName("@type")]
        public string Type => "AggregateRating";
    }

    /// <summary>
    /// Schema.org FAQPage for AEO (Answer Engine Optimization).
    /// </summary>
    public record FAQPage(Question[] MainEntity)
    {
        [JsonPropertyName("@context")]
        public string Context => "https://schema.org";

        [JsonPropertyName("@type")]
        public string Type => "FAQPage";
    }

    /// <summary>
    /// Schema.org Question for FAQ.
    /// </summary>
    public record Question(string Name, Answer AcceptedAnswer)
    {
        [JsonPropertyName("@type")]
        public string Type => "Question";
    }

    /// <summary>
    /// Schema.org Answer for FAQ.
    /// </summary>
    public record Answer(string Text)
    {
        [JsonPropertyName("@type")]
        public string Type => "Answer";
    }

    /// <summary>
    /// Schema.org ItemList for collections.
    /// </summary>
    public record ItemList(
        string Name,
        string? Description,
        int NumberOfItems,
        ListItem[] ItemListElement)
    {
        [JsonPropertyName("@context")]
        public string Context => "https://schema.org";

        [JsonPropertyName("@type")]
        public string Type => "ItemList";
    }

    /// <summary>
    /// Schema.org Service for professional services.
    /// </summary>
    public record Service(
        string Name,
        string? Description = null,
        string? Url = null,
        Organization? Provider = null,
        string? ServiceType = null,
        string? AreaServed = null)
    {
        [JsonPropertyName("@context")]
        public string Context => "https://schema.org";

        [JsonPropertyName("@type")]
        public string Type => "Service";
    }

    /// <summary>
    /// Creates a breadcrumb list from path segments.
    /// </summary>
    public static BreadcrumbList CreateBreadcrumb(string baseUrl, params (string name, string path)[] items)
    {
        var listItems = items.Select((item, index) => new ListItem(
            Position: index + 1,
            Name: item.name,
            Item: $"{baseUrl.TrimEnd('/')}{item.path}"
        )).ToArray();

        return new BreadcrumbList(listItems);
    }
}
