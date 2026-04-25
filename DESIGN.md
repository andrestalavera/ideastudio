# Design System: IdeaStudio (V3 — Techno-Iridescent)

> Source of truth for prompting screen generators (Stitch, etc.) and for any
> agent producing UI for this codebase. Mirrors and supersedes the runtime
> tokens in `IdeaStudio.Website/wwwroot/scss/tokens/`. When a screen is
> generated, it must collapse to these tokens — never invent new colors,
> typefaces, or easings.

---

## Configuration — Style Dials

| Dial | Level | Notes |
|------|-------|-------|
| **Creativity** | `9` | Signature hero, per-char reveal, inline WebGL cinema stage. Editorial register. |
| **Density** | `4` | Gallery-airy. Chapter padding `clamp(7rem, 14vw, 14rem)`. Whitespace is a feature. |
| **Variance** | `8` | Asymmetric splits. Centered hero is BANNED. |
| **Motion Intent** | `9` | Cinematic. Hardware-accelerated transforms only. WebGL cinema stage owned by `MainLayout`. |

---

## 1. Visual Theme & Atmosphere
A deep, techno-iridescent dark interface — the opposite of the canvas-white default. The mood is *late-night studio meets oscilloscope*: matte off-black surfaces, AAA-contrast text, single-stroke iridescent accents that read as light, not paint. Layouts are airy and asymmetric; type is large, tracked tight, and rendered with a variable axis. Motion is cinematic but selective — one signature gesture per chapter, not perpetual fidget.

The design ethos: **expensive, intentional, alive.** Every element earns its place. Decoration is reserved for the iridescent gradient, which is a single shared object used by both SCSS (CTA borders, text-clip accents, thin rules) and the WebGL `CinemaStage` (mesh + thread pass), sampled via CSS custom properties.

## 2. Color Palette & Roles

**Surfaces (dark-first — light mode is not a target):**
- **Void** (`#020a0d`) — Far body, under the WebGL canvas. Effectively off-black; pure `#000` is BANNED.
- **Deep** (`#05161a`) — Primary page background.
- **Surface** (`#0a2328`) — Masthead pill, chapter bands.
- **Raised** (`#0e2d33`) — Cards, stat chips.

**Foreground:**
- **FG** (`#eaf4f2`) — Primary text on Deep. AAA contrast.
- **FG Muted** (`#a8bfbb`) — Captions, meta, body copy. AA on Deep.
- **FG Faint** (`#5e7a77`) — Decorative only. Never body copy.

**Iridescent Accents — used as a single gradient, not four free colors:**
- **Duck** (`#00c2d4`) — Primary brand, CTA, focus ring, rail. Default accent in isolation.
- **Blue** (`#2d44ff`) — Secondary stop in the gradient.
- **Amber** (`#ff8c1a`) — Tertiary stop.
- **Pink** (`#ff3670`) — Closing stop.

These four are members of `$gradient-iridescent` (a 140°-rotated conic). They appear together inside that gradient — in CTA borders, text-clip accents, hairlines, and the WebGL shader. They do **not** appear as independent button fills, badge backgrounds, or status colors. Outside the gradient, the only accent is **Duck**.

**Derived:**
- **Rule** (`rgba(234,244,242,0.08)`) — Hairlines, dividers.
- **Ring** (`rgba(0,194,212,0.6)`) — Focus rings.
- **Glass** (`rgba(234,244,242,0.06)`) — Frosted glass overlays.

### Deliberate divergence from the skill template
- The template's "max 1 accent at <80% saturation" rule is overridden: the iridescent gradient *is* the brand. The discipline is preserved by gating the four colors behind a single shared gradient — they never appear as standalone fills.
- The template's "Canvas White" base is rejected: this product is dark-first.

### Banned
- Pure black (`#000000`) — use Void.
- AI Purple/Violet neon gradients.
- Standalone use of Blue / Amber / Pink outside the iridescent gradient.
- Mixed warm/cool gray systems.

## 3. Typography Rules

- **Sans:** `Inter` (variable, weights 100–900), self-hosted at `/fonts/inter-variable.woff2`. Used for display and body. The skill's general ban on Inter is **explicitly overridden here**: Inter Variable was chosen and committed deliberately for the per-char reveal hero on `version-3`. If a future project replaces it, the candidates are `Geist`, `Satoshi`, `Cabinet Grotesk`, or `Outfit`.
- **Mono:** `JetBrains Mono` (variable, 400–800), self-hosted at `/fonts/jetbrains-mono.woff2`. Used for code, kickers, metadata, timestamps.
- **Serif:** None. Direction is sans-grotesk. Generic serifs (`Times New Roman`, `Georgia`, `Garamond`, `Palatino`) are BANNED. If editorial serif is ever needed, only `Fraunces`, `Instrument Serif`, `Editorial New`, or `Gambarino` are acceptable.

**Fluid scale (from `tokens/_type.scss` — do not deviate):**
- Display (signature hero, once per page): `clamp(4rem, 11vw, 10.5rem)`, weight 600, leading 0.95, tracking -0.05em.
- Hero (other page heroes): `clamp(3rem, 7vw, 6rem)`.
- Title (chapter): `clamp(2rem, 4.5vw, 3.6rem)`, leading 1.05, tracking -0.03em, weight 600.
- Subtitle: `clamp(1.25rem, 2vw, 1.75rem)`.
- Lead: `clamp(1.125rem, 1.4vw, 1.3rem)`.
- Body: `1rem`, weight 400, leading 1.6, max-width 68ch.
- Small: `0.875rem`.
- Mono: `0.8125rem`, uppercase kicker tracking `0.28em`.

**Strong** is weight 500 — never bolder. Weight-driven hierarchy beats size-driven hierarchy.

## 4. Component Stylings

- **Buttons:** Flat. Primary uses iridescent gradient as a 1px border with Deep fill — never a solid neon background. Secondary is ghost with Rule border. Active state: `-1px translateY` for tactile push. Hover: subtle FG shift, no outer glow. Focus: Ring (`rgba(0,194,212,0.6)`) at 2px offset.
- **Cards:** Raised surface (`#0e2d33`). Rounded corners around `1.5rem`–`2rem` (match existing `_card.scss`; do not invent new radii). Internal padding from `$s-5`–`$s-6`. Used only when elevation communicates hierarchy. In dense regions, replace cards with a top hairline (`Rule`) and negative space.
- **Hairlines / Dividers:** `1px` `Rule` (`rgba(234,244,242,0.08)`). For emphasis, a 1px iridescent gradient line — used sparingly, once per chapter.
- **Inputs/Forms:** Label above input. Helper below in FG Muted. Error in `Pink` (this is the one sanctioned standalone use of a non-Duck accent — error state only). Focus ring in Duck. No floating labels.
- **Loaders:** Skeletal placeholders matching the exact layout shape — never circular spinners. The `Loading.razor` and `Placeholder.razor` components are the canonical primitives.
- **Empty States:** Composed text + icon composition with a single suggested action. Never bare "No data found".
- **Kickers:** Uppercase mono, `0.28em` tracked, FG Muted. The signature label voice — see `_kicker.scss`.
- **Tags / Stat chips:** Raised surface, mono small, no fill color beyond surface.

## 5. Hero Section

The hero on the home page is the primary brand expression. Other pages get a smaller hero scale (`$fs-hero`) but follow the same structural rules.

- **Per-char reveal:** Display text mounts via `RevealChars` with cascaded delays. Exit animation symmetric to entrance (recently added — see commit `42fce8a`).
- **CinemaStage:** WebGL canvas owned by `MainLayout`. Per-page scenes declared with `<PageScene Name="…" />` — a page never owns its own canvas. The vertical thread pass was removed (`0187d95`); do not reintroduce it.
- **No filler chrome:** "Scroll to explore", "Swipe down", scroll arrows, bouncing chevrons — BANNED. Content pulls users in.
- **No overlap:** Display text and the CinemaStage occupy distinct compositional zones. The canvas may sit behind text at low opacity, but text never overlaps a foreground image.
- **Asymmetric structure:** Centered hero is BANNED at this variance level. Use Split, Left-aligned text / Right visual, or Asymmetric Whitespace.
- **CTA restraint:** One primary CTA maximum. No secondary "Learn more" link.
- **Inline image typography:** Reserved for editorial chapters, not the signature hero — the signature is type + WebGL only.

## 6. Layout Principles

- **Containers:** Three widths from `tokens/_space.scss`: `$container-narrow` (720px) for prose, `$container` (1200px) default, `$container-wide` (1440px) for editorial spreads. Never invent intermediate widths.
- **Section rhythm:** `$py-section` (`clamp(5rem, 10vw, 9rem)`) for normal sections. `$py-chapter` (`clamp(7rem, 14vw, 14rem)`) for chapter breaks.
- **Grid-first:** CSS Grid for structural layouts. Container queries preferred over media queries; media queries only at the page frame level.
- **No 3-equal-cards:** The "three identical cards in a row" feature pattern is BANNED. Use 2-column zig-zag, asymmetric bento (e.g., 2fr 1fr 1fr), or horizontal scroll.
- **No overlapping content:** Every element occupies its own grid cell or flow position. The CinemaStage canvas is the only sanctioned background layer; foreground content does not stack on top of foreground content.
- **No `calc()` percentage hacks:** `calc(33% - 1rem)` is BANNED. Use Grid `fr` units or `auto-fit`.
- **Full-height:** `min-height: 100dvh` always. `100vh` is BANNED (iOS Safari address-bar jump).

## 7. Responsive Rules

Every screen must work at `375px`, `768px`, and `1440px`. Responsive is not optional.

- **Breakpoints:** `$bp-s` 24rem, `$bp-m` 40rem, `$bp-l` 64rem, `$bp-xl` 90rem.
- **Mobile collapse (< $bp-l):** All multi-column layouts collapse to single column with `gap: $s-5`.
- **No horizontal scroll:** Critical failure if any element overflows viewport width.
- **Type scaling:** Already fluid via `clamp()` in tokens. Body never below `1rem`.
- **Touch targets:** Minimum 44px tap target. Buttons full-width on mobile.
- **Hero on mobile:** Display drops to its `clamp()` floor. CinemaStage scales proportionally; no parallax / mouse-tracked effects on touch.
- **Navigation:** Desktop horizontal nav collapses to a clean overlay. No tiny hamburger without label.
- **Section gaps:** Fluid `clamp` already proportional. Never cramped, never excessive.

## 8. Motion & Interaction

Motion tokens come from `tokens/_motion.scss` — do not invent new easings or durations.

**Easings:**
- `$ease-out` (`cubic-bezier(0.2, 0.8, 0.2, 1)`) — UI exits, default.
- `$ease-in` (`cubic-bezier(0.8, 0.0, 1.0, 0.2)`) — entering elements.
- `$ease-smooth` (`cubic-bezier(0.4, 0.0, 0.2, 1)`) — general transitions.
- `$ease-bounce` (`cubic-bezier(0.34, 1.56, 0.64, 1)`) — rare and playful only.

**Durations:**
- `$t-quick` 150ms — hover, focus ring.
- `$t-medium` 320ms — fade/slide reveals.
- `$t-slow` 640ms — card entrance, chapter reveal.
- `$t-grand` 1200ms — hero morph, thread unfurl (sparingly).

**Rules:**
- **MotionReveal everywhere:** Scroll-triggered content uses `<MotionReveal Kind="…" />`. Lists cascade via stagger; never mount instantly.
- **CinemaStage owns WebGL:** Per-page scenes declare with `<PageScene Name="…" />`. Pages never own their own canvases.
- **Hardware-accelerated only:** Animate `transform` and `opacity`. Never `top`, `left`, `width`, `height`. Grain/noise filters live on fixed `pointer-events: none` pseudo-elements.
- **`prefers-reduced-motion`:** Required. Reveal animations collapse to instant; CinemaStage gestures hold static; only opacity remains.
- **Selective, not perpetual:** Unlike the template's "every active component has an infinite micro-loop", this product reserves perpetual animation for the CinemaStage. Buttons, cards, and inputs respond on interaction, not idle.

### Deliberate divergence from the skill template
- "Spring physics for everything (`stiffness: 100, damping: 20`)" is overridden in favor of the four named cubic-beziers above. Spring physics are not used in V3.
- "Perpetual micro-interactions on every active component" is overridden — perpetual motion is owned by CinemaStage and would compete with it elsewhere.

## 9. Anti-Patterns (Banned)

- **Emojis** — anywhere in UI, code, or content.
- **Pure black** (`#000000`) — use Void (`#020a0d`).
- **`Inter` substitutes** — Inter is the chosen sans here. Do not silently swap to Geist/Satoshi without an explicit project decision.
- **Generic serifs** — Times New Roman, Georgia, Garamond, Palatino. If editorial serif is ever needed, distinctive modern serifs only.
- **Standalone Blue / Amber / Pink** — these only exist inside the iridescent gradient. Pink-as-error is the single sanctioned exception.
- **Outer neon glows** — `box-shadow` glows are BANNED. Borders, hairlines, and the gradient carry brightness.
- **Excessive gradient text on large headers** — gradient text is reserved for accent moments, never the signature hero.
- **Custom mouse cursors** — banned.
- **Overlapping content layers** — CinemaStage is the only background layer.
- **3-column equal card layouts** — banned for features.
- **Centered hero** — banned at variance 8.
- **Filler UI text** — "Scroll to explore", "Swipe down", "Discover more below", scroll arrows, bouncing chevrons.
- **Generic placeholder names** — "John Doe", "Sarah Chan", "Acme", "Nexus", "SmartFlow".
- **Fake round numbers** — `99.99%`, `50%`, `1234567`. If real data is unavailable, use `[metric]` placeholders. No "99.98% UPTIME", "124ms RESPONSE", "18.5k DEPLOYS" filler.
- **Fake metric sections** — "SYSTEM PERFORMANCE METRICS", "BY THE NUMBERS" cards filled with invented data.
- **`LABEL // YEAR` formatting** — "SYSTEM // 2024" is a lazy AI convention, not real typography.
- **AI copywriting clichés** — "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize".
- **Broken image links** — use `picsum.photos/seed/{id}/w/h` for placeholders, or in-repo SVG.
- **`h-screen` / `100vh`** — always `min-h-[100dvh]`.
- **Circular spinners** — skeletal shimmer only.
- **`z-index` spam** — reserved for Navbar, Modal, Overlay layers only.
- **Inventing tokens** — every color, font, easing, and duration must come from `wwwroot/scss/tokens/`. Generated screens that introduce new values are wrong.

---

## Mapping to the codebase

| DESIGN.md concept | Source of truth |
|---|---|
| Colors | `IdeaStudio.Website/wwwroot/scss/tokens/_colors.scss` |
| Typography | `IdeaStudio.Website/wwwroot/scss/tokens/_type.scss` + `base/_typography.scss` |
| Motion | `IdeaStudio.Website/wwwroot/scss/tokens/_motion.scss` |
| Spacing & breakpoints | `IdeaStudio.Website/wwwroot/scss/tokens/_space.scss` |
| Hero / RevealChars | `IdeaStudio.Website/Components/HeroSection.razor` + `_signature.scss` |
| MotionReveal | `IdeaStudio.Website/Components/` (see `MotionReveal`) |
| CinemaStage / PageScene | `MainLayout.razor` (canvas owner) + `Services/ICinemaEngine.cs` |

If any of these source files change, this document is stale.
