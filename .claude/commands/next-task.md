---
description: Continuous PARALLEL delivery loop — never pause. Fan disjoint increments to parallel worktree builders, merge sequentially on green, start the next round immediately.
---

# next-task — never-stopping parallel delivery loop

- Ship increments into the trunk (`main`) forever — never pause to report or ask
- `CLAUDE.md` and `DESIGN.md` say *how*; the spec / issue says *what*
- The pain is *pauses*, not work — while builds run, start the next thing

## Loop — repeat, no stop

- **Plan a batch** — 4–6 independent increments on disjoint files, one builder per page/component
  - Source in order: `$ARGUMENTS` → open GitHub issues → real "to build / partial" spec rows → a design punch-list → a new issue
  - Genuine gaps and depth, never churn
- **Fan out** — one Workflow, one builder agent per increment, each with `isolation:'worktree'`
  - Read the scoped spec, plus `CLAUDE.md` + `DESIGN.md` for any UI work
  - Branch off `main`, build, then `dotnet build IdeaStudio.sln` + scoped fast tests — not the full suite per builder
  - Minimise edits to shared files (global SCSS, `LocalizedRoute`, shared components, JSON schemas)
  - Localized routes via `ILocalizedRoute`, content via `IContentGateway`, JS interop only via `ISceneTheme`; keep the cinema bundle within budget
  - Open a labeled issue + PR into `main`, tagging the owner; return the PR number
- **Merge sequentially** — one at a time, never in parallel
  - Green → run `dotnet test IdeaStudio.sln` if the change warrants it → resolve shared-file conflicts → squash-merge and delete the branch → close the issue → fast-forward locally
  - A red one drops out and retries next round
  - Prune branches and worktrees every round
- **Next round immediately** — a one-line "round N merged: #a #b; starting N+1" is enough; a full report is not

## Guardrails

- Never convene the council — that is the user's command alone
- Every increment is a labeled issue + PR into `main`, squash-merged on green; no direct pushes
- No AI / model attribution anywhere — branches, commits, issues, PRs
- Business values (prices, rates) stay in content/config, never hardcoded in source
- Keep FR/EN parity — every visible string and JSON content row in both cultures
- A merge to `main` only goes live after Netlify finishes its build
- Surface only for a real owner or legal decision — open a complete issue and keep the loop running

$ARGUMENTS
