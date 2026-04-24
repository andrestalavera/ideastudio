// IdeaStudio.Apis — minimal-API host for future non-content endpoints
// (contact form, analytics relay, LLM grounding, etc.). No endpoint logic yet;
// Clean Architecture layering (Domain / Application / Infrastructure / Api)
// is scaffolded as folders with READMEs for future work.

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("https://ideastud.io", "http://localhost:5000", "http://localhost:5001")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

WebApplication app = builder.Build();

app.UseCors();

app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "IdeaStudio.Apis" }));

app.Run();
