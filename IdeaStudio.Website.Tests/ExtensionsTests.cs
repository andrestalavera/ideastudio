using FluentAssertions;
using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Tests;

public class ExtensionsTests
{
    [Theory]
    [InlineData("Hello World", "hello-world")]
    [InlineData("Andrés Talavera's test", "andres-talavera-s-test")]
    [InlineData("C# is a .net language", "csharp-is-a-dotnet-language")]
    public void ToSeo_ShouldReturns_CorrectUrl(string url, string expected)
    {
        // Arrange
        // Act
        var result = url.ToSeoUrl();

        // Assert
        result.Should().Be(expected);
    }
}
