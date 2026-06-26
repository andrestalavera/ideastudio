namespace IdeaStudio.Website.State;

/// <summary>Set the active theme explicitly (<c>"light"</c> or <c>"dark"</c>).</summary>
public sealed record SetTheme(string Theme) : IAction;

/// <summary>Flip the active theme between light and dark.</summary>
public sealed record ToggleTheme : IAction;

/// <summary>Set the active culture (e.g. <c>"fr"</c> or <c>"en"</c>).</summary>
public sealed record SetCulture(string Culture) : IAction;

/// <summary>Record the visitor's consent decision.</summary>
public sealed record SetConsent(ConsentStatus Status) : IAction;
