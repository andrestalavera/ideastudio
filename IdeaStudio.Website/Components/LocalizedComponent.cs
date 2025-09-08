using IdeaStudio.Website.Services;
using Microsoft.AspNetCore.Components;

namespace IdeaStudio.Website.Components;

public abstract class LocalizedComponent : ComponentBase, IDisposable
{
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
		StateHasChanged();
	}

	protected virtual void LoadTexts() { }

	private async void OnCultureChanged()
		=> await LoadLocalizedStringsAsync();

	public virtual void Dispose()
	{
		CultureService.CultureChanged -= OnCultureChanged;
		GC.SuppressFinalize(this);
	}
}
