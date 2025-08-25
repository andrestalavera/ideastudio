using Microsoft.AspNetCore.Components;
using IdeaStudio.Website.Services;

namespace IdeaStudio.Website.Components
{
    public abstract class AnimatedComponentBase : ComponentBase, IAsyncDisposable
    {
        [Inject] protected IAnimationService AnimationService { get; set; } = default!;

        protected ElementReference ElementRef;
        private bool _observed = false;

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender && !_observed)
            {
                await AnimationService.ObserveElementAsync(ElementRef);
                _observed = true;
            }
        }

        public virtual async ValueTask DisposeAsync()
        {
            // Cleanup if needed
            await Task.CompletedTask;
        }
    }
}
