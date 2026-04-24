using Microsoft.JSInterop;

namespace IdeaStudio.Website.Services;

public sealed class SceneTheme : ISceneTheme, IAsyncDisposable
{
    private readonly IJSRuntime js;
    private IJSObjectReference? module;
    private Task<IJSObjectReference>? moduleTask;

    public SceneTheme(IJSRuntime js) => this.js = js;

    private Task<IJSObjectReference> EnsureModuleAsync()
        => moduleTask ??= LoadAsync();

    private async Task<IJSObjectReference> LoadAsync()
    {
        module = await js.InvokeAsync<IJSObjectReference>("import", "./js/cinema.bundle.js");
        return module;
    }

    public async Task InitializeAsync()
    {
        IJSObjectReference mod = await EnsureModuleAsync();
        await mod.InvokeVoidAsync("initialize");
    }

    public async Task ApplyAsync(string scene, IReadOnlyDictionary<string, object?>? parameters = null)
    {
        IJSObjectReference mod = await EnsureModuleAsync();
        await mod.InvokeVoidAsync("applyTheme", scene, parameters);
    }

    public async Task PulseAsync()
    {
        IJSObjectReference mod = await EnsureModuleAsync();
        await mod.InvokeVoidAsync("pulse");
    }

    public async ValueTask DisposeAsync()
    {
        if (module is not null)
        {
            try { await module.InvokeVoidAsync("dispose"); }
            catch { /* page unloading */ }
            try { await module.DisposeAsync(); }
            catch { /* already gone */ }
            module = null;
        }
        moduleTask = null;
    }
}
