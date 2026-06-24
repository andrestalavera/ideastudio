using System.Net.Http.Json;

namespace IdeaStudio.Website.Services;

/// <summary>A contact-form submission.</summary>
public record ContactRequest(string Name, string Email, string? Subject, string Message);

/// <summary>
/// Sends contact-form submissions. The implementation is swappable at DI
/// registration without touching the Contact page — mirrors the IContentGateway
/// split. Currently posts to the Netlify function (netlify/functions/contact.mts)
/// which relays over SMTP; an Azure Function / IdeaStudio.Apis endpoint could be
/// dropped in later.
/// </summary>
public interface IContactService
{
    Task<bool> SendAsync(ContactRequest request);
}

/// <summary>
/// Posts the submission to the Netlify function at <c>/.netlify/functions/contact</c>,
/// which sends the email via SMTP. The function returns <c>{ "success": true }</c>
/// on delivery.
/// </summary>
public sealed class NetlifyEmailContactService : IContactService
{
    private const string Endpoint = "/.netlify/functions/contact";

    private readonly HttpClient http;

    public NetlifyEmailContactService(HttpClient http) => this.http = http;

    public async Task<bool> SendAsync(ContactRequest request)
    {
        var payload = new
        {
            name = request.Name,
            email = request.Email,
            subject = request.Subject ?? string.Empty,
            message = request.Message,
        };

        try
        {
            // Relative to HttpClient.BaseAddress (the site host).
            HttpResponseMessage response = await http.PostAsJsonAsync(Endpoint, payload);
            if (!response.IsSuccessStatusCode)
            {
                return false;
            }

            ContactResponse? body = await response.Content.ReadFromJsonAsync<ContactResponse>();
            return body?.Success ?? false;
        }
        catch
        {
            return false;
        }
    }

    private sealed record ContactResponse(bool Success, string? Error);
}
