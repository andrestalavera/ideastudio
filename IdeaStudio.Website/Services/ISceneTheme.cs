namespace IdeaStudio.Website.Services;

/// <summary>
/// Thin JS-interop wrapper driving the scene-aware CSS theme.
/// Replaces the former cinema-engine interface — all visual work is now
/// SCSS-driven (ambient backdrop + reveals + magnetic) rather than WebGL/GSAP.
/// </summary>
public interface ISceneTheme
{
    /// <summary>Boots the small runtime (cursor, reveals, magnetic, sticky-hero). Idempotent.</summary>
    Task InitializeAsync();

    /// <summary>
    /// Applies a scene by setting <c>html[data-scene="&lt;scene&gt;"]</c> and,
    /// if provided, <c>--ds-scene-accent</c> on the root.
    /// </summary>
    Task ApplyAsync(string scene, IReadOnlyDictionary<string, object?>? parameters = null);

    /// <summary>Triggers a brief <c>html.is-pulsing</c> window so SCSS can react to a state change.</summary>
    Task PulseAsync();
}
