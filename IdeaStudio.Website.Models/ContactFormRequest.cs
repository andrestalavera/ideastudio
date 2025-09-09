namespace IdeaStudio.Website.Models;

/// <summary>
/// Represents a contact form request
/// </summary>
/// <param name="Name">Name of the sender</param>
/// <param name="Message">Message of the sender</param>
public record ContactFormRequest
{
    public string? Name { get; init; }
    public string? Message { get; init; }
}
