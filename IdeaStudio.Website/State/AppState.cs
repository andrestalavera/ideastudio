namespace IdeaStudio.Website.State;

/// <summary>Cookie / tracker consent, as a single closed value.</summary>
public enum ConsentStatus
{
    /// <summary>No decision recorded yet (or expired).</summary>
    Unknown = 0,

    /// <summary>The visitor accepted tracking.</summary>
    Granted = 1,

    /// <summary>The visitor declined tracking.</summary>
    Denied = 2
}

/// <summary>
/// The aggregate client state for the app: the single source of truth behind the
/// theme, culture and consent services. Immutable; mutated only via the reducer.
/// </summary>
public sealed record AppState(string Theme, string Culture, ConsentStatus Consent)
{
    /// <summary>The pre-hydration defaults (dark theme, French, no consent decision).</summary>
    public static AppState Initial { get; } = new("dark", "fr", ConsentStatus.Unknown);
}
