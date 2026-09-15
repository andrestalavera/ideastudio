namespace IdeaStudio.Website.Models;

/// <summary>
/// Single source of truth for the site's Schema.org identity: the person, the brand
/// and the website, with stable <c>@id</c>s so every page's JSON-LD describes the same
/// entities. Name variants live only here (alternateName), never in visible copy.
/// </summary>
public static class SchemaIdentity
{
    public const string SiteUrl = "https://ideastud.io";
    public const string PersonId = SiteUrl + "/#person";
    public const string OrganizationId = SiteUrl + "/#organization";
    public const string WebSiteId = SiteUrl + "/#website";

    public const string PersonName = "Andrés Talavera";
    public const string BrandName = "IdeaStud.io";
    public const string Image = SiteUrl + "/images/andres-talavera.jpeg";

    public static readonly string[] PersonAlternateNames = ["Andres Talavera"];
    public static readonly string[] BrandAlternateNames = ["IdeaStudio", "Idea Studio"];

    public static readonly string[] SameAs =
    [
        "https://www.linkedin.com/in/andres-talavera/",
        "https://github.com/andrestalavera",
        "https://x.com/imcresus_",
    ];

    // Topics, not credentials: the owner prepares teams for certifications, holds none.
    public static readonly string[] KnowsAbout =
    [
        ".NET", "C#", "ASP.NET Core", "Blazor", "Entity Framework Core", "Aspire",
        "Microsoft Azure", "Azure DevOps", "GitHub Actions", "GitHub Advanced Security",
        "GitHub Copilot", "Claude Code", "GitHub Spec Kit", "Spec-Driven Development",
        "Microsoft Foundry", "Model Context Protocol", "Docker", "Kubernetes", "PostgreSQL",
        "Keycloak", "FinOps", "Clean Architecture", "Domain-Driven Design", "SaaS",
        "Software training", "Certification exam preparation",
    ];

    public static string JobTitle(bool fr) =>
        fr ? "Consultant .NET & Azure, Tech lead, Formateur" : ".NET & Azure Consultant, Tech Lead, Trainer";

    public static SchemaOrg.Organization Organization() => new(
        Name: BrandName,
        Url: SiteUrl,
        AlternateName: BrandAlternateNames,
        Id: OrganizationId);

    public static SchemaOrg.Person Person(bool fr, string? description = null) => new(
        Name: PersonName,
        JobTitle: JobTitle(fr),
        Description: string.IsNullOrWhiteSpace(description) ? null : description,
        Url: SiteUrl,
        Image: Image,
        SameAs: SameAs,
        KnowsAbout: KnowsAbout,
        Address: new SchemaOrg.PostalAddress(AddressLocality: "Lyon", AddressRegion: "Auvergne-Rhône-Alpes", AddressCountry: "FR"),
        WorksFor: Organization(),
        Id: PersonId,
        AlternateName: PersonAlternateNames);

    /// <summary>Minimal reference to the person (for nested use such as a course instructor).</summary>
    public static SchemaOrg.Person PersonRef() => new(Name: PersonName, Url: SiteUrl, Id: PersonId);

    public static SchemaOrg.WebSite WebSite(bool fr) => new(
        Name: BrandName,
        Url: SiteUrl,
        Description: fr
            ? "IdeaStud.io, le site d'Andrés Talavera : consultant .NET & Azure, techlead et formateur."
            : "IdeaStud.io, the site of Andrés Talavera: .NET & Azure consultant, tech lead and trainer.",
        AlternateName: BrandAlternateNames,
        Publisher: Organization(),
        Id: WebSiteId,
        InLanguage: ["fr", "en"]);
}
