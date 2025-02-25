# IdeaStudio website

Code for [ideastud.io](https://ideastud.io) website.

## Releases notes

### v2

- ~~Upgrade to .NET 9~~ (Not yet supported by Azure Static Web Apps, downgrade to .NET 8)
- Use a custom bootstrap instead of Fluent UI components (they are slow in v4, waiting for v5)
  - Generated locally or from GitHub Action
- Fix 'get training centers'

### Next steps

- Create 'GitHub Issue's instead.
- All bootstrap variables are not overwritten to match with Fluent UI 2 Design
- Create apis to retrieve content (and use full SWA features)
- Add a contact form (and use full SWA features)
- Localization (add french)
- Export an anonymous PDF for recruiters

### v1

Upgrade to .NET 8 and now based on [Microsoft Fluent 2 Design System](https://fluent2.microsoft.design/), and use [FluentUI Blazor](https://github.com/microsoft/fluentui-blazor).

#### Known issues

- GetTrainingCenters api doesn't work

### v0

First version based on [Bootstrap 5.3](https://getbootstrap.com/docs/5.3/) and [ASP.NET Blazor .NET 7](https://learn.microsoft.com/aspnet/core).

### Next steps

- Contact form through an Azure Function
- Data from api instead of static JSON files

## Informations

- `main` branch is the production branch and it's the only constant branch
- A GitHub Action triggered when a pull request tries to merge into the `main` action
- Deployment target kind: Azure Static Web App
- Copitlot and SoundCloud are configured

## Contribute

- Use `feature/describe-your-feature-in-6-words`
- Use latest C# 12 features
- Use latest .NET features and types (code generators, `Span<T>`, ...)
- Optimize your code

### FAQ

#### Why Blazor?

- Full-Stack Development with C#
- Reusability (some code should be reused in further projects)
- WebAssembly providing near-native performance

#### Why monobranch?

Simplicity first. Deployment should run some integration and unit tests to ensure non-regression.
