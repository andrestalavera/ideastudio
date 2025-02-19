# IdeaStudio website

Code for [ideastud.io](https://ideastud.io) website.

## Releases notes

### v1.1

- Upgrade to .NET 8.0.8
- Add contact form (Azure Function v4 isolated, using Graph API)
- Fix GetTrainingCenters api

### v1

Upgrade to .NET 8 and now based on [Microsoft Fluent 2 Design System](https://fluent2.microsoft.design/), and use [FluentUI Blazor](https://github.com/microsoft/fluentui-blazor).

#### Known issues

- GetTrainingCenters api doesn't work

### v0

First version based on [Bootstrap 5.3](https://getbootstrap.com/docs/5.3/) and [ASP.NET Blazor .NET 7](https://learn.microsoft.com/aspnet/core).

### Next steps

- Contact form through an Azure Function
- Data from api instead of static JSON files

## Other

### FAQ

#### Why Blazor?

- Full-Stack Development with C#
- Reusability (some code should be reused in further projects)
- Open Source
- WebAssembly providing near-native performance

#### Why monobranch?

Simplicity first. Deployment should run some integration and unit tests to ensure non-regression.