using System.Text;
using System.Text.Json;
using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Services;

public interface IContactService
{
    Task<bool> SendContactFormAsync(ContactFormRequest contactForm);
}

public class ContactService(HttpClient httpClient, IConfiguration configuration, ILoggerFactory loggerFactory) : IContactService
{
    private readonly HttpClient httpClient = httpClient;
    private readonly IConfiguration configuration = configuration;
    private readonly ILogger<ContactService> logger = loggerFactory.CreateLogger<ContactService>();

    public async Task<bool> SendContactFormAsync(ContactFormRequest contactForm)
    {
        try
        {
            string? endpoint = configuration["ContactForm:ApiEndpoint"];
            if (string.IsNullOrEmpty(endpoint))
                throw new InvalidOperationException("ContactForm:ApiEndpoint configuration is missing");

            string json = JsonSerializer.Serialize(contactForm);
            StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

            HttpResponseMessage response = await httpClient.PostAsync(endpoint, content);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            logger.Exception("Error sending contact form", ex);
            return false;
        }
    }
}
