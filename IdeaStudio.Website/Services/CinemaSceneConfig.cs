using System.Collections.Immutable;

namespace IdeaStudio.Website.Services;

public static class CinemaSceneConfig
{
    public static IReadOnlyDictionary<string, object?> Empty { get; } = ImmutableDictionary<string, object?>.Empty;
}
