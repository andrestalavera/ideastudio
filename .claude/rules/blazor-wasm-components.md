---
paths:
  - IdeaStudio.Website/Components/**/*
  - IdeaStudio.Website/Pages/**/*
description: Blazor WASM component conventions for IdeaStudio
---

# Component Conventions

- Pages (`@page`) in `Pages/`, reusable components in `Components/`
- Base classes: `AnimatedComponentBase` for animations, `LocalizedComponent` for i18n
- Code-behind components use `.cs` files (e.g., `SkillBadge.cs`)
- `[Parameter]` for inputs, `@inject` for DI
- No `async void` — always `async Task`
