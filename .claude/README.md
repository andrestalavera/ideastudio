# IdeaStudio advisory council

- The agent + command set that reviews changes to **IdeaStudio** before they ship
- 13 named subagents ("seats") across direction, engineering, and cross-functional craft
- Two commands put them to work: `/council` challenges a proposal before it is built; `/next-task` runs a continuous parallel delivery loop
- The seats are role-based and product-agnostic; only the context is IdeaStudio

## Product context

- Editorial portfolio of **Andrés Talavera** — independent .NET & Azure consultant, techlead, trainer (Lyon / remote)
- **Blazor WebAssembly (.NET 10)**, AOT-compiled in Release
- Custom SCSS design system (Techno-Iridescent V3, dark-first, utilities-first, no BEM) + a small esbuild/GSAP "cinema" JS bundle
- Fully bilingual FR/EN — per-culture routes and JSON content
- No backend, no auth, no database — content is JSON-backed under `wwwroot/data/`
- Static hosting: Netlify live, Fly.io staged; résumé-PDF via a Netlify function
- Brasa Geneva is a featured project inside the portfolio, not a business the council serves
- The bar: fast, accessible, distinctive, trustworthy, well-crafted

## Why a council, not one agent

- One agent optimising for "ship it" trades away architecture, security, and craft under pressure
- The council forces those trade-offs into the open — each seat has a narrow mandate, a stated authority, and for a few a binding veto
- Nobody, including the orchestrator, can quietly skip security, quality, or acceptance

## Seats

| Seat | Role | Binding authority |
|---|---|---|
| `alex` | Product Owner | Scope, MVP boundary, accept/reject |
| `lucas` | Business/Requirements Analyst | The documented functional rules |
| `maya` | Marketing & growth | Positioning, conversion, SEO/AEO/GEO |
| `loic` | Comms & compliance counsel | Verdict on public-facing artefacts (GDPR/RGPD, claims, IP) |
| `elena` | .NET architect | App architecture, service layering, DI |
| `theo` | Frontend architect | Render/build, JS interop, CWV, design-system fidelity |
| `omar` | Platform | Build pipeline, hosting, headers/CSP, bundle budget, deploy path |
| `ravi` | Security engineer | **BLOCK** on anything security-sensitive |
| `nadia` | Data/content advisor | JSON content schema, i18n parity (advisory — no DB) |
| `yuki` | QA | **BLOCK** on failed acceptance |
| `vera` | Code reviewer | **BLOCK** (REQUEST CHANGES) on convention/quality |
| `aiko` | UX / design | Soft veto on experience-quality regressions |
| `yann` | Delivery lead | Sequencing, priority, the critical path |

- Full mandate, scrutiny checklist, and non-negotiables for each seat live in its own file under `agents/`
- Vision, brand, and pricing direction rests with the owner — no dedicated seat holds it

## Task agents (outside the council)

- `code-reviewer` — build/test + convention checklist for a diff
- `frontend-implementer` — Blazor WASM implementation following the project conventions

## Commands

- **`/council <proposal>`** — convenes the relevant seats to challenge a proposal before implementation
  - Each seat returns a verdict (`APPROVE` / `CONCERN` / `BLOCK`), reasoning, and concrete recommendations
  - Closes with a **Council Verdict** and yann's prioritised next steps
- **`/next-task [scope]`** — a non-stop delivery loop
  - Plans a batch of independent increments, fans them to parallel worktree builders, merges sequentially on green, starts the next round
  - Never convenes the council — that stays an explicit, separate call

## Standing conventions the council enforces

- Spec → failing test → implementation → refactor; no production code before an agreed spec and a red test
- Conventions in `CLAUDE.md` / `DESIGN.md`: utilities-first CSS (no BEM), localized routes via `ILocalizedRoute`, content via `IContentGateway`, JS interop only through `ISceneTheme`
- Keep the cinema bundle within its gzipped budget
- FR/EN parity — every visible string and JSON content row in both cultures
- Business values (prices, rates) live in content/config, never hardcoded in source
- Trunk-based git: branch `feature|fix|chore/<slug>`, one issue per commit, PR tagging the owner only, squash-merged on green; never push to the trunk
- No AI / model attribution anywhere — branches, commits, issues, PRs, reports
- Verify with `dotnet build IdeaStudio.sln` + `dotnet test IdeaStudio.sln` before declaring done

## Authority model

- **andrestalavera** is the ultimate authority and the only human tagged on PRs; any contested gate escalates to him
- Binding BLOCKs: `ravi` (security), `vera` (quality), `yuki` (failed acceptance)
- Lane owners sign off their own domain: `elena` (architecture), `theo` (frontend), `omar` (platform)
- A proposal cannot proceed while any binding BLOCK is unresolved
