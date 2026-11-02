using Microsoft.AspNetCore.Components;

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
    /// Notifies the runtime that a client-side navigation occurred, so it can rewire
    /// reveals and re-measure the hero (nav-morph) for the new page. No-op if the
    /// runtime has not booted yet.
    /// </summary>
    Task NotifyRouteChangedAsync();

    /// <summary>
    /// Colours the code listings and renders the mermaid diagrams inside a rendered
    /// article body. Loads its own module (js/prose) on first use, not the cinema bundle.
    /// </summary>
    Task EnhanceProseAsync(ElementReference root);
}
