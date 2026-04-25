---
name: blazor-wasm-ui
description: Blazor WASM UI patterns for IdeaStudio portfolio
---

# Blazor WASM UI Patterns

## New Page
1. Add `.razor` in `Pages/` with `@page`
2. Extend `LocalizedComponent` if multilingual
3. Declare the page's WebGL scene with `<PageScene Name="…" />` at the top of the markup
4. Use existing section components (HeroSection, ContactSection, etc.)

## New Component
1. Add `.razor` in `Components/`
2. Extend `LocalizedComponent` if localized
3. For scroll-triggered reveals, wrap the outermost markup with `<MotionReveal Kind="fade-up" />` (skip for above-the-fold content like hero sections — they are LCP targets)
4. Use `[Parameter]` for inputs

## Key Primitives

- `LocalizedComponent` — culture/localization support
- `<MotionReveal Kind="…" />` — scroll-triggered reveal via `ICinemaEngine`
- `<PageScene Name="…" />` — switches the global WebGL scene for a page
- `<CinemaStage />` — single canvas mounted in `MainLayout`; owns the WebGL context
