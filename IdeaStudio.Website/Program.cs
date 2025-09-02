using IdeaStudio.Website;
using IdeaStudio.Website.Services;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

WebAssemblyHostBuilder builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddScoped<ILazyLoadingService, LazyLoadingService>();
builder.Services.AddScoped<IAnimationService, AnimationService>();
builder.Services.AddScoped<ISeoService, SeoService>();

WebAssemblyHost app = builder.Build();

await app.RunAsync();

public partial class Program
{
    protected Program() { }
}
