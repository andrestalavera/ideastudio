using IdeaStudio.Website;
using IdeaStudio.Website.Services;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

WebAssemblyHostBuilder builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
// Mount the head outlet into the document <head> so SeoHead's PageTitle/HeadContent
// (title, description, canonical, hreflang, Open Graph, JSON-LD) actually render.
// Previously pointed at a non-existent "ideastudio-head" element — SEO never injected.
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddScoped<ILazyLoadingService, LazyLoadingService>();
builder.Services.AddScoped<IContentGateway, JsonContentGateway>();
builder.Services.AddScoped<ISceneTheme, SceneTheme>();
builder.Services.AddScoped<IThemeService, ThemeService>();
builder.Services.AddScoped<IContactService, NetlifyEmailContactService>();
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
