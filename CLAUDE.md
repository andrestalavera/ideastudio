---
project: IdeaStudio
type: blazor-wasm
framework: .NET 9
description: Portfolio and blog website with Markdown processing
---

# IdeaStudio - Portfolio & Blog

## Overview

Blazor WebAssembly (.NET 9) portfolio and blog website with Markdown processing
via Markdig. Multi-project solution with models library and test project.

## Solution Structure

```
IdeaStudio.sln
├── IdeaStudio.Website/            # Main Blazor WASM application
│   ├── Components/                # Reusable Razor components
│   │   ├── HeroSection.razor
│   │   ├── AboutCard.razor
│   │   ├── Card.razor
│   │   ├── ExperienceCard.razor
│   │   ├── TrainingCard.razor
│   │   ├── ContactSection.razor
│   │   ├── FooterSection.razor
│   │   ├── SeoHead.razor
│   │   ├── CultureSelector.razor
│   │   ├── Loading.razor
│   │   ├── Placeholder.razor
│   │   ├── SocialNetworksComponent.razor
│   │   ├── AnimatedComponentBase.cs  # Base class for animated components
│   │   ├── LocalizedComponent.cs     # Base class for localized components
│   │   └── SkillBadge.cs             # Code-behind component
│   ├── Models/                    # View models (in Website project)
│   │   ├── Resume.cs
│   │   ├── Experience.cs
│   │   ├── PersonalInformation.cs
│   │   ├── AboutSection.cs
│   │   ├── TrainingCenter.cs
│   │   ├── SchemaOrg.cs
│   │   └── Extensions.cs
│   ├── Pages/                     # Routable pages
│   │   ├── Index.razor
│   │   ├── Privacy.razor
│   │   └── Legal.razor
│   ├── Services/                  # Service interfaces
│   │   ├── ICultureService.cs
│   │   ├── ILocalizationService.cs
│   │   ├── ISlugService.cs
│   │   ├── ILazyLoadingService.cs
│   │   └── IAnimationService.cs
│   ├── wwwroot/                   # Static assets
│   │   ├── css/, scss/, js/
│   │   ├── images/, data/, i18n/
│   │   ├── llms.txt, ai.txt
│   │   └── sitemap.xml, robots.txt
│   ├── App.razor
│   ├── MainLayout.razor
│   └── Program.cs
├── IdeaStudio.Website.Models/     # Shared models library (currently minimal)
├── IdeaStudio.Website.Tests/      # Unit and integration tests
│   ├── IntegrationTests.cs
│   └── GlobalUsings.cs
└── IdeaStudio.Apis/               # API project (placeholder)
```

## Build & Test Commands

```bash
# Build entire solution
dotnet build IdeaStudio.sln

# Build website only
dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj

# Run tests
dotnet test IdeaStudio.sln

# Run the website
dotnet run --project IdeaStudio.Website/IdeaStudio.Website.csproj
```

## Component Conventions

- Pages use `@page` directive and live in `Pages/`
- Reusable components live in `Components/`
- Base classes: `AnimatedComponentBase` for animations, `LocalizedComponent` for i18n
- Code-behind components use `.cs` files (e.g., `SkillBadge.cs`)
- Use `[Parameter]` attribute for component parameters
- Use `@inject` for dependency injection

## Service Pattern

- Services are defined as interfaces in `Services/`
- Implementations are registered in `Program.cs`
- Covers: culture, localization, slug generation, lazy loading, animation

## Test Conventions

- Tests live in `IdeaStudio.Website.Tests/`
- `IntegrationTests.cs` for integration-level tests
- Use xUnit or MSTest (check `.csproj` for framework)

## Multilingual Support

- i18n files in `wwwroot/i18n/`
- `CultureSelector` component for language switching
- `LocalizedComponent` base class for components needing localization
