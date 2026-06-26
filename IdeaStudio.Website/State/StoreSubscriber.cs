using Microsoft.AspNetCore.Components;

namespace IdeaStudio.Website.State;

/// <summary>
/// Optional base component for future state-driven UI: subscribes to the store on
/// init, marshals <see cref="Store{TState}.Changed"/> back onto the renderer and
/// unsubscribes on dispose. Not wired into any existing component yet.
/// </summary>
public abstract class StoreSubscriber<TState> : ComponentBase, IDisposable
    where TState : class
{
    private bool subscribed;

    [Inject]
    protected Store<TState> Store { get; set; } = default!;

    /// <summary>The current immutable state.</summary>
    protected TState State => Store.State;

    protected override void OnInitialized()
    {
        base.OnInitialized();
        Store.Changed += OnStoreChanged;
        subscribed = true;
    }

    private void OnStoreChanged() => InvokeAsync(StateHasChanged);

    public virtual void Dispose()
    {
        if (subscribed)
        {
            Store.Changed -= OnStoreChanged;
            subscribed = false;
        }

        GC.SuppressFinalize(this);
    }
}
