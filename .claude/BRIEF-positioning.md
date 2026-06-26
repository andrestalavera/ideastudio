# Positioning & Messaging Brief — IdeaStudio (2026-06-26)

Owner directive: **more marketing, more visible, Home simpler, ALL pages less
technical — EXCEPT the CV/Resume which stays 100% technical.** JSON data files may
be reorganised. Bilingual FR/EN parity is mandatory.

## Audience shift
Write for the **buyer**, not the CTO: founders, product owners, SME/SMB leaders,
agencies who need software built and shipped. They care about **outcomes, risk
removed, time-to-market, cost clarity, trust** — not stacks, service names, or
architecture patterns. Assume they cannot tell Service Bus from Event Grid and
don't want to.

## Voice
- Benefit-led, plain language, concrete. Lead with the result for the client,
  then (lightly) how. Short sentences. Confident, warm, not salesy.
- **Strip jargon** from all public copy: no "événementielle / Service Bus / Event
  Grid / Cosmos DB / CI/CD / observabilité / Managed Identity / multi-tenant /
  refactoring" in headlines or summaries. If a tech word is unavoidable, gloss it
  in business terms. Tech tags (chips like ".NET", "Azure") may stay as small
  metadata, not as prose.
- Every page answers: *What do I get? Why him? What do I do next?* One clear
  primary CTA per page.

## Per-area direction
- **Home** — simplest page. Fewer sections, tighter. One sharp value proposition
  above the fold, one primary CTA, then proof (logos/testimonials), a couple of
  outcome-framed projects, services as plain "how I help" bullets, and a closing
  CTA. Cut anything technical or redundant. Make the promise + CTA unmissable.
- **Services** — frame each as a client problem solved and the outcome delivered;
  turn the technical `highlights` into "what you get" benefits; keep `useCases`
  but in business language. Pricing coherent (training/AI concrete day rate;
  consulting/tech-lead "on request"); keep the "from 600 €" floor honest.
- **Realisations / Case studies** — lead each outcome with a **business result**
  (launched in N months, enabled X, saved Y, replaced Z), then a light technical
  footnote. De-jargon the summary/challenge prose. Keep `technologies` chips.
- **Trainings** — sell the transformation for the team/learner (what they'll be
  able to do after), not the syllabus jargon.
- **About** — human, credible, plain. Why him, the through-line, the values. Light.
- **FAQ / Contact** — reassuring, plain, conversion-oriented; answer buyer
  objections (price, process, timeline, remote, data location).
- **CV / Resume — OPPOSITE: 100% technical.** Full depth: stacks, architectures,
  cloud services, methodologies, metrics, responsibilities. This is the single
  home for engineering detail. Make it richer/more precise, not less.

## Marketing & visibility
- Strong, consistent CTAs (primary = book a call; secondary = describe my project
  → /contact). Surface proof early. Keep titles/descriptions keyword-rich (the
  per-route prerender shells + SeoHead already exist — don't break them).

## HARD CONSTRAINTS (do not break the build/tests)
- **Never change**: `slug` values, `iconId` values, route `@page` templates, JSON
  array shapes/field names. Tests (SlugTranslator, RealisationFilter, LocalizedRoute,
  Integration) and the FR↔EN culture switch depend on slugs + iconId.
- Don't introduce hardcoded `/fr` or `/en` URLs (HardcodedPathsTests greps for them) —
  use `ILocalizedRoute`.
- Preserve Contact.razor's validation/a11y logic (`ContactFormModel`, error summary,
  focus-on-invalid) — change visible copy only.
- Keep FR and EN in sync (same items, same structure, translated).
- Valid JSON. Run `dotnet build` after edits; keep it green. No commits.
