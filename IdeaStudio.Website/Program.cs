using IdeaStudio.Website;
using IdeaStudio.Website.Services;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

WebAssemblyHostBuilder builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("ideastudio-head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddScoped<ILazyLoadingService, LazyLoadingService>();
builder.Services.AddScoped<IContentGateway, JsonContentGateway>();
builder.Services.AddScoped<ISceneTheme, SceneTheme>();
builder.Services.AddScoped<ISlugService, SlugService>();
builder.Services.AddScoped<ISlugTranslator, SlugTranslator>();

// Analytics + consent
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<IConsentService, ConsentService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

// Add localization services for Blazor WASM
builder.Services.AddScoped<ICultureService, CultureService>();
builder.Services.AddScoped<ILocalizationService, LocalizationService>();
builder.Services.AddScoped<ILocalizedRoute, LocalizedRoute>();

WebAssemblyHost app = builder.Build();

// Set initial culture
ICultureService cultureService = app.Services.GetRequiredService<ICultureService>();
await cultureService.InitializeAsync();

await app.RunAsync();

public partial class Program
{
    protected Program() { }
}
