using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace IdeaStudio.Website.Tests;

public class IntegrationTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory = factory;

    [Theory]
    [InlineData("/", Skip = "Not implemented yet")]
    [InlineData("/contact", Skip = "Contact page is not implemented yet")]
    [InlineData("/privacy", Skip = "Not implemented yet")]
    public async Task Get_EndpointsReturnSuccessAndCorrectContentType(string url)
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync(url);

        // Assert
        response.EnsureSuccessStatusCode();
        response.Content.Headers.ContentType?.ToString().Should().Contain("text/html");
    }
}
