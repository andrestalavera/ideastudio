using IdeaStudio.Website.Models;

namespace IdeaStudio.Website.Tests;

public class TrainingLevelsTests
{
    [Theory]
    [InlineData("foundation", true, "Fondamentaux")]
    [InlineData("foundation", false, "Foundation")]
    [InlineData("Intermediate", true, "Intermédiaire")]
    [InlineData("intermediate", false, "Intermediate")]
    [InlineData("advanced", true, "Avancé")]
    [InlineData("advanced", false, "Advanced")]
    public void Label_KnownLevel_ReturnsCultureLabel(string level, bool fr, string expected)
        => Assert.Equal(expected, TrainingLevels.Label(level, fr));

    [Fact]
    public void Label_UnknownLevel_ReturnsInput()
        => Assert.Equal("expert", TrainingLevels.Label("expert", fr: true));

    [Fact]
    public void Label_Null_ReturnsEmpty()
        => Assert.Equal(string.Empty, TrainingLevels.Label(null, fr: false));
}
