namespace IdeaStudio.Website.State;

/// <summary>
/// A tiny, allocation-light, single-threaded observable store. The current state
/// is immutable; every change produces a new reference via a pure reducer.
/// Subscribers are notified through <see cref="Changed"/> only when the reducer
/// actually returns a new reference, so no-op dispatches stay silent.
/// </summary>
/// <remarks>
/// Constrained to reference types so the no-op guard can rely on
/// <see cref="object.ReferenceEquals(object, object)"/>. In Blazor WebAssembly the
/// app runs on a single thread, so no locking is required.
/// </remarks>
public sealed class Store<TState>(TState initialState, Func<TState, IAction, TState> reduce)
    where TState : class
{
    private readonly Func<TState, IAction, TState> reduce = reduce;
    private TState state = initialState;

    /// <summary>The current immutable state.</summary>
    public TState State => state;

    /// <summary>Raised after a dispatch that produced a new state reference.</summary>
    public event Action? Changed;

    /// <summary>
    /// Runs the reducer for <paramref name="action"/> and, when the result is a
    /// new reference, swaps the state and notifies subscribers.
    /// </summary>
    public void Dispatch(IAction action)
    {
        TState next = reduce(state, action);
        if (ReferenceEquals(next, state))
        {
            return;
        }

        state = next;
        Changed?.Invoke();
    }
}
