namespace IdeaStudio.Website.State;

/// <summary>
/// Marker for an intent dispatched to <see cref="Store{TState}"/>. Actions are
/// immutable records carrying the data a reducer needs to produce the next state.
/// </summary>
public interface IAction
{
}
