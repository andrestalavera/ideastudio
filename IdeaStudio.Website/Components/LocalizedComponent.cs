using IdeaStudio.Website.Services;
using Microsoft.AspNetCore.Components;

namespace IdeaStudio.Website.Components;

public abstract class LocalizedComponent : ComponentBase, IDisposable
{
    private bool disposed = false;
    [Inject] protected ICultureService CultureService { get; set; } = default!;
    [Inject] protected ILocalizationService LocalizationService { get; set; } = default!;

    protected override async Task OnInitializedAsync()
    {
        CultureService.CultureChanged += OnCultureChanged;
        await LoadLocalizedStringsAsync();
    }

    protected virtual async Task LoadLocalizedStringsAsync()
    {
        await LocalizationService.LoadCultureAsync(CultureService.CurrentCulture.Name);
        LoadTexts();
        await InvokeAsync(StateHasChanged);
    }

    protected virtual void LoadTexts() { }

    // CultureChanged is raised synchronously by CultureService. Keep a synchronous
    // handler (no async void) and marshal the reload onto the renderer's sync context;
    // failures are routed to the renderer via DispatchExceptionAsync instead of being
    // lost on the discarded task.
    private void OnCultureChanged()
        => _ = InvokeAsync(async () =>
        {
            try
            {
                await LoadLocalizedStringsAsync();
            }
            catch (Exception ex)
            {
                await DispatchExceptionAsync(ex);
            }
        });

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!disposed)
        {
            if (disposing)
            {
                // Dispose managed resources here.
                CultureService.CultureChanged -= OnCultureChanged;
            }
            // Dispose unmanaged resources here, if any.

            // Mark as disposed.
            disposed = true;
        }
    }
}
