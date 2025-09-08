using Microsoft.AspNetCore.Components;
using IdeaStudio.Website.Services;

namespace IdeaStudio.Website.Components
{
    public abstract class AnimatedComponentBase : LocalizedComponent, IAsyncDisposable
    {
        [Inject] protected IAnimationService AnimationService { get; set; } = default!;

        protected ElementReference ElementRef;
        private bool observed = false;

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender && !observed)
            {
                await AnimationService.ObserveElementAsync(ElementRef);
                observed = true;
            }
        }

        public virtual async ValueTask DisposeAsync()
        {
            // Cleanup if needed
            await Task.CompletedTask;
        }
    }
}
