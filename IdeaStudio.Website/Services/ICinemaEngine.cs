using Microsoft.AspNetCore.Components;

namespace IdeaStudio.Website.Services;

public interface ICinemaEngine
{
    Task InitializeAsync(ElementReference canvas);
    Task SetSceneAsync(string sceneName, IReadOnlyDictionary<string, object?>? parameters = null);
    Task RegisterRevealAsync(string id, ElementReference element, RevealOptions? options = null);
    Task UnregisterRevealAsync(string id);
    Task RegisterPinnedTimelineAsync(ElementReference container, ElementReference track, int cardCount);
    Task UnregisterPinnedTimelineAsync();
    Task SetCultureAsync(string cultureName);
}

public sealed record RevealOptions(
    string Kind = "fade-up",
    double DelayMs = 0,
    double StaggerMs = 80,
    string? Selector = null);
