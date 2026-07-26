---
paths:
  - IdeaStudio.Website/Components/**/*
  - IdeaStudio.Website/Pages/**/*
description: Blazor WASM component conventions for IdeaStudio
---

# Component Conventions

- Pages (`@page`) in `Pages/`, reusable components in `Components/`
- Base class: `LocalizedComponent` for i18n. For scroll-triggered reveals, wrap content in `<Reveal>` (block-level fade/slide) or `<RevealChars Text="…" />` (per-character), or add the `data-reveal` attribute directly. The cinema runtime is mounted once via `<GlCanvas />` in `MainLayout`; pages apply a scene by setting `data-scene` through `ISceneTheme.ApplyAsync(...)` — they do not declare per-page scene components.
- Code-behind components use `.cs` files (e.g., `SkillBadge.cs`)
- `[Parameter]` for inputs, `@inject` for DI
- No `async void` — always `async Task`
