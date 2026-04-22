# Design System Migration — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Bootstrap with a custom SCSS design system (dark cinema-atmospheric tokens, Inter + JetBrains Mono fonts). After this plan, the site renders with the new design system tokens, all components use the new class vocabulary, and Bootstrap is fully removed.

**Architecture:** Build the design system *alongside* Bootstrap in the existing Sass pipeline (no new tooling). New patterns use namespaced class names (e.g., `.ds-card`, `.ds-btn`) so old and new can coexist during migration. Components are re-skinned one at a time; Bootstrap is removed only after zero usages remain.

**Tech Stack:**
- SCSS (existing `sass` npm package, existing MSBuild `NpmRunBuild` target)
- Inter Variable + JetBrains Mono (self-hosted via `@fontsource-variable/inter` + `@fontsource/jetbrains-mono`)
- Node ≥ 20 (for `copy-fonts.mjs`)
- Blazor WebAssembly .NET 10 (no .NET code changes other than Razor markup)

---

## File Structure

### Created

```
IdeaStudio.Website/
  scripts/
    copy-fonts.mjs                         # copies self-hosted fonts into wwwroot/fonts/
  wwwroot/
    fonts/
      inter-variable.woff2                 # copied by build
      jetbrains-mono.woff2                 # copied by build
    scss/
      tokens/
        _colors.scss                       # palette + ink scale
        _typography.scss                   # font families + scale
        _space.scss                        # 4pt scale, radii, shadows
        _motion.scss                       # easings + durations
      base/
        _reset.scss                        # minimal reset
        _root.scss                         # :root CSS custom properties
        _typography.scss                   # display/body/mono styles + @font-face
      patterns/
        _button.scss                       # .ds-btn variants
        _card.scss                         # .ds-card variants (glass)
        _chapter.scss                      # .ds-chapter kicker + title + rule
        _navbar.scss                       # .ds-nav
        _footer.scss                       # .ds-footer
      utilities/
        _stack.scss                        # .ds-stack, gap utilities
        _visually-hidden.scss              # .ds-sr-only, .ds-skip-link
        _responsive.scss                   # breakpoint mixins
        _print.scss                        # .ds-print-hidden, .ds-print-only
```

### Modified

```
IdeaStudio.Website/
  package.json                             # add fontsource deps, copy-fonts script, remove bootstrap at end
  IdeaStudio.Website.csproj                # wire copy-fonts into NpmRunBuild
  wwwroot/scss/styles.scss                 # rewritten to import new layers
  Components/
    Card.razor                             # new classes
    AboutCard.razor                        # new classes
    TrainingCard.razor                     # new classes
    ExperienceCard.razor                   # new classes
    HeroSection.razor                      # new classes
    ContactSection.razor                   # new classes
    SocialNetworksComponent.razor          # new classes
    CultureSelector.razor                  # new classes
    FooterSection.razor                    # new classes
    CultureSelector.razor                  # new classes
    Heading.razor, Loading.razor, Placeholder.razor  # new classes
  MainLayout.razor                         # navbar, skip-link
  Pages/
    Index.razor                            # navbar content, section wrappers
    Privacy.razor                          # new classes
    Legal.razor                            # new classes
```

### Removed

- `bootstrap` from `package.json`
- All Bootstrap `@import` statements in `styles.scss`
- All Bootstrap utility classes in Razor files (`row`, `col-*`, `btn-*`, `d-flex`, `navbar*`, `card*`, etc.)

---

## Task 1: Install fonts and copy script

**Files:**
- Create: `IdeaStudio.Website/scripts/copy-fonts.mjs`
- Modify: `IdeaStudio.Website/package.json`
- Modify: `IdeaStudio.Website/IdeaStudio.Website.csproj` (NpmRunBuild target)

- [ ] **Step 1: Install font packages**

```bash
cd IdeaStudio.Website
npm install --save-exact @fontsource-variable/inter@5.2.5 @fontsource/jetbrains-mono@5.2.5
```

- [ ] **Step 2: Create the copy-fonts script**

Create `IdeaStudio.Website/scripts/copy-fonts.mjs`:

```js
import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const FONTS_OUT = 'wwwroot/fonts';

// @fontsource-variable/inter ships one latin wght-normal variable file;
// find it dynamically because the filename encodes a version hash.
async function findFile(dir, predicate) {
  const entries = await readdir(dir);
  const match = entries.find(predicate);
  if (!match) throw new Error(`No matching font file in ${dir}`);
  return join(dir, match);
}

const interDir = 'node_modules/@fontsource-variable/inter/files';
const monoDir  = 'node_modules/@fontsource/jetbrains-mono/files';

const interSrc = await findFile(interDir, f => f.includes('latin-wght-normal.woff2'));
const monoSrc  = await findFile(monoDir,  f => f.includes('latin-400-normal.woff2'));

const targets = [
  [interSrc, join(FONTS_OUT, 'inter-variable.woff2')],
  [monoSrc,  join(FONTS_OUT, 'jetbrains-mono.woff2')],
];

for (const [src, dst] of targets) {
  await mkdir(dirname(dst), { recursive: true });
  await copyFile(src, dst);
  console.log(`✓ ${src} → ${dst}`);
}
```

- [ ] **Step 3: Add npm script and update build**

Edit `IdeaStudio.Website/package.json`. Replace the `scripts` block with:

```json
"scripts": {
  "copy-fonts":            "node scripts/copy-fonts.mjs",
  "compile-styles":        "sass wwwroot/scss/styles.scss:wwwroot/css/styles.min.css --style=compressed --update --color",
  "watch-compile-styles":  "sass wwwroot/scss/styles.scss:wwwroot/css/styles.min.css --style=compressed --update --watch --poll --color",
  "build":                 "npm run copy-fonts && npm run compile-styles"
},
```

- [ ] **Step 4: Wire the new build target into MSBuild**

Edit `IdeaStudio.Website/IdeaStudio.Website.csproj`, replace the `NpmRunBuild` target block with:

```xml
<Target Name="NpmRunBuild" DependsOnTargets="NpmInstall" BeforeTargets="BeforeBuild">
    <Exec Command="npm run build" />
</Target>
```

- [ ] **Step 5: Run once and verify fonts exist**

```bash
cd IdeaStudio.Website
npm run copy-fonts
ls wwwroot/fonts/
```

Expected output:

```
✓ node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2 → wwwroot/fonts/inter-variable.woff2
✓ node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2 → wwwroot/fonts/jetbrains-mono.woff2
inter-variable.woff2
jetbrains-mono.woff2
```

- [ ] **Step 6: Ignore generated fonts**

Add to `.gitignore` at repo root (after existing content):

```
IdeaStudio.Website/wwwroot/fonts/
```

- [ ] **Step 7: Commit**

```bash
git add IdeaStudio.Website/package.json IdeaStudio.Website/package-lock.json IdeaStudio.Website/scripts/copy-fonts.mjs IdeaStudio.Website/IdeaStudio.Website.csproj .gitignore
git commit -m "Add self-hosted Inter and JetBrains Mono fonts via fontsource

Installs @fontsource-variable/inter and @fontsource/jetbrains-mono, copies
latin subsets to wwwroot/fonts/ at build time via scripts/copy-fonts.mjs.
Wires into existing NpmRunBuild MSBuild target.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Create design tokens

**Files:**
- Create: `IdeaStudio.Website/wwwroot/scss/tokens/_colors.scss`
- Create: `IdeaStudio.Website/wwwroot/scss/tokens/_typography.scss`
- Create: `IdeaStudio.Website/wwwroot/scss/tokens/_space.scss`
- Create: `IdeaStudio.Website/wwwroot/scss/tokens/_motion.scss`

- [ ] **Step 1: Create `tokens/_colors.scss`**

```scss
// Palette — direction B (cinéma atmosphérique) with blue/green accents.
// All values mirror what cinema.js will read from :root at runtime (Phase 2).

$ink-0:    #020617;   // deepest background
$ink-100:  #0f172a;
$ink-200:  #1e293b;
$ink-300:  #334155;
$ink-400:  #475569;
$ink-500:  #64748b;
$ink-600:  #94a3b8;
$ink-700:  #cbd5e1;
$ink-800:  #e2e8f0;
$ink-900:  #f1f5f9;   // foreground text

$deep:     #0c4a6e;   // navy anchor
$azure:    #0ea5e9;   // primary accent
$sky:      #7dd3fc;   // supporting
$cyan:     #67e8f9;
$teal:     #5eead4;   // signature accent
$mint:     #34d399;   // success / positive

$surface-glass-bg:     rgba(15, 23, 42, 0.55);
$surface-glass-border: rgba(125, 211, 252, 0.15);
$surface-glass-bg-hover:     rgba(15, 23, 42, 0.72);
$surface-glass-border-hover: rgba(125, 211, 252, 0.30);

$focus-ring: $teal;
```

- [ ] **Step 2: Create `tokens/_typography.scss`**

```scss
// Typography scale — Inter Variable + JetBrains Mono.
// Self-hosted; @font-face declarations live in base/_typography.scss.

$font-sans: "Inter Variable", -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, sans-serif;
$font-mono: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;

$fw-light:    300;
$fw-regular:  400;
$fw-medium:   500;
$fw-semibold: 600;
$fw-bold:     700;

// Type scale (clamp for fluid sizing).
$fs-display-1: clamp(3rem, 4vw + 1rem, 5.5rem);   // hero name
$fs-display-2: clamp(2.25rem, 3vw + 1rem, 3.5rem);// act titles
$fs-h1:        clamp(2rem, 2vw + 1rem, 2.75rem);
$fs-h2:        clamp(1.5rem, 1.2vw + 1rem, 2rem);
$fs-h3:        1.25rem;
$fs-body:      1rem;
$fs-small:     0.875rem;
$fs-kicker:    0.75rem;   // mono, uppercase, tracked

$lh-tight:  1.05;
$lh-snug:   1.25;
$lh-normal: 1.6;
$lh-loose:  1.8;

$tracking-tight: -0.03em;
$tracking-snug:  -0.01em;
$tracking-wide:   0.08em;
$tracking-kicker: 0.25em;
```

- [ ] **Step 3: Create `tokens/_space.scss`**

```scss
// 4pt spacing scale + radii + elevations.

$s-0:  0;
$s-1:  0.25rem;   // 4px
$s-2:  0.5rem;    // 8px
$s-3:  0.75rem;   // 12px
$s-4:  1rem;      // 16px
$s-5:  1.5rem;    // 24px
$s-6:  2rem;      // 32px
$s-7:  3rem;      // 48px
$s-8:  4rem;      // 64px
$s-9:  6rem;      // 96px
$s-10: 8rem;      // 128px

$r-sm:   6px;
$r-md:   10px;
$r-lg:   14px;
$r-xl:   20px;
$r-2xl:  28px;
$r-pill: 999px;

$shadow-1: 0 2px 8px rgba(2, 6, 23, 0.35);
$shadow-2: 0 10px 40px rgba(2, 6, 23, 0.5);
$shadow-3: 0 20px 60px rgba(14, 165, 233, 0.2);
$shadow-inset-hl: inset 0 1px 0 rgba(255, 255, 255, 0.05);

// Breakpoints
$bp-sm: 480px;
$bp-md: 768px;
$bp-lg: 1024px;
$bp-xl: 1280px;
$bp-2xl: 1536px;

// Container
$container-max: 1280px;
$container-pad: $s-5;
```

- [ ] **Step 4: Create `tokens/_motion.scss`**

```scss
// Motion primitives — exposed as CSS vars so cinema.js (Phase 2) reads the same values.

$ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
$ease-inout:  cubic-bezier(0.65, 0, 0.35, 1);
$ease-spring: cubic-bezier(0.4, 0, 0.2, 1.5);

$dur-fast:   140ms;
$dur-base:   280ms;
$dur-slow:   520ms;
$dur-xslow:  840ms;
```

- [ ] **Step 5: Verify compile**

```bash
cd IdeaStudio.Website
npm run compile-styles
```

Expected: no errors. (The tokens are partials — prefixed `_` — they aren't compiled alone, but sass validates the whole tree.)

- [ ] **Step 6: Commit**

```bash
git add IdeaStudio.Website/wwwroot/scss/tokens/
git commit -m "Add design tokens (colors, typography, space, motion)

Blue/cyan/teal palette for cinema-atmospheric direction. Inter Variable +
JetBrains Mono font stacks. 4pt space scale. Motion easings aligned with
the future cinema engine.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Create base layer

**Files:**
- Create: `IdeaStudio.Website/wwwroot/scss/base/_reset.scss`
- Create: `IdeaStudio.Website/wwwroot/scss/base/_root.scss`
- Create: `IdeaStudio.Website/wwwroot/scss/base/_typography.scss`

- [ ] **Step 1: Create `base/_reset.scss`**

```scss
// Minimal reset. We don't use modern-normalize — Bootstrap's reboot is still
// loaded temporarily during migration. Once Bootstrap is removed, this reset
// covers what we need.

*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }

body {
  margin: 0;
  min-height: 100vh;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--ds-bg);
  color: var(--ds-fg);
}

img, picture, video, canvas, svg { display: block; max-width: 100%; }

button, input, textarea, select { font: inherit; color: inherit; }

a { color: inherit; text-decoration: none; }

ul, ol { list-style: none; padding: 0; margin: 0; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Create `base/_root.scss`**

```scss
@use '../tokens/colors' as c;
@use '../tokens/typography' as t;
@use '../tokens/space' as s;
@use '../tokens/motion' as m;

:root {
  // Surfaces
  --ds-bg:        #{c.$ink-0};
  --ds-surface-1: #{c.$ink-100};
  --ds-surface-2: #{c.$ink-200};
  --ds-surface-3: #{c.$ink-300};

  // Text
  --ds-fg:        #{c.$ink-900};
  --ds-fg-muted:  #{c.$ink-700};
  --ds-fg-faint:  #{c.$ink-500};

  // Accents
  --ds-deep:  #{c.$deep};
  --ds-azure: #{c.$azure};
  --ds-sky:   #{c.$sky};
  --ds-cyan:  #{c.$cyan};
  --ds-teal:  #{c.$teal};
  --ds-mint:  #{c.$mint};

  // Glass surface
  --ds-glass-bg:     #{c.$surface-glass-bg};
  --ds-glass-border: #{c.$surface-glass-border};

  // Typography
  --ds-font-sans: #{t.$font-sans};
  --ds-font-mono: #{t.$font-mono};

  // Motion
  --ds-ease-out:    #{m.$ease-out};
  --ds-ease-inout:  #{m.$ease-inout};
  --ds-ease-spring: #{m.$ease-spring};
  --ds-dur-fast: #{m.$dur-fast};
  --ds-dur-base: #{m.$dur-base};
  --ds-dur-slow: #{m.$dur-slow};

  // Focus
  --ds-focus-ring: #{c.$focus-ring};
}
```

- [ ] **Step 3: Create `base/_typography.scss`**

```scss
@use '../tokens/typography' as t;
@use '../tokens/space' as s;

// Self-hosted fonts (files copied by scripts/copy-fonts.mjs).
@font-face {
  font-family: "Inter Variable";
  src: url("/fonts/inter-variable.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/jetbrains-mono.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

html, body {
  font-family: var(--ds-font-sans);
  font-size: t.$fs-body;
  line-height: t.$lh-normal;
  font-weight: t.$fw-regular;
}

// Utility text classes (prefixed .ds- to avoid collision with Bootstrap).
.ds-display-1 {
  font-size: t.$fs-display-1;
  font-weight: t.$fw-light;
  line-height: t.$lh-tight;
  letter-spacing: t.$tracking-tight;
}

.ds-display-2 {
  font-size: t.$fs-display-2;
  font-weight: t.$fw-light;
  line-height: t.$lh-tight;
  letter-spacing: t.$tracking-tight;
}

.ds-h1 { font-size: t.$fs-h1; font-weight: t.$fw-medium; line-height: t.$lh-snug; letter-spacing: t.$tracking-snug; }
.ds-h2 { font-size: t.$fs-h2; font-weight: t.$fw-medium; line-height: t.$lh-snug; letter-spacing: t.$tracking-snug; }
.ds-h3 { font-size: t.$fs-h3; font-weight: t.$fw-semibold; line-height: t.$lh-snug; }

.ds-body      { font-size: t.$fs-body;  line-height: t.$lh-normal; }
.ds-body-lead { font-size: 1.125rem; line-height: t.$lh-normal; color: var(--ds-fg-muted); }
.ds-small     { font-size: t.$fs-small; line-height: t.$lh-snug; color: var(--ds-fg-muted); }

.ds-mono      { font-family: var(--ds-font-mono); }

.ds-kicker {
  font-family: var(--ds-font-mono);
  font-size: t.$fs-kicker;
  text-transform: uppercase;
  letter-spacing: t.$tracking-kicker;
  color: var(--ds-teal);
}

.ds-emphasis-gradient {
  background: linear-gradient(90deg, var(--ds-sky), var(--ds-teal));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

- [ ] **Step 4: Verify compile**

```bash
cd IdeaStudio.Website
npm run compile-styles
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add IdeaStudio.Website/wwwroot/scss/base/
git commit -m "Add SCSS base layer (reset, root variables, typography)

:root exposes all tokens as CSS custom properties so JS can read the same
palette at runtime. @font-face declarations for Inter Variable and
JetBrains Mono point at /fonts/*.woff2 copied by scripts/copy-fonts.mjs.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Create utilities

**Files:**
- Create: `IdeaStudio.Website/wwwroot/scss/utilities/_stack.scss`
- Create: `IdeaStudio.Website/wwwroot/scss/utilities/_visually-hidden.scss`
- Create: `IdeaStudio.Website/wwwroot/scss/utilities/_responsive.scss`
- Create: `IdeaStudio.Website/wwwroot/scss/utilities/_print.scss`

- [ ] **Step 1: Create `utilities/_responsive.scss`**

```scss
@use '../tokens/space' as s;

@mixin sm   { @media (min-width: s.$bp-sm)   { @content; } }
@mixin md   { @media (min-width: s.$bp-md)   { @content; } }
@mixin lg   { @media (min-width: s.$bp-lg)   { @content; } }
@mixin xl   { @media (min-width: s.$bp-xl)   { @content; } }
@mixin xxl  { @media (min-width: s.$bp-2xl)  { @content; } }

@mixin touch    { @media (hover: none) and (pointer: coarse) { @content; } }
@mixin motion   { @media (prefers-reduced-motion: no-preference) { @content; } }
@mixin no-motion{ @media (prefers-reduced-motion: reduce) { @content; } }
```

- [ ] **Step 2: Create `utilities/_stack.scss`**

```scss
@use '../tokens/space' as s;

// Container — drop-in replacement for Bootstrap's .container.
.ds-container {
  width: 100%;
  max-width: s.$container-max;
  margin-inline: auto;
  padding-inline: s.$container-pad;
}

// Vertical stack with gap (replaces Bootstrap .vstack).
.ds-stack {
  display: flex;
  flex-direction: column;
  gap: var(--ds-stack-gap, #{s.$s-4});
}

.ds-stack--tight  { --ds-stack-gap: #{s.$s-2}; }
.ds-stack--loose  { --ds-stack-gap: #{s.$s-6}; }

// Horizontal cluster with wrap (replaces Bootstrap .d-flex .flex-wrap).
.ds-cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-cluster-gap, #{s.$s-3});
  align-items: center;
}
.ds-cluster--tight { --ds-cluster-gap: #{s.$s-2}; }

// Responsive grid helper. Usage: <div class="ds-grid ds-grid--3">
.ds-grid {
  display: grid;
  gap: var(--ds-grid-gap, #{s.$s-5});
}
.ds-grid--2 { grid-template-columns: repeat(1, 1fr); @media (min-width: s.$bp-md) { grid-template-columns: repeat(2, 1fr); } }
.ds-grid--3 { grid-template-columns: repeat(1, 1fr); @media (min-width: s.$bp-md) { grid-template-columns: repeat(2, 1fr); } @media (min-width: s.$bp-xl) { grid-template-columns: repeat(3, 1fr); } }
.ds-grid--4 { grid-template-columns: repeat(1, 1fr); @media (min-width: s.$bp-md) { grid-template-columns: repeat(2, 1fr); } @media (min-width: s.$bp-lg) { grid-template-columns: repeat(4, 1fr); } }

// Section.
.ds-section {
  padding-block: s.$s-9;
}
```

- [ ] **Step 3: Create `utilities/_visually-hidden.scss`**

```scss
@use '../tokens/space' as s;

.ds-sr-only {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.ds-skip-link {
  position: absolute;
  top: -100px;
  left: s.$s-3;
  z-index: 9999;
  padding: s.$s-3 s.$s-5;
  background: var(--ds-azure);
  color: var(--ds-bg);
  border-radius: s.$r-md;
  font-weight: 600;
  transition: top var(--ds-dur-base) var(--ds-ease-out);

  &:focus { top: s.$s-3; outline: 2px solid var(--ds-focus-ring); outline-offset: 2px; }
}
```

- [ ] **Step 4: Create `utilities/_print.scss`**

```scss
// Minimal replacements for Bootstrap's d-print-* utilities.
// CV print view must remain functional after Bootstrap is removed.

.ds-print-hidden { @media print { display: none !important; } }
.ds-print-only   { display: none !important; @media print { display: initial !important; } }
.ds-pagebreak    { page-break-after: always; }

@media print {
  body { background: #fff !important; color: #000 !important; }
}
```

- [ ] **Step 5: Verify compile**

```bash
cd IdeaStudio.Website
npm run compile-styles
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add IdeaStudio.Website/wwwroot/scss/utilities/
git commit -m "Add SCSS utilities (stack, grid, visually-hidden, print, responsive)

Drop-in replacements for the Bootstrap utilities we use: container, vstack,
responsive grid, d-print-*, sr-only, skip-link. All prefixed ds- so they
coexist with Bootstrap during migration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Restructure styles.scss entry

**Files:**
- Modify: `IdeaStudio.Website/wwwroot/scss/styles.scss`

- [ ] **Step 1: Rewrite `styles.scss`**

Overwrite `IdeaStudio.Website/wwwroot/scss/styles.scss` with:

```scss
// ============================================================
// IdeaStud.io — styles entry
// Dark cinema-atmospheric design system layered over Bootstrap.
// Bootstrap is removed at the end of Phase 1 (see plan Task 19).
// ============================================================

// --- Bootstrap (temporary, removed at end of Phase 1) ---
@import "../../node_modules/bootstrap/scss/functions";

$spacer: 24px;
$border-radius: 12px;
$border-radius-sm: 8px;
$border-radius-lg: 16px;
$border-radius-xl: 24px;
$border-radius-xxl: 32px;
$border-radius-pill: 50rem;

$primary: rgb(0, 76, 141);
$secondary: rgb(132, 44, 247);
$success: rgb(0, 164, 98);
$info: rgb(0, 113, 168);
$warning: rgb(247, 131, 44);
$danger: rgb(247, 44, 44);
$light: rgb(170, 215, 255);
$dark: rgb(18, 38, 55);

$font-family-sans-serif: "Segoe UI Variable", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
$line-height-base: 1.6;
$enable-gradients: false;
$enable-negative-margins: false;
$enable-rounded: true;
$enable-smooth-scroll: true;

@import "../../node_modules/bootstrap/scss/variables";
@import "../../node_modules/bootstrap/scss/variables-dark";
@import "../../node_modules/bootstrap/scss/maps";
@import "../../node_modules/bootstrap/scss/mixins";
@import "../../node_modules/bootstrap/scss/utilities";
@import "../../node_modules/bootstrap/scss/root";
@import "../../node_modules/bootstrap/scss/reboot";
@import "../../node_modules/bootstrap/scss/type";
@import "../../node_modules/bootstrap/scss/images";
@import "../../node_modules/bootstrap/scss/containers";
@import "../../node_modules/bootstrap/scss/grid";
@import "../../node_modules/bootstrap/scss/forms";
@import "../../node_modules/bootstrap/scss/buttons";
@import "../../node_modules/bootstrap/scss/dropdown";

// --- Design system (new) ---
@import 'base/reset';
@import 'base/root';
@import 'base/typography';

@import 'utilities/responsive';
@import 'utilities/stack';
@import 'utilities/visually-hidden';
@import 'utilities/print';
```

**Important:** dart-sass (1.92+) requires `@use` rules to appear before any other rule — including `@import`. Because we must let Bootstrap emit its reboot/utilities *before* our design-system reset/root/typography (so our rules win on the cascade), the ds partials have to be referenced *after* the Bootstrap `@import` block. That means they must also be pulled in via `@import` — a top-level `@use` after the Bootstrap block is a compile error. The ds partials themselves still `@use '../tokens/...'` internally for token consumption, which is fine. In Task 19 (Bootstrap removal), the Bootstrap `@import` block goes away and the entire file is rewritten as pure `@use`.

- [ ] **Step 2: Build and verify styles compile**

```bash
cd IdeaStudio.Website
npm run build
```

Expected: no errors. `wwwroot/css/styles.min.css` is regenerated and contains `--ds-bg`, `--ds-azure`, `--ds-teal` among many others.

- [ ] **Step 3: Check tokens are exposed**

```bash
grep -c "\-\-ds-azure" wwwroot/css/styles.min.css
```

Expected: `1` (or more).

- [ ] **Step 4: Build the solution to confirm MSBuild integration**

```bash
cd /Users/andrestalavera/Repos/ideastudio
dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: build succeeds, zero warnings.

- [ ] **Step 5: Commit**

```bash
git add IdeaStudio.Website/wwwroot/scss/styles.scss
git commit -m "Wire new design-system layers into styles.scss entry

Design system (base + utilities) layered after Bootstrap. Bootstrap
remains loaded so component migration can happen one at a time; both
systems coexist with prefixed class names.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Pattern — Button

**Files:**
- Create: `IdeaStudio.Website/wwwroot/scss/patterns/_button.scss`
- Modify: `IdeaStudio.Website/wwwroot/scss/styles.scss` (add `@use`)

- [ ] **Step 1: Create `patterns/_button.scss`**

```scss
@use '../tokens/space' as s;
@use '../tokens/typography' as t;

.ds-btn {
  --ds-btn-bg: transparent;
  --ds-btn-fg: var(--ds-fg);
  --ds-btn-border: rgba(125, 211, 252, 0.15);
  --ds-btn-bg-hover: rgba(125, 211, 252, 0.08);
  --ds-btn-border-hover: rgba(125, 211, 252, 0.35);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: s.$s-2;
  padding: s.$s-2 s.$s-4;
  border-radius: s.$r-pill;
  font-family: var(--ds-font-sans);
  font-weight: t.$fw-medium;
  font-size: t.$fs-small;
  line-height: 1;
  min-height: 2.5rem;
  color: var(--ds-btn-fg);
  background: var(--ds-btn-bg);
  border: 1px solid var(--ds-btn-border);
  cursor: pointer;
  transition: background var(--ds-dur-fast) var(--ds-ease-out),
              border-color var(--ds-dur-fast) var(--ds-ease-out),
              transform var(--ds-dur-fast) var(--ds-ease-out);
  text-decoration: none;

  &:hover {
    background: var(--ds-btn-bg-hover);
    border-color: var(--ds-btn-border-hover);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-focus-ring);
    outline-offset: 2px;
  }

  &:active { transform: translateY(0); }
}

.ds-btn--primary {
  --ds-btn-bg: var(--ds-azure);
  --ds-btn-fg: var(--ds-bg);
  --ds-btn-border: transparent;
  --ds-btn-bg-hover: var(--ds-sky);
  --ds-btn-border-hover: transparent;
}

.ds-btn--ghost {
  --ds-btn-bg: transparent;
  --ds-btn-border: transparent;
  --ds-btn-bg-hover: rgba(125, 211, 252, 0.08);
  --ds-btn-border-hover: transparent;
}

.ds-btn--sm { padding: s.$s-1 s.$s-3; font-size: 0.8rem; min-height: 1.75rem; }
.ds-btn--lg { padding: s.$s-3 s.$s-5; font-size: t.$fs-body; }

.ds-btn--icon-only { padding: s.$s-2; aspect-ratio: 1; }
```

- [ ] **Step 2: Register the pattern in `styles.scss`**

Append to `IdeaStudio.Website/wwwroot/scss/styles.scss` (after the other `@import` lines for the ds layers):

```scss
@import 'patterns/button';
```

- [ ] **Step 3: Verify compile**

```bash
cd IdeaStudio.Website
npm run compile-styles
grep -c "ds-btn" wwwroot/css/styles.min.css
```

Expected: compile succeeds, grep returns a non-zero count.

- [ ] **Step 4: Commit**

```bash
git add IdeaStudio.Website/wwwroot/scss/patterns/_button.scss IdeaStudio.Website/wwwroot/scss/styles.scss
git commit -m "Add button pattern (.ds-btn with primary, ghost, sm, lg variants)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Pattern — Card (glass)

**Files:**
- Create: `IdeaStudio.Website/wwwroot/scss/patterns/_card.scss`
- Modify: `IdeaStudio.Website/wwwroot/scss/styles.scss`

- [ ] **Step 1: Create `patterns/_card.scss`**

```scss
@use '../tokens/space' as s;
@use '../tokens/typography' as t;

.ds-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: s.$s-5;
  border-radius: s.$r-lg;
  background: var(--ds-glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--ds-glass-border);
  box-shadow: s.$shadow-2, s.$shadow-inset-hl;
  color: var(--ds-fg);
  overflow: hidden;
  transition: border-color var(--ds-dur-base) var(--ds-ease-out),
              transform var(--ds-dur-base) var(--ds-ease-out),
              box-shadow var(--ds-dur-base) var(--ds-ease-out);

  &:hover {
    border-color: rgba(125, 211, 252, 0.30);
    transform: translateY(-2px);
    box-shadow: s.$shadow-3, s.$shadow-inset-hl;
  }
}

.ds-card__banner {
  margin: -#{s.$s-5} -#{s.$s-5} s.$s-4;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-top-left-radius: s.$r-lg;
  border-top-right-radius: s.$r-lg;
}

.ds-card__title {
  font-size: t.$fs-h3;
  font-weight: t.$fw-semibold;
  color: var(--ds-fg);
  margin: 0 0 s.$s-3;
  letter-spacing: t.$tracking-snug;
}

.ds-card__body  { font-size: t.$fs-body; line-height: t.$lh-normal; color: var(--ds-fg-muted); flex: 1; }
.ds-card__footer { margin-top: s.$s-4; padding-top: s.$s-3; border-top: 1px solid var(--ds-glass-border); }

// Tag / badge inside a card.
.ds-tag {
  display: inline-flex;
  align-items: center;
  gap: s.$s-1;
  padding: s.$s-1 s.$s-3;
  font-family: var(--ds-font-mono);
  font-size: 0.75rem;
  color: var(--ds-teal);
  background: rgba(94, 234, 212, 0.1);
  border: 1px solid rgba(94, 234, 212, 0.2);
  border-radius: s.$r-sm;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.ds-tag--neutral {
  color: var(--ds-fg-muted);
  background: rgba(125, 211, 252, 0.08);
  border-color: rgba(125, 211, 252, 0.15);
}
```

- [ ] **Step 2: Register the pattern**

Append to `IdeaStudio.Website/wwwroot/scss/styles.scss`:

```scss
@import 'patterns/card';
```

- [ ] **Step 3: Verify compile**

```bash
cd IdeaStudio.Website
npm run compile-styles
grep -c "ds-card" wwwroot/css/styles.min.css
```

Expected: compile succeeds, grep returns non-zero.

- [ ] **Step 4: Commit**

```bash
git add IdeaStudio.Website/wwwroot/scss/patterns/_card.scss IdeaStudio.Website/wwwroot/scss/styles.scss
git commit -m "Add card pattern (.ds-card glass surface with banner/title/body/footer)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Pattern — Chapter

**Files:**
- Create: `IdeaStudio.Website/wwwroot/scss/patterns/_chapter.scss`
- Modify: `IdeaStudio.Website/wwwroot/scss/styles.scss`

- [ ] **Step 1: Create `patterns/_chapter.scss`**

```scss
@use '../tokens/space' as s;
@use '../tokens/typography' as t;

.ds-chapter {
  position: relative;
  padding-block: s.$s-9;
}

.ds-chapter__heading {
  display: flex;
  flex-direction: column;
  gap: s.$s-3;
  margin-bottom: s.$s-7;
  text-align: center;
}

.ds-chapter__kicker {
  font-family: var(--ds-font-mono);
  font-size: t.$fs-kicker;
  text-transform: uppercase;
  letter-spacing: t.$tracking-kicker;
  color: var(--ds-teal);
}

.ds-chapter__title {
  font-size: t.$fs-display-2;
  font-weight: t.$fw-light;
  line-height: t.$lh-tight;
  letter-spacing: t.$tracking-tight;
  color: var(--ds-fg);
  margin: 0;
}

.ds-chapter__title em {
  font-style: normal;
  font-weight: t.$fw-medium;
  background: linear-gradient(90deg, var(--ds-sky), var(--ds-teal));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.ds-chapter__rule {
  width: 48px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--ds-teal), transparent);
  margin: s.$s-2 auto 0;
}
```

- [ ] **Step 2: Register the pattern**

Append to `IdeaStudio.Website/wwwroot/scss/styles.scss`:

```scss
@import 'patterns/chapter';
```

- [ ] **Step 3: Verify compile**

```bash
cd IdeaStudio.Website
npm run compile-styles
```

Expected: compile succeeds.

- [ ] **Step 4: Commit**

```bash
git add IdeaStudio.Website/wwwroot/scss/patterns/_chapter.scss IdeaStudio.Website/wwwroot/scss/styles.scss
git commit -m "Add chapter pattern (kicker + display title + gradient rule)

Phase 2 introduces ChapterSection.razor that uses these classes; Phase 1
uses them manually inside each section.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Pattern — Navbar

**Files:**
- Create: `IdeaStudio.Website/wwwroot/scss/patterns/_navbar.scss`
- Modify: `IdeaStudio.Website/wwwroot/scss/styles.scss`

- [ ] **Step 1: Create `patterns/_navbar.scss`**

```scss
@use '../tokens/space' as s;
@use '../tokens/typography' as t;

.ds-nav {
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  background: rgba(2, 6, 23, 0.55);
  border-bottom: 1px solid rgba(125, 211, 252, 0.10);
}

.ds-nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: s.$s-4;
  padding-block: s.$s-3;
}

.ds-nav__brand {
  display: inline-flex;
  align-items: center;
  gap: s.$s-3;
  color: var(--ds-fg);
  text-decoration: none;
}

.ds-nav__links {
  display: none;
  gap: s.$s-2;

  @media (min-width: 1024px) {
    display: flex;
    align-items: center;
  }
}

.ds-nav__link {
  padding: s.$s-2 s.$s-4;
  border-radius: s.$r-pill;
  color: var(--ds-fg-muted);
  text-decoration: none;
  font-size: t.$fs-small;
  font-weight: t.$fw-medium;
  transition: color var(--ds-dur-fast) var(--ds-ease-out),
              background var(--ds-dur-fast) var(--ds-ease-out);

  &:hover, &.is-active {
    color: var(--ds-fg);
    background: rgba(125, 211, 252, 0.08);
  }

  &:focus-visible { outline: 2px solid var(--ds-focus-ring); outline-offset: 2px; }
}

.ds-nav__actions {
  display: flex;
  align-items: center;
  gap: s.$s-2;
}

// Mobile toggle
.ds-nav__toggle {
  @media (min-width: 1024px) { display: none; }
  background: transparent;
  border: 1px solid rgba(125, 211, 252, 0.15);
  border-radius: s.$r-sm;
  padding: s.$s-2;
  color: var(--ds-fg);
  cursor: pointer;
}
```

- [ ] **Step 2: Register the pattern**

Append to `IdeaStudio.Website/wwwroot/scss/styles.scss`:

```scss
@import 'patterns/navbar';
```

- [ ] **Step 3: Verify compile**

```bash
cd IdeaStudio.Website
npm run compile-styles
```

Expected: compile succeeds.

- [ ] **Step 4: Commit**

```bash
git add IdeaStudio.Website/wwwroot/scss/patterns/_navbar.scss IdeaStudio.Website/wwwroot/scss/styles.scss
git commit -m "Add navbar pattern (.ds-nav sticky, blurred, pill links)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Pattern — Footer

**Files:**
- Create: `IdeaStudio.Website/wwwroot/scss/patterns/_footer.scss`
- Modify: `IdeaStudio.Website/wwwroot/scss/styles.scss`

- [ ] **Step 1: Create `patterns/_footer.scss`**

```scss
@use '../tokens/space' as s;
@use '../tokens/typography' as t;

.ds-footer {
  padding-block: s.$s-6;
  border-top: 1px solid rgba(125, 211, 252, 0.10);
  color: var(--ds-fg-muted);
  font-size: t.$fs-small;
}

.ds-footer__row {
  display: flex;
  flex-wrap: wrap;
  gap: s.$s-4;
  justify-content: space-between;
  align-items: center;
}

.ds-footer__copyright { margin: 0; }

.ds-footer__links {
  display: flex;
  gap: s.$s-4;
}

.ds-footer__link {
  color: var(--ds-fg-muted);
  text-decoration: none;
  transition: color var(--ds-dur-fast) var(--ds-ease-out);

  &:hover { color: var(--ds-fg); }
  &:focus-visible { outline: 2px solid var(--ds-focus-ring); outline-offset: 2px; }
}
```

- [ ] **Step 2: Register the pattern**

Append to `IdeaStudio.Website/wwwroot/scss/styles.scss`:

```scss
@import 'patterns/footer';
```

- [ ] **Step 3: Verify compile and build**

```bash
cd IdeaStudio.Website
npm run build
cd ..
dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: both succeed, zero warnings.

- [ ] **Step 4: Commit**

```bash
git add IdeaStudio.Website/wwwroot/scss/patterns/_footer.scss IdeaStudio.Website/wwwroot/scss/styles.scss
git commit -m "Add footer pattern (.ds-footer thin, bordered, muted)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Migrate Card.razor

**Files:**
- Modify: `IdeaStudio.Website/Components/Card.razor`

`Card.razor` is the shared wrapper used by `AboutCard` and `TrainingCard`. Migrating it first lets both consumers pick up the new look immediately.

- [ ] **Step 1: Rewrite `Card.razor`**

Overwrite `IdeaStudio.Website/Components/Card.razor` with:

```razor
@using Markdig
@inherits AnimatedComponentBase
@inject ISlugService SlugService

<article @ref="ElementRef" id="@SlugService.GenerateSlug(Title)"
    class="ds-card fade-in-up" data-bs-delay="@(Index * 200)">
    @if (Banner is not null)
    {
        <img src="@Banner" class="ds-card__banner" alt="@Title banner" loading="lazy">
    }
    @if (Title is not null)
    {
        <h3 class="ds-card__title">@Title</h3>
    }
    <div class="ds-card__body @BodyStyle">
        @if (Content is not null)
        {
            @Content
        }
    </div>
    @if (Footer is not null)
    {
        <div class="ds-card__footer">
            @Footer
        </div>
    }
</article>

@code {
    [Parameter] public string? Banner { get; set; }
    [Parameter] public string? Title { get; set; }
    [Parameter] public RenderFragment? Content { get; set; }
    [Parameter] public RenderFragment? Footer { get; set; }
    [Parameter] public string BodyStyle { get; set; } = string.Empty;
    [Parameter] public int Index { get; set; } = 0;
}
```

Note: `fade-in-up` class is kept temporarily (driven by `animations.js` until Phase 2 replaces it).

- [ ] **Step 2: Build and start dev server**

```bash
cd /Users/andrestalavera/Repos/ideastudio
dotnet run --project IdeaStudio.Website/IdeaStudio.Website.csproj
```

Open `http://localhost:5xxx` in a browser. Expected: cards (About + Training sections) render with the glass dark look, no layout break, no console error.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add IdeaStudio.Website/Components/Card.razor
git commit -m "Migrate Card.razor to ds-card pattern

Shared by AboutCard and TrainingCard, so both pick up the new glass look
in one change. fade-in-up class kept temporarily until Phase 2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Migrate AboutCard.razor and TrainingCard.razor

**Files:**
- Modify: `IdeaStudio.Website/Components/AboutCard.razor`
- Modify: `IdeaStudio.Website/Components/TrainingCard.razor`

- [ ] **Step 1: Rewrite `AboutCard.razor`**

Overwrite `IdeaStudio.Website/Components/AboutCard.razor` with:

```razor
@using Markdig

<Card Title="@(AboutSection.Title)" Index="@Index">
    <Content>
        @if (AboutSection.Paragraphs is not null)
        {
            @foreach (string paragraph in AboutSection.Paragraphs)
            {
                <p>@((MarkupString)Markdown.ToHtml(paragraph))</p>
            }
        }
        @if (AboutSection.Icons is not null)
        {
            <div class="ds-cluster ds-cluster--tight ds-print-hidden" style="justify-content: center; margin-block: 1rem;">
                @foreach (string icon in AboutSection.Icons)
                {
                    <i class="@icon fa-4x" style="color: var(--ds-sky);" aria-hidden="true"></i>
                }
            </div>
        }
        @if (AboutSection.Images is not null)
        {
            <div class="ds-cluster ds-cluster--tight ds-print-hidden" style="justify-content: center; margin-block: 1rem;">
                @foreach (string image in AboutSection.Images)
                {
                    <img src="images/@image" alt="@image" width="70" height="70" loading="lazy" style="border-radius: 8px;">
                }
            </div>
        }
    </Content>
</Card>

@code {
    [Parameter] public required AboutSection AboutSection { get; set; }
    [Parameter] public required int Index { get; set; }
}
```

- [ ] **Step 2: Rewrite `TrainingCard.razor`**

Overwrite `IdeaStudio.Website/Components/TrainingCard.razor` with:

```razor
@using IdeaStudio.Website.Models
@using IdeaStudio.Website.Services
@using Markdig
@inherits LocalizedComponent

<Card Title="@TrainingCenter.Name" Index="@Index">
    <Content>
        @if (TrainingCenter.Courses is not null)
        {
            <div class="ds-stack ds-stack--tight">
                <p class="ds-kicker">@coursesText</p>
                @foreach (string course in TrainingCenter.Courses)
                {
                    <div class="ds-cluster ds-cluster--tight">
                        <i class="fas fa-graduation-cap ds-small" style="color: var(--ds-teal);" aria-hidden="true"></i>
                        <span>@course</span>
                    </div>
                }
            </div>
        }
        @if (TrainingCenter.Locations is not null)
        {
            <div class="ds-stack ds-stack--tight" style="margin-top: 1rem;">
                <p class="ds-kicker">@locationsText</p>
                <div class="ds-cluster ds-cluster--tight">
                    @foreach (string location in TrainingCenter.Locations)
                    {
                        <span class="ds-tag ds-tag--neutral">
                            <i class="fas fa-map-marker-alt" aria-hidden="true"></i>@location
                        </span>
                    }
                </div>
            </div>
        }
    </Content>
</Card>

@code {
    [Parameter] public required TrainingCenter TrainingCenter { get; set; }
    [Parameter] public required int Index { get; set; }
    private string coursesText = "Courses";
    private string locationsText = "Locations";

    protected override void LoadTexts()
    {
        coursesText = LocalizationService.GetString("Courses");
        locationsText = LocalizationService.GetString("Locations");
    }
}
```

- [ ] **Step 3: Build and visually verify**

```bash
cd /Users/andrestalavera/Repos/ideastudio
dotnet run --project IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: About and Training sections render with glass cards, courses listed vertically with graduation-cap icons, locations shown as pill tags.

- [ ] **Step 4: Commit**

```bash
git add IdeaStudio.Website/Components/AboutCard.razor IdeaStudio.Website/Components/TrainingCard.razor
git commit -m "Migrate AboutCard and TrainingCard to design-system utilities

Replace Bootstrap d-flex/gap/badge classes with ds-cluster/ds-stack/ds-tag.
Icon color comes from --ds-teal. Kicker classes for section labels.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Migrate ExperienceCard.razor

**Files:**
- Modify: `IdeaStudio.Website/Components/ExperienceCard.razor`

This component is the biggest. The migration keeps the same structural layout (sticky sidebar on desktop, stacked on mobile) but uses design-system classes.

- [ ] **Step 1: Rewrite `ExperienceCard.razor`**

Overwrite `IdeaStudio.Website/Components/ExperienceCard.razor` with:

```razor
@using Markdig
@inject ISlugService SlugService
@inherits AnimatedComponentBase

<article @ref="ElementRef" id="@Experience.Id" class="ds-card ds-exp-card fade-in-up">
    <div class="ds-exp-card__grid">
        <aside class="ds-exp-card__sidebar">
            <div class="ds-exp-card__logo">
                <img src="@($"images/{SlugService.GenerateSlug(Experience.Company)}.png")"
                    alt="@Experience.Company logo" loading="lazy" height="80"
                    onerror="this.src='images/placeholder.png'">
            </div>
            <h2 class="ds-h1">@Experience.Title</h2>
            <p class="ds-body-lead" style="margin: 0 0 1rem;">@Experience.Company</p>
            <div class="ds-stack ds-stack--tight">
                @if (Experience.Mode is not null)
                {
                    @Badge((Experience.Mode, "fas fa-briefcase"))
                }
                @if (Experience.Duration is not null)
                {
                    @Badge((Experience.Duration, "fas fa-calendar"))
                }
                @if (Experience.Locations is not null)
                {
                    <div class="ds-cluster ds-cluster--tight">
                        @foreach (string? location in Experience.Locations)
                        {
                            @Badge((location, "fas fa-map-marker-alt"))
                        }
                    </div>
                }
            </div>
        </aside>

        <div class="ds-exp-card__content">
            @if (Experience.Description is not null)
            {
                <div class="ds-stack ds-stack--tight" style="margin-bottom: 1.5rem;">
                    @foreach (string? paragraph in Experience.Description)
                    {
                        if (!string.IsNullOrWhiteSpace(paragraph))
                        {
                            <p>@((MarkupString)paragraph)</p>
                        }
                    }
                </div>
            }

            @if (Experience.Responsibilities is not null)
            {
                <section style="margin-bottom: 1.5rem;">
                    <h3 class="ds-kicker" style="margin: 0 0 0.75rem;">Key Responsibilities</h3>
                    <ul class="ds-stack ds-stack--tight" style="list-style: none; padding: 0;">
                        @foreach (string? responsibility in Experience.Responsibilities)
                        {
                            if (!string.IsNullOrWhiteSpace(responsibility))
                            {
                                <li class="ds-cluster ds-cluster--tight" style="align-items: flex-start;">
                                    <i class="fas fa-check ds-print-hidden" style="color: var(--ds-teal); margin-top: 0.35rem;" aria-hidden="true"></i>
                                    <span>@responsibility</span>
                                </li>
                            }
                        }
                    </ul>
                </section>
            }

            @if (Experience.Skills is not null)
            {
                <section>
                    <h3 class="ds-kicker" style="margin: 0 0 0.75rem;">Technologies & Skills</h3>
                    <div class="ds-cluster ds-cluster--tight">
                        @foreach (string? skill in Experience.Skills)
                        {
                            @Badge((skill, SkillBadge.GetSkillIcon(skill)))
                        }
                    </div>
                </section>
            }
        </div>
    </div>
</article>

@code {
    [Parameter] public required Experience Experience { get; set; }

    protected override void OnInitialized()
    => Experience = Experience.WithGeneratedId(SlugService)!;

    private RenderFragment<(string? Title, string? Icon)> Badge => (skill) =>
    {
        return @<span class="ds-tag ds-tag--neutral">
            @if (!string.IsNullOrEmpty(skill.Icon))
            {
                <i class="@skill.Icon" aria-hidden="true"></i>
            }
            @if (!string.IsNullOrEmpty(skill.Title))
            {
                <span>@skill.Title</span>
            }
        </span>;
    };
}
```

- [ ] **Step 2: Add experience-card layout to patterns/_card.scss**

Append to `IdeaStudio.Website/wwwroot/scss/patterns/_card.scss`:

```scss
.ds-exp-card { padding: s.$s-6; }

.ds-exp-card__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: s.$s-5;

  @media (min-width: s.$bp-lg) {
    grid-template-columns: 1fr 2fr;
    gap: s.$s-6;
  }
}

.ds-exp-card__sidebar {
  @media (min-width: s.$bp-lg) {
    position: sticky;
    top: 120px;
    align-self: flex-start;
  }
  text-align: center;
  @media (min-width: s.$bp-lg) { text-align: left; }
}

.ds-exp-card__logo {
  display: inline-block;
  padding: s.$s-3;
  background: rgba(255, 255, 255, 0.02);
  border-radius: s.$r-md;
  margin-bottom: s.$s-4;

  img { max-height: 80px; width: auto; }
}

.ds-exp-card__content { min-width: 0; }
```

- [ ] **Step 3: Rebuild and visually verify**

```bash
cd /Users/andrestalavera/Repos/ideastudio
dotnet run --project IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: the Experiences section shows glass cards with a sticky sidebar on desktop (company logo, title, company, meta badges) and a content column (description, responsibilities, skills as teal tags).

- [ ] **Step 4: Commit**

```bash
git add IdeaStudio.Website/Components/ExperienceCard.razor IdeaStudio.Website/wwwroot/scss/patterns/_card.scss
git commit -m "Migrate ExperienceCard to design-system classes

Replaces Bootstrap row/col grid with native CSS Grid (.ds-exp-card__grid),
Bootstrap badges with .ds-tag, vstack with ds-stack. Sticky sidebar on
large screens kept via custom layout class.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Migrate HeroSection.razor

**Files:**
- Modify: `IdeaStudio.Website/Components/HeroSection.razor`
- Modify: `IdeaStudio.Website/wwwroot/scss/patterns/_card.scss` (hero-specific layout)

- [ ] **Step 1: Rewrite `HeroSection.razor`**

Overwrite `IdeaStudio.Website/Components/HeroSection.razor` with:

```razor
@using Markdig
@inherits AnimatedComponentBase

<section class="ds-hero" id="hero">
    <div class="ds-container">
        <div @ref="ElementRef" class="ds-hero__inner fade-in-up">
            @if (PersonalInformation is not null)
            {
                <p class="ds-kicker">· Chapter I · Introduction ·</p>
                <h1 class="ds-display-1 ds-hero__name">@PersonalInformation.Hero</h1>

                <div class="ds-hero__row">
                    @if (ProfileImage is not null)
                    {
                        <img src="@ProfileImage"
                            alt="@PersonalInformation.Name - @PersonalInformation.Title"
                            class="ds-hero__avatar" width="200" height="200" loading="eager"
                            onerror="this.src='images/placeholder.png'">
                    }
                    <div class="ds-hero__intro">
                        <h2 class="ds-h1">@PersonalInformation.Name</h2>
                        <div class="ds-body-lead">
                            @if (!string.IsNullOrEmpty(PersonalInformation.Introduction))
                            {
                                @((MarkupString)PersonalInformation.Introduction)
                            }
                            else
                            {
                                <Placeholder />
                            }
                        </div>
                        @if (PersonalInformation.Languages?.Values.Any() == true)
                        {
                            <div class="ds-cluster ds-cluster--tight" style="margin-top: 1rem;">
                                @foreach (KeyValuePair<string, string> language in PersonalInformation.Languages)
                                {
                                    <span class="ds-tag">
                                        <i class="fas fa-globe" aria-hidden="true"></i>@language.Value
                                    </span>
                                }
                            </div>
                        }

                        <div class="ds-print-only ds-stack ds-stack--tight" style="margin-top: 1rem;">
                            @if (!string.IsNullOrWhiteSpace(PersonalInformation.Email))
                            {
                                <div><i class="fas fa-envelope" aria-hidden="true"></i>
                                    <a href="mailto:@PersonalInformation.Email" target="_blank">@PersonalInformation.Email</a>
                                </div>
                            }
                            @if (!string.IsNullOrWhiteSpace(PersonalInformation.LinkedIn))
                            {
                                <div><i class="fab fa-linkedin" aria-hidden="true"></i>
                                    <a href="https://linkedin.com/in/@PersonalInformation.LinkedIn" target="_blank">linkedin.com/in/@PersonalInformation.LinkedIn</a>
                                </div>
                            }
                            @if (!string.IsNullOrWhiteSpace(PersonalInformation.GitHub))
                            {
                                <div><i class="fab fa-github" aria-hidden="true"></i>
                                    <a href="https://github.com/@PersonalInformation.GitHub" target="_blank">github.com/@PersonalInformation.GitHub</a>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            }
            else
            {
                <Placeholder />
            }
        </div>
    </div>
</section>

@code {
    [Parameter] public PersonalInformation? PersonalInformation { get; set; }
    [Parameter] public string? ProfileImage { get; set; }
}
```

- [ ] **Step 2: Add hero layout to patterns/_card.scss**

Append to `IdeaStudio.Website/wwwroot/scss/patterns/_card.scss`:

```scss
.ds-hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-block: s.$s-9;
  position: relative;
  overflow: hidden;
}

.ds-hero__inner {
  max-width: 960px;
  margin-inline: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: s.$s-6;
}

.ds-hero__name {
  margin: 0;
  background: linear-gradient(90deg, var(--ds-sky), var(--ds-teal), var(--ds-mint));
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.ds-hero__row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: s.$s-5;

  @media (min-width: s.$bp-md) {
    flex-direction: row;
    align-items: flex-start;
    text-align: left;
    gap: s.$s-7;
  }
}

.ds-hero__avatar {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(125, 211, 252, 0.20);
  box-shadow: 0 10px 40px rgba(14, 165, 233, 0.15);
  flex-shrink: 0;
}

.ds-hero__intro { flex: 1; }
```

- [ ] **Step 3: Rebuild and visually verify**

```bash
cd /Users/andrestalavera/Repos/ideastudio
dotnet run --project IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: hero section is centered, dark, the name rendered with blue/teal gradient, avatar aligned left on desktop / stacked on mobile, language tags visible.

- [ ] **Step 4: Commit**

```bash
git add IdeaStudio.Website/Components/HeroSection.razor IdeaStudio.Website/wwwroot/scss/patterns/_card.scss
git commit -m "Migrate HeroSection to design-system layout

Semantic markup preserved for SEO and accessibility; the current Bootstrap
card-based visual is replaced by a centered hero with gradient name and
flex row for avatar+intro. Phase 2 adds the WebGL scene behind it.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Migrate ContactSection, SocialNetworksComponent, CultureSelector

**Files:**
- Modify: `IdeaStudio.Website/Components/ContactSection.razor`
- Modify: `IdeaStudio.Website/Components/SocialNetworksComponent.razor`
- Modify: `IdeaStudio.Website/Components/CultureSelector.razor`

- [ ] **Step 1: Rewrite `ContactSection.razor`**

Overwrite `IdeaStudio.Website/Components/ContactSection.razor` with:

```razor
@inherits AnimatedComponentBase

<div @ref="ElementRef" class="ds-contact fade-in-up">
    <div class="ds-container" style="max-width: 720px;">
        <div class="ds-card" style="text-align: center; padding: 3rem;">
            <p class="ds-kicker">· Chapter V · Let's talk ·</p>
            <h2 class="ds-display-2" style="margin: 0.5rem 0 1rem;">@letsConnectText</h2>
            <p class="ds-body-lead">@readyToDiscussText</p>
            <div class="ds-cluster" style="justify-content: center; margin-top: 2rem;">
                <SocialNetworksComponent Size="lg" ShowText="true" />
            </div>
        </div>
    </div>
</div>

@code {
    private string letsConnectText = "Let's Connect";
    private string readyToDiscussText = "Ready to discuss your next project? Let's build something amazing together.";

    protected override void LoadTexts()
    {
        letsConnectText = LocalizationService.GetString("LetsConnect");
        readyToDiscussText = LocalizationService.GetString("ReadyToDiscuss");
    }
}
```

- [ ] **Step 2: Rewrite `SocialNetworksComponent.razor`**

Overwrite `IdeaStudio.Website/Components/SocialNetworksComponent.razor` with:

```razor
@inherits LocalizedComponent

<div class="ds-cluster @(Vertical ? "ds-social--vertical" : "")">
    <a href="https://www.linkedin.com/in/andrestalavera/" class="@GetButtonClasses()" target="_blank"
        rel="noopener noreferrer" aria-label="@linkedInText Profile">
        <i class="fab fa-linkedin" aria-hidden="true"></i>
        @if (ShowText) { <span>@linkedInText</span> }
    </a>

    <a href="https://github.com/andrestalavera" class="@GetButtonClasses()" target="_blank"
        rel="noopener noreferrer" aria-label="@gitHubText Profile">
        <i class="fab fa-github" aria-hidden="true"></i>
        @if (ShowText) { <span>@gitHubText</span> }
    </a>

    <a href="@ResumeHref" class="@GetButtonClasses()" download target="_blank"
        rel="noopener noreferrer" aria-label="@downloadResumeText">
        <i class="fas fa-file-pdf" aria-hidden="true"></i>
        @if (ShowText) { <span>@resumeText</span> }
    </a>

    <button class="@GetButtonClasses(primary: true)"
        onclick="Calendly.initPopupWidget({url: 'https://calendly.com/andres-talavera/30min'});return false;"
        aria-label="@scheduleMeetingText">
        <i class="fas fa-video" aria-hidden="true"></i>
        @if (ShowText) { <span>@meetText</span> }
    </button>
</div>

@code {
    [Parameter] public bool Vertical { get; set; } = false;
    [Parameter] public string Size { get; set; } = "sm"; // sm, md, lg
    [Parameter] public bool ShowText { get; set; } = true;

    private string linkedInText = "LinkedIn";
    private string gitHubText = "GitHub";
    private string meetText = "Meet";
    private string scheduleMeetingText = "Schedule a meeting";
    private string resumeText = "Resume";
    private string downloadResumeText = "Download resume";

    private string ResumeHref => $"resume-{CultureService.CurrentCulture.Name}.pdf";

    protected override void LoadTexts()
    {
        linkedInText = LocalizationService.GetString("LinkedIn");
        gitHubText = LocalizationService.GetString("GitHub");
        meetText = LocalizationService.GetString("Meet");
        scheduleMeetingText = LocalizationService.GetString("ScheduleMeeting");
        resumeText = LocalizationService.GetString("Resume");
        downloadResumeText = LocalizationService.GetString("DownloadResume");
    }

    private string GetButtonClasses(bool primary = false)
    {
        var sizeClass = Size switch { "lg" => "ds-btn--lg", "sm" => "ds-btn--sm", _ => "" };
        var variantClass = primary ? "ds-btn--primary" : "";
        return $"ds-btn {sizeClass} {variantClass}".Trim();
    }
}
```

- [ ] **Step 3: Add vertical variant to patterns/_button.scss**

Append to `IdeaStudio.Website/wwwroot/scss/patterns/_button.scss`:

```scss
.ds-social--vertical { flex-direction: column; align-items: stretch; }
```

- [ ] **Step 4: Rewrite `CultureSelector.razor`**

Overwrite `IdeaStudio.Website/Components/CultureSelector.razor` with:

```razor
@using System.Globalization
@inherits LocalizedComponent

<div class="ds-culture-selector">
    <button class="ds-btn ds-btn--sm" type="button"
        @onclick="ToggleOpen" aria-haspopup="menu" aria-expanded="@isOpen" aria-label="@changeLanguageText">
        <i class="fas fa-globe" aria-hidden="true"></i>
        <span>@GetCurrentCultureDisplayName()</span>
    </button>
    @if (isOpen)
    {
        <ul class="ds-culture-selector__menu" role="menu">
            @foreach (CultureInfo culture in CultureService.SupportedCultures)
            {
                <li role="none">
                    <button class="ds-culture-selector__item @(IsCurrentCulture(culture) ? "is-active" : "")"
                        type="button" role="menuitem"
                        @onclick="() => SelectCultureAsync(culture.Name)">
                        @GetCultureDisplayName(culture)
                    </button>
                </li>
            }
        </ul>
    }
</div>

@code {
    private bool isOpen;
    private string changeLanguageText = "Change Language";
    private string englishText = "English";
    private string frenchText = "Français";

    protected override void LoadTexts()
    {
        changeLanguageText = LocalizationService.GetString("ChangeLanguage");
        englishText = LocalizationService.GetString("English");
        frenchText = LocalizationService.GetString("French");
    }

    private void ToggleOpen() => isOpen = !isOpen;

    private async Task SelectCultureAsync(string culture)
    {
        isOpen = false;
        await CultureService.SetCultureAsync(culture);
    }

    private bool IsCurrentCulture(CultureInfo culture)
    => CultureService.CurrentCulture.Name.Equals(culture.Name, StringComparison.OrdinalIgnoreCase);

    private string GetCurrentCultureDisplayName()
    => CultureService.CurrentCulture.Name.ToLower() switch
    {
        "fr" => frenchText,
        _ => englishText
    };

    private string GetCultureDisplayName(CultureInfo culture)
    => culture.Name.ToLower() switch
    {
        "fr" => frenchText,
        _ => englishText
    };
}
```

- [ ] **Step 5: Add culture-selector styling to navbar pattern**

Append to `IdeaStudio.Website/wwwroot/scss/patterns/_navbar.scss`:

```scss
.ds-culture-selector {
  position: relative;
}

.ds-culture-selector__menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  min-width: 180px;
  padding: s.$s-2;
  background: var(--ds-surface-1);
  border: 1px solid rgba(125, 211, 252, 0.15);
  border-radius: s.$r-md;
  box-shadow: s.$shadow-2;
  z-index: 50;
}

.ds-culture-selector__item {
  display: block;
  width: 100%;
  padding: s.$s-2 s.$s-3;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: s.$r-sm;
  color: var(--ds-fg-muted);
  cursor: pointer;
  font: inherit;
  transition: background var(--ds-dur-fast) var(--ds-ease-out),
              color var(--ds-dur-fast) var(--ds-ease-out);

  &:hover, &.is-active {
    background: rgba(125, 211, 252, 0.08);
    color: var(--ds-fg);
  }

  &:focus-visible { outline: 2px solid var(--ds-focus-ring); outline-offset: -2px; }
}
```

- [ ] **Step 6: Rebuild and visually verify**

```bash
cd /Users/andrestalavera/Repos/ideastudio
dotnet run --project IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: contact section is a centered glass card with kicker + gradient title + social buttons. Language selector shows as a pill button with a custom dropdown menu.

- [ ] **Step 7: Commit**

```bash
git add IdeaStudio.Website/Components/ContactSection.razor IdeaStudio.Website/Components/SocialNetworksComponent.razor IdeaStudio.Website/Components/CultureSelector.razor IdeaStudio.Website/wwwroot/scss/patterns/
git commit -m "Migrate Contact, Social, CultureSelector to design system

ContactSection becomes a glass card with kicker + gradient title.
SocialNetworksComponent uses ds-btn variants consistently.
CultureSelector replaces Bootstrap dropdown with a custom popup menu.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 16: Migrate FooterSection and MainLayout

**Files:**
- Modify: `IdeaStudio.Website/Components/FooterSection.razor`
- Modify: `IdeaStudio.Website/MainLayout.razor`

- [ ] **Step 1: Rewrite `FooterSection.razor`**

Overwrite `IdeaStudio.Website/Components/FooterSection.razor` with:

```razor
@inherits LocalizedComponent

<footer class="ds-footer ds-print-hidden">
    <div class="ds-container">
        <div class="ds-footer__row">
            <p class="ds-footer__copyright">
                &copy; @DateTime.Now.Year IdeaStud.io — Andrés Talavera. @allRightsReservedText
            </p>
            <div class="ds-footer__links">
                <a href="/privacy" class="ds-footer__link">@privacyPolicyText</a>
                <a href="/legal" class="ds-footer__link">@legalMentionsText</a>
            </div>
            <CultureSelector />
        </div>
    </div>
</footer>

@code {
    private string allRightsReservedText = "All rights reserved.";
    private string privacyPolicyText = "Privacy Policy";
    private string legalMentionsText = "Legal Mentions";

    protected override void LoadTexts()
    {
        allRightsReservedText = LocalizationService.GetString("AllRightsReserved");
        privacyPolicyText = LocalizationService.GetString("PrivacyPolicy");
        legalMentionsText = LocalizationService.GetString("LegalMentions");
    }
}
```

- [ ] **Step 2: Rewrite `MainLayout.razor`**

Overwrite `IdeaStudio.Website/MainLayout.razor` with:

```razor
@inherits LayoutComponentBase
@using IdeaStudio.Website.Services
@using IdeaStudio.Website.Components
@inject ICultureService CultureService
@inject ILocalizationService LocalizationService
@implements IDisposable

<CascadingValue Value="this">
    <Loading />

    <div id="main-content-container" class="ds-app">
        <a href="#main-content" class="ds-skip-link">@skipToMainContentText</a>

        <nav class="ds-nav ds-print-hidden" id="navbar">
            <div class="ds-container">
                <div class="ds-nav__inner">
                    <a class="ds-nav__brand" href="/" aria-label="IdeaStudio - Home">
                        <img src="images/logo-ideastudio-white.svg" alt="IdeaStudio" height="40" width="100" loading="eager">
                    </a>

                    <div class="ds-nav__links">
                        @if (NavbarContent is not null) { @NavbarContent }
                    </div>

                    <div class="ds-nav__actions">
                        <SocialNetworksComponent Size="sm" ShowText="false" />
                        <CultureSelector />
                    </div>
                </div>
            </div>
        </nav>

        <main id="main-content" role="main">
            @Body
        </main>

        <FooterSection />
    </div>
</CascadingValue>

@code {
    [Parameter] public RenderFragment? NavbarContent { get; set; }

    private string skipToMainContentText = "Skip to main content";

    protected override async Task OnInitializedAsync()
    {
        CultureService.CultureChanged += OnCultureChanged;
        await LoadLocalizedStringsAsync();
    }

    public void SetNavbarContent(RenderFragment? content)
    {
        NavbarContent = content;
        StateHasChanged();
    }

    private async Task LoadLocalizedStringsAsync()
    {
        await LocalizationService.LoadCultureAsync(CultureService.CurrentCulture.Name);
        LoadTexts();
        StateHasChanged();
    }

    private async void OnCultureChanged()
    => await LoadLocalizedStringsAsync();

    private void LoadTexts()
    {
        skipToMainContentText = LocalizationService.GetString("SkipToMainContent");
    }

    public void Dispose()
    {
        CultureService.CultureChanged -= OnCultureChanged;
        GC.SuppressFinalize(this);
    }
}
```

- [ ] **Step 3: Add .ds-app layout utility**

Append to `IdeaStudio.Website/wwwroot/scss/utilities/_stack.scss`:

```scss
.ds-app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  > main { flex: 1; }
}
```

- [ ] **Step 4: Rebuild and visually verify**

```bash
cd /Users/andrestalavera/Repos/ideastudio
dotnet run --project IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: sticky navbar at top with logo on the left, nav links (from Index.razor) in the middle, social icons + culture selector on the right. Footer at bottom with 3 columns (copyright / privacy+legal / culture selector).

- [ ] **Step 5: Commit**

```bash
git add IdeaStudio.Website/Components/FooterSection.razor IdeaStudio.Website/MainLayout.razor IdeaStudio.Website/wwwroot/scss/utilities/_stack.scss
git commit -m "Migrate MainLayout and FooterSection to design system

Removes Bootstrap navbar classes in favour of ds-nav. Footer compacted
into a single row (copyright / links / language). Skip-link uses new
ds-skip-link utility.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 17: Migrate Index.razor (navbar content + sections)

**Files:**
- Modify: `IdeaStudio.Website/Pages/Index.razor`

- [ ] **Step 1: Update `Index.razor`**

Only the markup (sections and the NavbarNavigationContent render fragment) needs migration. Keep all C# code identical.

Find this section in `IdeaStudio.Website/Pages/Index.razor`:

```razor
<HeroSection PersonalInformation="@resume?.PersonalInformation" ProfileImage="images/andres-talavera.jpeg" />

<div class="pagebreak"></div>

<section id="about" class="py-5 d-print-none" data-bs-spy="scroll" data-bs-target="#navbar">
    <div class="container">
    @if (resume?.AboutSections is not null)
    {
        <div class="row g-4">
        @foreach (var (section, index) in resume.AboutSections.Select((s, i) => (s, i)))
        {
            <div class="col-12 col-lg-6 col-xxl-4">
                <AboutCard AboutSection="@(section)" Index="@index" />
            </div>
        }
        </div>
    }
    else
    {
        <Placeholder />
    }
    </div>
</section>

<section id="experiences" class="py-5 pagebreak" data-bs-spy="scroll" data-bs-target="#navbar">
    <div class="container">
        <Heading Title="@professionalExperiencesText" />

        @if (resume?.Experiences is not null)
        {
            <div class="row g-4">
            @foreach (var (experience, index) in resume.Experiences.Select((e, i) => (e, i)))
            {
                <div class="col-12 d-print-flex @DisplayClasses(index, DEFAULT_EXPERIENCES_TO_SHOW)">
                    <ExperienceCard Experience="@experience.WithGeneratedId(SlugService)" />
                </div>
            }
            </div>

        @if (hasHiddenExperiences)
        {
            <div class="row d-print-none">
                <div class="col-12 text-center mt-4">
                    <button class="btn btn-light" @onclick="ToggleExperiences">
                    @if (showAllExperiences)
                    {
                        <span>@showLatestExperiencesText</span>
                    }
                    else
                    {
                        <span>@string.Format(showMoreExperiencesText, hiddenExperiencesCount)</span>
                    }
                    </button>
                </div>
            </div>
        }
    }
    else
    {
        <Placeholder />
    }
    </div>
</section>

<section id="trainings" class="py-5 d-print-none" data-bs-spy="scroll" data-bs-target="#navbar">
    <div class="container">
        <Heading Title="@trainingCoursesText" />

        @if (resume?.TrainingCenters is not null)
        {
            <div class="row g-4">
                @foreach (var (center, index) in resume.TrainingCenters.Select((t, i) => (t, i)))
                {
                    <div class="col-12 col-lg-6 col-xxl-4">
                        <TrainingCard TrainingCenter="@center.WithGeneratedId(SlugService)" Index="@index" />
                    </div>
                }
            </div>
        }
        else
        {
            <Placeholder />
        }
    </div>
</section>

<section id="contact" class="py-5 d-print-none" data-bs-spy="scroll" data-bs-target="#navbar">
    <ContactSection />
</section>
```

Replace the **entire markup block above** with:

```razor
<HeroSection PersonalInformation="@resume?.PersonalInformation" ProfileImage="images/andres-talavera.jpeg" />

<div class="ds-pagebreak"></div>

<section id="about" class="ds-chapter ds-print-hidden" data-bs-spy="scroll" data-bs-target="#navbar">
    <div class="ds-container">
        <header class="ds-chapter__heading">
            <p class="ds-chapter__kicker">· Chapter II ·</p>
            <h2 class="ds-chapter__title">About <em>me</em></h2>
            <div class="ds-chapter__rule"></div>
        </header>
        @if (resume?.AboutSections is not null)
        {
            <div class="ds-grid ds-grid--3">
                @foreach (var (section, index) in resume.AboutSections.Select((s, i) => (s, i)))
                {
                    <AboutCard AboutSection="@(section)" Index="@index" />
                }
            </div>
        }
        else
        {
            <Placeholder />
        }
    </div>
</section>

<section id="experiences" class="ds-chapter ds-pagebreak" data-bs-spy="scroll" data-bs-target="#navbar">
    <div class="ds-container">
        <header class="ds-chapter__heading">
            <p class="ds-chapter__kicker">· Chapter III ·</p>
            <h2 class="ds-chapter__title">@professionalExperiencesText</h2>
            <div class="ds-chapter__rule"></div>
        </header>
        @if (resume?.Experiences is not null)
        {
            <div class="ds-stack">
                @foreach (var (experience, index) in resume.Experiences.Select((e, i) => (e, i)))
                {
                    <div class="@DisplayClasses(index, DEFAULT_EXPERIENCES_TO_SHOW)">
                        <ExperienceCard Experience="@experience.WithGeneratedId(SlugService)" />
                    </div>
                }
            </div>
            @if (hasHiddenExperiences)
            {
                <div class="ds-print-hidden" style="text-align: center; margin-top: 2rem;">
                    <button class="ds-btn" @onclick="ToggleExperiences">
                        @if (showAllExperiences)
                        {
                            <span>@showLatestExperiencesText</span>
                        }
                        else
                        {
                            <span>@string.Format(showMoreExperiencesText, hiddenExperiencesCount)</span>
                        }
                    </button>
                </div>
            }
        }
        else
        {
            <Placeholder />
        }
    </div>
</section>

<section id="trainings" class="ds-chapter ds-print-hidden" data-bs-spy="scroll" data-bs-target="#navbar">
    <div class="ds-container">
        <header class="ds-chapter__heading">
            <p class="ds-chapter__kicker">· Chapter IV ·</p>
            <h2 class="ds-chapter__title">@trainingCoursesText</h2>
            <div class="ds-chapter__rule"></div>
        </header>
        @if (resume?.TrainingCenters is not null)
        {
            <div class="ds-grid ds-grid--3">
                @foreach (var (center, index) in resume.TrainingCenters.Select((t, i) => (t, i)))
                {
                    <TrainingCard TrainingCenter="@center.WithGeneratedId(SlugService)" Index="@index" />
                }
            </div>
        }
        else
        {
            <Placeholder />
        }
    </div>
</section>

<section id="contact" class="ds-chapter ds-print-hidden" data-bs-spy="scroll" data-bs-target="#navbar">
    <ContactSection />
</section>
```

- [ ] **Step 2: Update `DisplayClasses` method in the `@code` block**

Replace the existing `DisplayClasses` method at the bottom of `Index.razor`:

```csharp
    private string DisplayClasses(int index, int toShow)
    => index < toShow ? "" : showAllExperiences ? "" : "ds-collapsed";
```

And the `NavbarNavigationContent` render fragment (also in `@code`):

```csharp
    private RenderFragment NavbarNavigationContent => @<text>
        <a class="ds-nav__link" href="#about" data-section="about">@aboutText</a>
        <a class="ds-nav__link" href="#experiences" data-section="experiences">@experiencesText</a>
        <a class="ds-nav__link" href="#trainings" data-section="training">@trainingText</a>
        <a class="ds-nav__link" href="#contact" data-section="contact">@contactText</a>
    </text>;
```

- [ ] **Step 3: Add `.ds-collapsed` utility**

Append to `IdeaStudio.Website/wwwroot/scss/utilities/_print.scss`:

```scss
.ds-collapsed { display: none; }
@media print { .ds-collapsed { display: initial; } }
```

- [ ] **Step 4: Rebuild and visually verify**

```bash
cd /Users/andrestalavera/Repos/ideastudio
dotnet run --project IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: each section starts with a centered kicker + gradient-em title + thin rule. Sections are spaced with `ds-chapter` padding. Grid layouts adapt from 1 → 2 → 3 columns across breakpoints. "Show more" button uses the ghost pill style.

- [ ] **Step 5: Commit**

```bash
git add IdeaStudio.Website/Pages/Index.razor IdeaStudio.Website/wwwroot/scss/utilities/_print.scss
git commit -m "Migrate Index.razor to chapter pattern and new grid

Each section becomes a ds-chapter with kicker + gradient-em title + rule.
Bootstrap .row .col-* replaced by ds-grid. Show-more button uses ds-btn.
Pagebreak and print-hidden utilities replace d-print-*.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 18: Migrate Privacy, Legal, and small components

**Files:**
- Modify: `IdeaStudio.Website/Pages/Privacy.razor`
- Modify: `IdeaStudio.Website/Pages/Legal.razor`
- Modify: `IdeaStudio.Website/Components/Heading.razor`
- Modify: `IdeaStudio.Website/Components/Loading.razor`
- Modify: `IdeaStudio.Website/Components/Placeholder.razor`

- [ ] **Step 1: Read current content of each file**

```bash
cd /Users/andrestalavera/Repos/ideastudio
cat IdeaStudio.Website/Pages/Privacy.razor
cat IdeaStudio.Website/Pages/Legal.razor
cat IdeaStudio.Website/Components/Heading.razor
cat IdeaStudio.Website/Components/Loading.razor
cat IdeaStudio.Website/Components/Placeholder.razor
```

- [ ] **Step 2: For each file, replace Bootstrap class names with design-system equivalents**

Apply this translation table mechanically to every Razor file listed above (use search-and-replace with caution):

| Bootstrap class | Design-system class |
|---|---|
| `container` | `ds-container` |
| `row` | `ds-grid ds-grid--2` (or `--3`, pick based on column count) |
| `col-*` | (removed, replaced by grid auto-placement) |
| `d-flex` | `ds-cluster` |
| `flex-column` | (use `ds-stack` instead of `ds-cluster`) |
| `align-items-center` | (default on `ds-cluster`) |
| `justify-content-center` | `style="justify-content: center;"` |
| `gap-*` | (default on ds-stack / ds-cluster; override via `--ds-stack-gap`) |
| `btn btn-*` | `ds-btn ds-btn--primary` / `ds-btn` |
| `card` + body | `ds-card` |
| `card-title` | `ds-card__title` |
| `card-body` | `ds-card__body` |
| `d-print-none` | `ds-print-hidden` |
| `d-print-flex` | `ds-print-only` |
| `py-5` | `style="padding-block: 3rem;"` |
| `mb-3`, `mb-4`, `mt-4` | `style="margin-bottom: 1rem;"` etc (margin tokens `s-3`=0.75rem, `s-4`=1rem, `s-5`=1.5rem, `s-6`=2rem) |
| `text-primary`, `text-light` | (remove — inherited from body/ds-fg) |
| `fw-*` | `style="font-weight: 600;"` or use `.ds-h1`/`.ds-h2`/etc |
| `h2`, `h3`, `h4`, `h5`, `h6` classes | `.ds-h2`, `.ds-h3` etc |
| `lead` | `ds-body-lead` |
| `pagebreak` | `ds-pagebreak` |

For pages with long content (Privacy, Legal), wrap the whole thing in a `<section class="ds-chapter">` with a `ds-chapter__heading` block. Use `.ds-container` for constraining width.

- [ ] **Step 3: Verify build and visually check Privacy + Legal**

```bash
cd /Users/andrestalavera/Repos/ideastudio
dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj
dotnet run --project IdeaStudio.Website/IdeaStudio.Website.csproj
```

Navigate to `/privacy` and `/legal`. Expected: both pages render with dark theme, readable typography, no layout break.

- [ ] **Step 4: Commit**

```bash
git add IdeaStudio.Website/Pages/Privacy.razor IdeaStudio.Website/Pages/Legal.razor IdeaStudio.Website/Components/Heading.razor IdeaStudio.Website/Components/Loading.razor IdeaStudio.Website/Components/Placeholder.razor
git commit -m "Migrate Privacy, Legal, and small components to design system

Remaining Bootstrap class usages replaced by ds- equivalents. Content
structure preserved; only class names change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 19: Remove Bootstrap

**Files:**
- Modify: `IdeaStudio.Website/package.json`
- Modify: `IdeaStudio.Website/wwwroot/scss/styles.scss`
- Modify: `IdeaStudio.Website/wwwroot/index.html` (if Bootstrap JS is loaded there)

- [ ] **Step 1: Check for remaining Bootstrap class usages in Razor files**

```bash
cd /Users/andrestalavera/Repos/ideastudio
grep -rE 'class="[^"]*\b(row|col-|btn-(primary|secondary|light|dark)|card-body|card-title|navbar|d-flex|d-print|container\b|text-primary|lead)\b' IdeaStudio.Website/Components/ IdeaStudio.Website/Pages/ IdeaStudio.Website/MainLayout.razor
```

Expected: no output. **If any matches are found, fix them before proceeding** — go back to the relevant component task above and add a follow-up change.

Also look for `data-bs-*` attributes that Bootstrap's JavaScript reads:

```bash
grep -rE 'data-bs-' IdeaStudio.Website/Components/ IdeaStudio.Website/Pages/ IdeaStudio.Website/MainLayout.razor
```

These attributes are safe to leave — they're inert without Bootstrap JS. But if any of them drive behaviour we still need (e.g., `data-bs-spy="scroll"`), flag them. For this plan: they are decorative/inherited from the old design; their removal happens in Phase 2 when we replace scroll-spy with the cinema engine. **Leave them in place.**

- [ ] **Step 2: Remove Bootstrap imports from `styles.scss`**

Overwrite `IdeaStudio.Website/wwwroot/scss/styles.scss` with the final version (Bootstrap block removed):

```scss
// ============================================================
// IdeaStud.io — styles entry
// Dark cinema-atmospheric design system (Phase 1 complete).
// ============================================================

@use 'base/reset';
@use 'base/root';
@use 'base/typography';

@use 'utilities/responsive';
@use 'utilities/stack';
@use 'utilities/visually-hidden';
@use 'utilities/print';

@use 'patterns/button';
@use 'patterns/card';
@use 'patterns/chapter';
@use 'patterns/navbar';
@use 'patterns/footer';
```

- [ ] **Step 3: Check index.html for Bootstrap JS**

```bash
grep -n "bootstrap" IdeaStudio.Website/wwwroot/index.html
```

If Bootstrap JS is imported as a `<script>` tag, remove it. The integration tests and current code don't depend on Bootstrap JS for the migrated components.

- [ ] **Step 4: Remove Bootstrap from `package.json`**

```bash
cd IdeaStudio.Website
npm uninstall bootstrap
```

- [ ] **Step 5: Rebuild and verify**

```bash
cd /Users/andrestalavera/Repos/ideastudio
dotnet build IdeaStudio.Website/IdeaStudio.Website.csproj
```

Expected: build succeeds, zero warnings, zero Sass compile errors.

```bash
ls IdeaStudio.Website/wwwroot/css/styles.min.css
wc -c IdeaStudio.Website/wwwroot/css/styles.min.css
```

Expected: the CSS file exists and is dramatically smaller than before (roughly 10–20 KB instead of ~200 KB).

- [ ] **Step 6: Run integration tests**

```bash
dotnet test IdeaStudio.sln 2>&1 | tail -20
```

Expected: no test regressions. (Tests were [SKIP] before the migration; they should still be [SKIP] — removal of Bootstrap must not introduce failures.)

- [ ] **Step 7: Start dev server and manually verify every page**

```bash
dotnet run --project IdeaStudio.Website/IdeaStudio.Website.csproj
```

Navigate to:
- `/` (hero, about, experiences, trainings, contact)
- `/privacy`
- `/legal`

In both `en` and `fr` cultures (use the language selector). Expected: every page renders, no console errors, no broken layouts, dark cinema-atmospheric look throughout.

- [ ] **Step 8: Commit**

```bash
git add IdeaStudio.Website/package.json IdeaStudio.Website/package-lock.json IdeaStudio.Website/wwwroot/scss/styles.scss
git commit -m "Remove Bootstrap dependency

Phase 1 complete — all components use the custom design system. Bootstrap
npm package uninstalled, all @import statements removed from styles.scss.
CSS bundle shrinks from ~200KB to ~15KB.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 20: Final verification

**Files:** none created or modified.

- [ ] **Step 1: Full grep sweep for Bootstrap residue**

```bash
cd /Users/andrestalavera/Repos/ideastudio
grep -rE '\bbootstrap\b' IdeaStudio.Website/ --include="*.razor" --include="*.cs" --include="*.scss" --include="*.json" --include="*.html"
```

Expected: no matches. Any match must be investigated — could be a comment or an unrelated match.

- [ ] **Step 2: Grep for legacy Bootstrap classes**

```bash
grep -rE 'class="[^"]*\b(row|col-|btn-(primary|secondary|light|dark|outline)|navbar-(expand|dark|toggle|brand|nav|collapse)|card-(body|title|img|text|footer)|d-(flex|inline|none|block|lg-|md-|print-)|text-(primary|secondary|light|dark|white|muted)|bg-(primary|secondary|light|dark|white|acrylic|opacity)|fw-(light|normal|bold|semibold)|lead\b)' IdeaStudio.Website/
```

Expected: no matches.

- [ ] **Step 3: Verify final CSS bundle size**

```bash
cd IdeaStudio.Website
npm run compile-styles
wc -c wwwroot/css/styles.min.css
```

Expected: ≤ 40 KB (per the spec's budget).

- [ ] **Step 4: Run the solution build and tests**

```bash
cd /Users/andrestalavera/Repos/ideastudio
dotnet build IdeaStudio.sln 2>&1 | tail -5
dotnet test IdeaStudio.sln 2>&1 | tail -10
```

Expected: both succeed, zero warnings.

- [ ] **Step 5: Run a Lighthouse audit (manual)**

With the dev server running, open Chrome DevTools → Lighthouse → generate report for `/`. Expected thresholds (allow slight variance — these are informational, not strict gates):

| Metric | Minimum |
|---|---|
| Performance | ≥ 85 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | 100 |

Record the actual scores in the PR description.

- [ ] **Step 6: Verify print view**

With the dev server running, open `/` and Cmd+P (or Ctrl+P) to open the print preview. Expected: `.ds-print-hidden` elements (navbar, social buttons, footer) are absent. Content is readable in black-on-white.

- [ ] **Step 7: Verify the fr locale**

Toggle the language to French via the CultureSelector. Expected: every section updates (headings, kickers, buttons, social labels), layout unchanged.

- [ ] **Step 8: Tag the migration as complete**

```bash
cd /Users/andrestalavera/Repos/ideastudio
git tag phase1-design-system-complete
```

Phase 1 is done. Phase 2 (cinema engine, chapters, pinned scroll) is authored as a separate plan, informed by the actual state of the repo after this migration.

---

## Self-review

Running the checks specified by the writing-plans skill against this plan.

**Spec coverage:** The spec's "Migration step 1 — Design system SCSS" is covered by Tasks 1–19. The spec's "SCSS structure" is covered exactly by Tasks 2–10 (tokens, base, utilities, patterns). Fonts (Inter + JetBrains Mono, self-hosted) are covered by Task 1. Dark-theme default is covered by Task 3 (`:root` vars). Bootstrap removal is covered by Task 19. No spec requirement from Phase 1 is missing.

**Placeholder scan:** All SCSS is written out fully. Razor components are shown with complete before/after markup. Task 18 uses a translation table (not "similar to Task N") and provides an explicit grep-based verification — the engineer has the rules to apply it mechanically. Task 19's console-output expectations are explicit.

**Type consistency:** Design-system class names are consistent across all tasks (`ds-btn`, `ds-card`, `ds-grid--3`, `ds-chapter__heading`, `ds-cluster--tight`, etc.). CSS custom properties are consistent (`--ds-bg`, `--ds-azure`, `--ds-teal`). No drift between task definitions.

The plan is ready for execution.
