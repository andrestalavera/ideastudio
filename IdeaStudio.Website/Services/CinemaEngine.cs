using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace IdeaStudio.Website.Services;

public sealed class CinemaEngine : ICinemaEngine, IAsyncDisposable
{
    private readonly IJSRuntime js;
    private IJSObjectReference? module;
    private Task? initTask;

    public CinemaEngine(IJSRuntime js) => this.js = js;

    public Task InitializeAsync(ElementReference canvas) => initTask ??= InitializeCoreAsync(canvas);

    private async Task InitializeCoreAsync(ElementReference canvas)
    {
        module = await js.InvokeAsync<IJSObjectReference>("import", "./js/cinema.bundle.js");
        await module.InvokeVoidAsync("initialize", canvas);
    }

    public Task SetSceneAsync(string sceneName, IReadOnlyDictionary<string, object?>? parameters = null)
        => module is null ? Task.CompletedTask : module.InvokeVoidAsync("setScene", sceneName, parameters).AsTask();

    public Task RegisterRevealAsync(string id, ElementReference element, RevealOptions? options = null)
        => module is null ? Task.CompletedTask : module.InvokeVoidAsync("registerReveal", id, element, options ?? new RevealOptions()).AsTask();

    public Task UnregisterRevealAsync(string id)
        => module is null ? Task.CompletedTask : module.InvokeVoidAsync("unregisterReveal", id).AsTask();

    public Task RegisterPinnedTimelineAsync(ElementReference container, ElementReference track, int cardCount)
        => module is null ? Task.CompletedTask : module.InvokeVoidAsync("registerPinnedTimeline", container, track, cardCount).AsTask();

    public Task UnregisterPinnedTimelineAsync()
        => module is null ? Task.CompletedTask : module.InvokeVoidAsync("unregisterPinnedTimeline").AsTask();

    public Task SetCultureAsync(string cultureName)
        => module is null ? Task.CompletedTask : module.InvokeVoidAsync("setCulture", cultureName).AsTask();

    public Task PulseAsync()
        => module is null ? Task.CompletedTask : module.InvokeVoidAsync("pulse").AsTask();

    public async ValueTask DisposeAsync()
    {
        if (module is not null)
        {
            try { await module.InvokeVoidAsync("dispose"); } catch { /* ignore: page unload */ }
            await module.DisposeAsync();
            module = null;
        }
        initTask = null;
    }
}
