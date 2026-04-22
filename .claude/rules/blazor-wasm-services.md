---
paths:
  - IdeaStudio.Website/Services/**/*
description: Service pattern conventions for IdeaStudio
---

# Service Conventions

- Interfaces in `Services/`: ICultureService, ILocalizationService, ISlugService, ILazyLoadingService, IAnimationService
- Register implementations in `Program.cs` via DI
- Use `@inject` in components
