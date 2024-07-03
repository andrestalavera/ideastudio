namespace IdeaStudio.Website.Tests;

public class ExtensionsTests
{
    [Theory]
    [InlineData("Hello World", "hello-world")]
    [InlineData("Andrés Talavera's test", "andres-talavera-s-test")]
    public void ToSeo_ShouldReturns_CorrectUrl(string url, string expected)
    {
        // Arrange
        // Act
        var result = url.ToSeoUrl();

        // Assert
        Assert.Equal(expected, result);
    }
}