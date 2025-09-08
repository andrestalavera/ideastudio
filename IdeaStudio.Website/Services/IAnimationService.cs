using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace IdeaStudio.Website.Services;

public interface IAnimationService
{
    Task InitializeAnimationsAsync();
    Task ObserveElementAsync(ElementReference element);
    ValueTask DisposeAsync();
}

public class AnimationService(IJSRuntime jsRuntime) : IAnimationService, IAsyncDisposable
{
    private readonly IJSRuntime jsRuntime = jsRuntime;
    private IJSObjectReference? module;
    private bool initialized = false;

    public async Task InitializeAnimationsAsync()
    {
        if (initialized)
        {
            return;
        }

        module = await jsRuntime.InvokeAsync<IJSObjectReference>("import", "./js/animations.js");

        await module.InvokeVoidAsync("initialize");
        initialized = true;
    }

    public async Task ObserveElementAsync(ElementReference element)
    {
        if (module is null)
        {
            await InitializeAnimationsAsync();
        }

        await module!.InvokeVoidAsync("observeElement", element);
    }

    public async ValueTask DisposeAsync()
    {
        if (module is not null)
        {
            await module.InvokeVoidAsync("dispose");
            await module.DisposeAsync();
        }
    }
}
