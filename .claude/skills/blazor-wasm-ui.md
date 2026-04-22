---
name: blazor-wasm-ui
description: Blazor WASM UI patterns for IdeaStudio portfolio
---

# Blazor WASM UI Patterns

## New Page
1. Add `.razor` in `Pages/` with `@page`
2. Extend `LocalizedComponent` if multilingual
3. Use existing section components (HeroSection, ContactSection, etc.)

## New Component
1. Add `.razor` in `Components/`
2. Extend `AnimatedComponentBase` if animated, `LocalizedComponent` if localized
3. Use `[Parameter]` for inputs

## Base Classes
- `AnimatedComponentBase` — animation lifecycle hooks
- `LocalizedComponent` — culture/localization support
