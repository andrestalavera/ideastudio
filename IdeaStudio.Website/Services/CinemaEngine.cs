using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace IdeaStudio.Website.Services;

public sealed class CinemaEngine : ICinemaEngine
{
    private readonly IJSRuntime js;
    private IJSObjectReference? module;
    private DotNetObjectReference<CinemaEngine>? selfRef;
    private bool initialized;

    public CinemaEngine(IJSRuntime js) => this.js = js;

    public async Task InitializeAsync(ElementReference canvas)
    {
        if (initialized) return;
        module = await js.InvokeAsync<IJSObjectReference>("import", "./js/cinema.bundle.js");
        selfRef = DotNetObjectReference.Create(this);
        await module.InvokeVoidAsync("initialize", canvas, selfRef);
        initialized = true;
    }

    public Task SetSceneAsync(string sceneName, IDictionary<string, object?>? parameters = null)
        => module is null ? Task.CompletedTask : module.InvokeVoidAsync("setScene", sceneName, parameters).AsTask();

    public Task RegisterRevealAsync(string id, ElementReference element, RevealOptions? options = null)
        => module is null ? Task.CompletedTask : module.InvokeVoidAsync("registerReveal", id, element, options ?? new RevealOptions()).AsTask();

    public Task UnregisterRevealAsync(string id)
        => module is null ? Task.CompletedTask : module.InvokeVoidAsync("unregisterReveal", id).AsTask();

    public Task RegisterPinnedTimelineAsync(ElementReference container, ElementReference track, int cardCount)
        => module is null ? Task.CompletedTask : module.InvokeVoidAsync("registerPinnedTimeline", container, track, cardCount).AsTask();

    public Task SetCultureAsync(string cultureName)
        => module is null ? Task.CompletedTask : module.InvokeVoidAsync("setCulture", cultureName).AsTask();

    public async ValueTask DisposeAsync()
    {
        if (module is not null)
        {
            try { await module.InvokeVoidAsync("dispose"); } catch { /* ignore: page unload */ }
            await module.DisposeAsync();
        }
        selfRef?.Dispose();
    }
}
