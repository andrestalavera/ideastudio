namespace IdeaStudio.Website.State;

/// <summary>
/// The pure root reducer. Returns the same <see cref="AppState"/> reference when an
/// action would not change the relevant slice, so <see cref="Store{TState}"/> can
/// skip notifying subscribers on no-op dispatches.
/// </summary>
public static class AppReducer
{
    public static AppState Reduce(AppState state, IAction action) => action switch
    {
        SetTheme a => a.Theme == state.Theme ? state : state with { Theme = a.Theme },
        ToggleTheme => state with { Theme = state.Theme == "dark" ? "light" : "dark" },
        SetCulture a => a.Culture == state.Culture ? state : state with { Culture = a.Culture },
        SetConsent a => a.Status == state.Consent ? state : state with { Consent = a.Status },
        _ => state
    };
}
