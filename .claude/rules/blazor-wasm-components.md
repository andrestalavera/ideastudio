---
paths:
  - IdeaStudio.Website/Components/**/*
  - IdeaStudio.Website/Pages/**/*
description: Blazor WASM component conventions for IdeaStudio
---

# Component Conventions

- Pages (`@page`) in `Pages/`, reusable components in `Components/`
- Base class: `LocalizedComponent` for i18n. For scroll-triggered reveals, wrap content in `<MotionReveal Kind="…" />`. Per-page WebGL scenes are declared via `<PageScene Name="…" />` and mounted behind content by `<CinemaStage />` in `MainLayout`.
- Code-behind components use `.cs` files (e.g., `SkillBadge.cs`)
- `[Parameter]` for inputs, `@inject` for DI
- No `async void` — always `async Task`
