# Content Revision V3.1 — Design Spec

**Date** : 2026-04-25
**Status** : Draft, awaiting user review
**Implementation strategy** : Single PR, three internal commits (Approach 1)

---

## 1. Goal & Context

Enrich the IdeaStud.io editorial content to reflect:

- New geographic positioning (Lyon · Paris · Geneva · Fribourg + remote, with Swiss cross-border setup).
- An expanded skill surface around vibe coding, on-premise AI, MCP servers, multi-platform analytics, AI-readable site configuration.
- A formal training catalogue (~20 modules) extracted to its own first-class data structure.
- A FAQ on the home page that goes from 3 placeholder questions to 11 substantive Q&A, eligible for `FAQPage` rich snippets.

The content overhaul lands as a **single Pull Request** branching from `main` (currently `ec63c3b Version 3 (#38)`), structured internally as three logical commits.

## 2. Architecture (data layer)

### New JSON files under `wwwroot/data/`

| File | Source | Purpose |
| --- | --- | --- |
| `trainings-fr.json` | new | Catalogue of 20 training modules (FR) |
| `trainings-en.json` | new | Catalogue of 20 training modules (EN, parity with FR) |
| `training-centers-fr.json` | extracted from `resume-fr.json` | List of schools / training centers where Andrés has taught |
| `training-centers-en.json` | extracted from `resume-en.json` | EN counterpart |

### Model changes

New record `Models/Training.cs`:

```csharp
public sealed class Training
{
    public required string Slug { get; init; }
    public required string Title { get; init; }
    public required string Summary { get; init; }
    public required string Category { get; init; }       // ".NET" | "Azure" | "Vibe coding & IA" | "Architecture & DevOps"
    public required IReadOnlyList<string> Outline { get; init; }
    public string? Prerequisites { get; init; }
    public int? DurationDays { get; init; }
    public string? Level { get; init; }                  // "foundation" | "intermediate" | "advanced"
    public string? Audience { get; init; }
    public string? Certification { get; init; }
}
```

`Models/Resume.cs` loses its `TrainingCenters` property.

### Gateway

`Services/IContentGateway.cs` adds:

```csharp
Task<IReadOnlyList<Training>> GetTrainingsAsync(string culture);
Task<IReadOnlyList<TrainingCenter>> GetTrainingCentersAsync(string culture);
```

`JsonContentGateway` follows the existing pattern: `ILazyLoadingService` wraps the HTTP fetch with cache.

### Consumer updates

- `Pages/Home.razor` switches from `resume?.TrainingCenters` to `Content.GetTrainingCentersAsync(culture)`.
- `Pages/Cv.razor` does the same.

## 3. Trainings catalogue (Section 2/7)

### Distribution

| Category | Count |
| --- | --- |
| .NET (.NET 10) | 6 |
| Azure (developer-oriented) | 5 |
| Vibe coding & IA | 4 |
| Architecture & DevOps | 5 |
| **Total** | **20** |

### Module list (full content drafted below)

Each module appears in `trainings-fr.json` and `trainings-en.json` with field parity.

#### Category — .NET

##### 1. `csharp-modern`
- **FR title** : C# moderne (records, source generators, pattern matching)
- **EN title** : Modern C# (records, source generators, pattern matching)
- **FR summary** : Maîtriser les fonctionnalités modernes de C# pour écrire du code expressif et performant : records, primary constructors, file-scoped types, source generators, pattern matching avancé.
- **EN summary** : Master modern C# features to write expressive, fast code: records, primary constructors, file-scoped types, source generators, advanced pattern matching.
- **Category** : .NET
- **Outline FR** : Records et types valeurs immuables · Primary constructors et init-only · File-scoped types et compilation incrémentale · Pattern matching avancé et switch expressions · Source generators — bases · Async, ValueTask et performance.
- **Outline EN** : Records and immutable value types · Primary constructors and init-only properties · File-scoped types and incremental compilation · Advanced pattern matching and switch expressions · Source generators — basics · Async, ValueTask and performance.
- **Prerequisites FR** : C# de base, lecture de code orienté objet.
- **Prerequisites EN** : Basic C#, ability to read object-oriented code.
- **Duration** : 2 days · **Level** : foundation

##### 2. `aspnet-core-fundamentals`
- **FR title** : ASP.NET Core 10 — fondamentaux
- **EN title** : ASP.NET Core 10 — fundamentals
- **FR summary** : Construire des APIs et applications web modernes avec ASP.NET Core 10 : DI, middleware, minimal APIs, EF Core, configuration, logs.
- **EN summary** : Build modern web APIs and applications with ASP.NET Core 10: DI, middleware, minimal APIs, EF Core, configuration, logging.
- **Category** : .NET
- **Outline FR** : Hôte générique et démarrage de l'app · Routing et minimal APIs · Injection de dépendances et options · Middleware pipeline · EF Core 10 — premiers contacts · Configuration et secrets utilisateurs · Logging structuré.
- **Outline EN** : Generic host and app bootstrap · Routing and minimal APIs · Dependency injection and options · Middleware pipeline · EF Core 10 — first contact · Configuration and user secrets · Structured logging.
- **Prerequisites FR** : C# moderne, notions de HTTP.
- **Prerequisites EN** : Modern C#, HTTP basics.
- **Duration** : 3 days · **Level** : intermediate

##### 3. `aspnet-core-advanced`
- **FR title** : ASP.NET Core 10 — avancé
- **EN title** : ASP.NET Core 10 — advanced
- **FR summary** : Pousser ASP.NET Core en production : authentification & autorisation, observabilité OpenTelemetry, performance, tests d'intégration robustes.
- **EN summary** : Push ASP.NET Core to production: auth & authorization, OpenTelemetry observability, performance, robust integration tests.
- **Category** : .NET
- **Outline FR** : Authentification (cookies, JWT, OIDC) · Autorisation par policies et claims · Observabilité — OpenTelemetry, logs, métriques · Performance — benchmarks, caching, response compression · Tests d'intégration avec WebApplicationFactory · Déploiement et hot-reload contrôlé.
- **Outline EN** : Authentication (cookies, JWT, OIDC) · Policy-based authorization with claims · Observability — OpenTelemetry, logs, metrics · Performance — benchmarks, caching, response compression · Integration testing with WebApplicationFactory · Deployment and controlled hot-reload.
- **Prerequisites FR** : ASP.NET Core fondamentaux ou expérience équivalente.
- **Prerequisites EN** : ASP.NET Core fundamentals or equivalent experience.
- **Duration** : 3 days · **Level** : advanced

##### 4. `blazor-modern`
- **FR title** : Blazor 10 — Server, WASM et Hybrid
- **EN title** : Blazor 10 — Server, WASM and Hybrid
- **FR summary** : Construire des SPA et applications hybrides en Blazor : composants, état, rendu côté serveur, AOT WASM, interop JS et SignalR.
- **EN summary** : Build SPAs and hybrid apps with Blazor: components, state, server rendering, WASM AOT, JS interop and SignalR.
- **Category** : .NET
- **Outline FR** : Composants, paramètres, événements · Cycle de vie et rendu · Modèles d'état (cascading, services scoped) · Blazor Server vs WASM — choix techno · Interop JS et préchargement · Compilation AOT et budget de bundle.
- **Outline EN** : Components, parameters, events · Lifecycle and rendering · State patterns (cascading, scoped services) · Blazor Server vs WASM — tech choice · JS interop and prerendering · AOT compilation and bundle budget.
- **Prerequisites FR** : C# moderne, HTML/CSS, notions JS.
- **Prerequisites EN** : Modern C#, HTML/CSS, basic JS.
- **Duration** : 3 days · **Level** : intermediate

##### 5. `ef-core-10`
- **FR title** : Entity Framework Core 10
- **EN title** : Entity Framework Core 10
- **FR summary** : Modéliser un domaine avec EF Core 10 : conventions, fluent API, migrations, requêtes optimisées, SaveChanges concurrent et performance.
- **EN summary** : Model a domain with EF Core 10: conventions, fluent API, migrations, tuned queries, concurrent SaveChanges and performance.
- **Category** : .NET
- **Outline FR** : Conventions et fluent API · Relations 1-N, N-N, héritage TPT/TPH · Migrations et déploiement · Requêtes — IQueryable, projections, split queries · Tracking, AsNoTracking, identity resolution · Performance — benchmarks et plan d'exécution.
- **Outline EN** : Conventions and fluent API · Relationships 1-N, N-N, inheritance TPT/TPH · Migrations and deployment · Queries — IQueryable, projections, split queries · Tracking, AsNoTracking, identity resolution · Performance — benchmarks and execution plan.
- **Prerequisites FR** : C# moderne, notions SQL.
- **Prerequisites EN** : Modern C#, basic SQL.
- **Duration** : 2 days · **Level** : intermediate

##### 6. `dotnet-testing`
- **FR title** : Tests automatisés .NET
- **EN title** : Automated testing in .NET
- **FR summary** : Mettre en place une stratégie de tests pragmatique : xUnit, Testcontainers, snapshot testing, tests de mutation, golden tests.
- **EN summary** : Set up a pragmatic test strategy: xUnit, Testcontainers, snapshot testing, mutation testing, golden tests.
- **Category** : .NET
- **Outline FR** : xUnit — fondamentaux et organisation · Tests d'intégration et Testcontainers · Snapshot testing avec Verify · Tests de mutation avec Stryker · Couverture et métriques utiles · TDD pragmatique — quand, comment.
- **Outline EN** : xUnit — basics and organization · Integration testing and Testcontainers · Snapshot testing with Verify · Mutation testing with Stryker · Coverage and useful metrics · Pragmatic TDD — when, how.
- **Prerequisites FR** : C# moderne, expérience d'un projet en équipe.
- **Prerequisites EN** : Modern C#, team-project experience.
- **Duration** : 2 days · **Level** : intermediate

#### Category — Azure

##### 7. `azure-az204-prep`
- **FR title** : Azure pour développeurs (préparation AZ-204)
- **EN title** : Azure for developers (AZ-204 prep)
- **FR summary** : Couvrir l'examen AZ-204 : développer des solutions Azure (App Service, Functions, Cosmos DB, Service Bus, Key Vault, Identity).
- **EN summary** : Cover the AZ-204 exam: develop Azure solutions (App Service, Functions, Cosmos DB, Service Bus, Key Vault, Identity).
- **Category** : Azure
- **Outline FR** : App Service et configuration · Azure Functions et Durable Functions · Storage et Cosmos DB · Service Bus et Event Grid · Key Vault, Managed Identity, App Configuration · Identity et Microsoft Entra ID · Préparation à l'examen — questions types.
- **Outline EN** : App Service and configuration · Azure Functions and Durable Functions · Storage and Cosmos DB · Service Bus and Event Grid · Key Vault, Managed Identity, App Configuration · Identity and Microsoft Entra ID · Exam prep — sample questions.
- **Prerequisites FR** : C# moderne, notions de cloud.
- **Prerequisites EN** : Modern C#, cloud basics.
- **Duration** : 5 days · **Level** : intermediate · **Certification** : AZ-204

##### 8. `azure-az400-prep`
- **FR title** : Azure DevOps & CI/CD (préparation AZ-400)
- **EN title** : Azure DevOps & CI/CD (AZ-400 prep)
- **FR summary** : Mettre en place une chaîne DevOps complète : stratégies de branche, pipelines CI/CD multi-stage, tests automatisés, infrastructure as code, sécurité et gouvernance.
- **EN summary** : Build a complete DevOps pipeline: branching strategies, multi-stage CI/CD, automated testing, infrastructure as code, security and governance.
- **Category** : Azure
- **Outline FR** : Source control et stratégies de branche · Azure Pipelines — multi-stage YAML · Tests automatisés dans le pipeline · Infrastructure as code (Bicep, Terraform) · Release management et environnements · Sécurité — secrets, scans, gouvernance · Préparation à l'examen — questions types.
- **Outline EN** : Source control and branching strategies · Azure Pipelines — multi-stage YAML · Automated tests in pipeline · Infrastructure as code (Bicep, Terraform) · Release management and environments · Security — secrets, scans, governance · Exam prep — sample questions.
- **Prerequisites FR** : Expérience d'un projet en équipe, notions Git, notions cloud.
- **Prerequisites EN** : Team project experience, basic Git, basic cloud.
- **Duration** : 5 days · **Level** : advanced · **Certification** : AZ-400

##### 9. `azure-functions-events`
- **FR title** : Azure Functions & event-driven
- **EN title** : Azure Functions & event-driven
- **FR summary** : Construire des architectures événementielles avec Azure Functions, Service Bus, Event Grid et Durable Functions.
- **EN summary** : Build event-driven architectures with Azure Functions, Service Bus, Event Grid and Durable Functions.
- **Category** : Azure
- **Outline FR** : Functions — bindings et triggers · Durable Functions — orchestration et entités · Service Bus — files, sujets, sessions · Event Grid — abonnements et schémas · Patterns — outbox, fan-out, retry · Observabilité et tracing distribué.
- **Outline EN** : Functions — bindings and triggers · Durable Functions — orchestration and entities · Service Bus — queues, topics, sessions · Event Grid — subscriptions and schemas · Patterns — outbox, fan-out, retry · Observability and distributed tracing.
- **Prerequisites FR** : ASP.NET Core ou Azure 204, notions d'asynchrone.
- **Prerequisites EN** : ASP.NET Core or Azure 204, async basics.
- **Duration** : 3 days · **Level** : intermediate

##### 10. `azure-app-service-containers`
- **FR title** : Azure App Service & containers
- **EN title** : Azure App Service & containers
- **FR summary** : Déployer en production sur App Service, Container Apps et ACR : slots, autoscale, networking, monitoring.
- **EN summary** : Ship to production on App Service, Container Apps and ACR: slots, autoscale, networking, monitoring.
- **Category** : Azure
- **Outline FR** : App Service — plans, configuration, slots · Container Apps — Dapr et autoscale · Azure Container Registry et signature d'images · Networking — VNet integration, Private Endpoint · Déploiement multi-env et blue/green · Monitoring — Application Insights.
- **Outline EN** : App Service — plans, configuration, slots · Container Apps — Dapr and autoscale · Azure Container Registry and image signing · Networking — VNet integration, Private Endpoint · Multi-env and blue/green deployment · Monitoring — Application Insights.
- **Prerequisites FR** : Notions Azure, expérience Docker.
- **Prerequisites EN** : Azure basics, Docker experience.
- **Duration** : 2 days · **Level** : intermediate

##### 11. `azure-security-fundamentals`
- **FR title** : Sécurité Azure pour développeurs
- **EN title** : Azure security for developers
- **FR summary** : Sécuriser une application Azure de bout en bout : Key Vault, Managed Identity, networking, Defender for Cloud, gestion des secrets et RBAC.
- **EN summary** : End-to-end security for an Azure app: Key Vault, Managed Identity, networking, Defender for Cloud, secret management and RBAC.
- **Category** : Azure
- **Outline FR** : Key Vault et rotation des secrets · Managed Identity — system & user assigned · RBAC et principes du moindre privilège · Networking sécurisé — Private Endpoint, NSG · Defender for Cloud — recommandations · Microsoft Entra ID et Conditional Access.
- **Outline EN** : Key Vault and secret rotation · Managed Identity — system & user assigned · RBAC and least privilege · Secure networking — Private Endpoint, NSG · Defender for Cloud — recommendations · Microsoft Entra ID and Conditional Access.
- **Prerequisites FR** : Notions Azure, notions de sécurité applicative.
- **Prerequisites EN** : Azure basics, app security basics.
- **Duration** : 2 days · **Level** : intermediate

#### Category — Vibe coding & IA

##### 12. `claude-code-team`
- **FR title** : Claude Code en équipe
- **EN title** : Claude Code for teams
- **FR summary** : Adopter Claude Code à l'échelle d'une équipe : skills, hooks, sub-agents, plugins, MCP, gouvernance et mesures d'impact.
- **EN summary** : Adopt Claude Code at team scale: skills, hooks, sub-agents, plugins, MCP, governance and impact measurement.
- **Category** : Vibe coding & IA
- **Outline FR** : Modèles de prompt et style maison · Skills — créer, packager, partager · Hooks PreToolUse / PostToolUse / Stop · Sub-agents et délégation · Intégration MCP — outils internes · Garde-fous CI et politique d'usage · Mesure d'impact — vélocité, qualité.
- **Outline EN** : Prompt patterns and house style · Skills — create, package, share · Hooks PreToolUse / PostToolUse / Stop · Sub-agents and delegation · MCP integration — internal tools · CI guardrails and usage policy · Impact metrics — velocity, quality.
- **Prerequisites FR** : Pratique Git, expérience d'équipe dev.
- **Prerequisites EN** : Git practice, dev team experience.
- **Duration** : 2 days · **Level** : intermediate

##### 13. `copilot-advanced`
- **FR title** : GitHub Copilot avancé
- **EN title** : GitHub Copilot — advanced
- **FR summary** : Pousser GitHub Copilot au-delà de l'auto-complétion : custom instructions, edits, agentic mode, MCP, intégration en équipe.
- **EN summary** : Push GitHub Copilot beyond autocomplete: custom instructions, edits, agentic mode, MCP, team integration.
- **Category** : Vibe coding & IA
- **Outline FR** : Custom instructions par projet · Copilot Edits — refactor multi-fichiers · Agentic mode — exécution de tâches · MCP avec Copilot · Politique d'usage et conformité · Mesure d'impact.
- **Outline EN** : Per-project custom instructions · Copilot Edits — multi-file refactor · Agentic mode — task execution · MCP with Copilot · Usage policy and compliance · Impact metrics.
- **Prerequisites FR** : Pratique Copilot ou autre assistant IDE.
- **Prerequisites EN** : Hands-on Copilot or other IDE assistant.
- **Duration** : 1 day · **Level** : intermediate

##### 14. `mcp-server-design`
- **FR title** : Concevoir vos serveurs MCP
- **EN title** : Designing your MCP servers
- **FR summary** : Construire un serveur Model Context Protocol robuste : transports, tools, resources, sécurité, erreurs, déploiement.
- **EN summary** : Build a robust Model Context Protocol server: transports, tools, resources, security, errors, deployment.
- **Category** : Vibe coding & IA
- **Outline FR** : Architecture MCP — clients, serveurs, transports · Transport stdio vs HTTP/SSE · Tools — schémas, validation, erreurs · Resources — lecture, abonnements · Sécurité — auth, audit, secrets · Déploiement et observabilité · Tests de bout en bout.
- **Outline EN** : MCP architecture — clients, servers, transports · stdio vs HTTP/SSE transport · Tools — schemas, validation, errors · Resources — reading, subscriptions · Security — auth, audit, secrets · Deployment and observability · End-to-end testing.
- **Prerequisites FR** : Pratique d'un langage backend (TS, Python ou C#), notions API.
- **Prerequisites EN** : Hands-on backend language (TS, Python or C#), API basics.
- **Duration** : 2 days · **Level** : advanced

##### 15. `ai-on-premise`
- **FR title** : IA locale en entreprise
- **EN title** : On-premise AI in the enterprise
- **FR summary** : Déployer des modèles d'IA générative en local : Ollama, vLLM, modèles open-weight, dimensionnement matériel, intégration.
- **EN summary** : Deploy generative AI on-premise: Ollama, vLLM, open-weight models, hardware sizing, integration.
- **Category** : Vibe coding & IA
- **Outline FR** : Paysage des modèles open-weight (Llama, Qwen, Mistral, Gemma) · Ollama — premier déploiement · vLLM — production et concurrent serving · Dimensionnement GPU/CPU/RAM · Intégration API — OpenAI-compatible · Sécurité, audit, RGPD · Cas d'usage internes — code, recherche, summarization.
- **Outline EN** : Open-weight model landscape (Llama, Qwen, Mistral, Gemma) · Ollama — first deploy · vLLM — production and concurrent serving · GPU/CPU/RAM sizing · API integration — OpenAI-compatible · Security, audit, GDPR · Internal use cases — code, search, summarization.
- **Prerequisites FR** : Notions Linux/Docker, notions IA générative.
- **Prerequisites EN** : Linux/Docker basics, generative AI basics.
- **Duration** : 2 days · **Level** : advanced

#### Category — Architecture & DevOps

##### 16. `clean-architecture-dotnet`
- **FR title** : Clean Architecture en .NET
- **EN title** : Clean Architecture in .NET
- **FR summary** : Structurer une application .NET selon les principes hexagonaux : ports & adapters, DDD-lite, séparation domaine / application / infrastructure.
- **EN summary** : Structure a .NET app along hexagonal principles: ports & adapters, DDD-lite, domain / application / infrastructure separation.
- **Category** : Architecture & DevOps
- **Outline FR** : Pourquoi — coût du couplage · Couches — domaine, application, infrastructure, présentation · Ports & adapters · DDD-lite — entités, value objects, agrégats · Use cases et MediatR · Tests par couche · Migration progressive d'un legacy.
- **Outline EN** : Why — coupling cost · Layers — domain, application, infrastructure, presentation · Ports & adapters · DDD-lite — entities, value objects, aggregates · Use cases and MediatR · Layer-by-layer testing · Progressive legacy migration.
- **Prerequisites FR** : ASP.NET Core, expérience d'une app de taille moyenne.
- **Prerequisites EN** : ASP.NET Core, mid-size app experience.
- **Duration** : 3 days · **Level** : advanced

##### 17. `event-driven-cqrs`
- **FR title** : Architecture événementielle & CQRS pratique
- **EN title** : Event-driven architecture & practical CQRS
- **FR summary** : Mettre en place CQRS et architecture événementielle sans dogmatisme : commandes, événements, projections, outbox, idempotence.
- **EN summary** : Implement CQRS and event-driven architecture pragmatically: commands, events, projections, outbox, idempotency.
- **Category** : Architecture & DevOps
- **Outline FR** : CQRS — pourquoi, quand, comment · Commandes et validation · Événements de domaine vs intégration · Outbox pattern et garantie at-least-once · Idempotence et déduplication · Projections et read models · Tests et observabilité.
- **Outline EN** : CQRS — why, when, how · Commands and validation · Domain vs integration events · Outbox pattern and at-least-once delivery · Idempotency and dedup · Projections and read models · Testing and observability.
- **Prerequisites FR** : ASP.NET Core, EF Core, notions message brokers.
- **Prerequisites EN** : ASP.NET Core, EF Core, message broker basics.
- **Duration** : 3 days · **Level** : advanced

##### 18. `observability-otel`
- **FR title** : Observabilité moderne — OpenTelemetry
- **EN title** : Modern observability — OpenTelemetry
- **FR summary** : Instrumenter une application .NET avec OpenTelemetry : traces, métriques, logs structurés, intégration Application Insights et back-ends OSS.
- **EN summary** : Instrument a .NET application with OpenTelemetry: traces, metrics, structured logs, Application Insights and OSS backends.
- **Category** : Architecture & DevOps
- **Outline FR** : Pourquoi OTel — standardisation et portabilité · Traces, spans, propagation · Métriques — counters, histograms, gauges · Logs structurés et corrélation · Application Insights et back-ends OSS · Sampling et budgets · Diagnostiquer un incident en prod.
- **Outline EN** : Why OTel — standardization and portability · Traces, spans, propagation · Metrics — counters, histograms, gauges · Structured logs and correlation · Application Insights and OSS backends · Sampling and budgets · Diagnosing a prod incident.
- **Prerequisites FR** : ASP.NET Core, notions de production.
- **Prerequisites EN** : ASP.NET Core, production basics.
- **Duration** : 2 days · **Level** : intermediate

##### 19. `dotnet-performance`
- **FR title** : Performance & scalabilité .NET
- **EN title** : .NET performance & scalability
- **FR summary** : Mesurer, profiler et optimiser une application .NET : benchmarks, GC, allocations, async patterns, caching, charge.
- **EN summary** : Measure, profile and tune a .NET app: benchmarks, GC, allocations, async patterns, caching, load.
- **Category** : Architecture & DevOps
- **Outline FR** : Mesurer avant d'optimiser — BenchmarkDotNet · Allocations et GC — Span<T>, ArrayPool · Async patterns et ConfigureAwait · Caching — IMemoryCache, IDistributedCache · Profilage — dotnet-trace, PerfView · Tests de charge — k6, NBomber.
- **Outline EN** : Measure before optimizing — BenchmarkDotNet · Allocations and GC — Span<T>, ArrayPool · Async patterns and ConfigureAwait · Caching — IMemoryCache, IDistributedCache · Profiling — dotnet-trace, PerfView · Load testing — k6, NBomber.
- **Prerequisites FR** : ASP.NET Core, expérience d'une app en production.
- **Prerequisites EN** : ASP.NET Core, production app experience.
- **Duration** : 2 days · **Level** : advanced

##### 20. `cicd-github-actions`
- **FR title** : CI/CD avec GitHub Actions
- **EN title** : CI/CD with GitHub Actions
- **FR summary** : Construire des pipelines GitHub Actions robustes : workflows réutilisables, security scanning, déploiement multi-env, OIDC vers Azure.
- **EN summary** : Build robust GitHub Actions pipelines: reusable workflows, security scanning, multi-env deployment, OIDC to Azure.
- **Category** : Architecture & DevOps
- **Outline FR** : Anatomie d'un workflow · Workflows réutilisables et composite actions · Tests, lint et qualité de code · Security scanning — CodeQL, dépendances, secrets · Déploiement multi-env et environments · OIDC vers Azure — sans secrets · Observabilité du pipeline.
- **Outline EN** : Workflow anatomy · Reusable workflows and composite actions · Tests, lint and code quality · Security scanning — CodeQL, dependencies, secrets · Multi-env deployment with environments · OIDC to Azure — secret-less auth · Pipeline observability.
- **Prerequisites FR** : Notions Git, pratique d'un CI quelconque.
- **Prerequisites EN** : Git basics, hands-on with any CI.
- **Duration** : 2 days · **Level** : intermediate

### Rendering on `/services/formateur`

`Pages/ServiceDetail.razor` adds a slug-conditional section:

```razor
@if (service.Slug == "formateur" && trainings is { Count: > 0 })
{
    <section class="ds-section ds-section--bordered">
        <div class="ds-container">
            <ChapterBand Kicker="@catalogueKicker" Title="@catalogueTitle" />
            <TrainingCatalogue Trainings="@trainings" />
        </div>
    </section>
}
```

New component `Components/TrainingCatalogue.razor`:

- Groups by `Category` (4 sections, in fixed display order: .NET / Azure / Vibe coding & IA / Architecture & DevOps).
- Per module: title, pills (`{durationDays}j`, `{level}`, `{certification}`), summary, outline as a `<ul>` always visible.
- Uses `<MotionReveal>` for fade-in.

`SchemaOrg.cs` extends with a `Course` record. Each module emits one JSON-LD `Course` entry on `/services/formateur`.

## 4. AI-Enterprise service + Vibe-coding enrichment (Section 3/7)

### Vibe-coding fiche enrichment

Edits to the existing `vibe-coding` entry in `services-{fr,en}.json`:

**Tagline FR** (revised):
> Je fais adopter Claude Code, Copilot, Cursor, Antigravity à votre équipe — sans confiance aveugle dans le code généré.

**Tagline EN** (revised):
> I help your team adopt Claude Code, Copilot, Cursor, Antigravity — without blind trust in generated code.

**Highlights FR (6, was 5)**:
1. Adoption Claude Code, GitHub Copilot, Cursor, Antigravity + Gemini — choix outillage selon stack et contraintes.
2. Configuration Claude Code en équipe : skills, hooks, sub-agents, MCP, plugins, gouvernance.
3. Méthodologie de relecture profonde du code généré — on diffe, on raisonne, on corrige.
4. Workflows et garde-fous CI : tests automatiques sur les PR IA, scans sécurité, traçabilité.
5. Coaching dev/lead — du prompt initial au merge.
6. Mesure d'impact (vélocité, qualité, satisfaction) avant/après.

**Highlights EN (6)**:
1. Adoption of Claude Code, GitHub Copilot, Cursor, Antigravity + Gemini — tooling chosen for stack and constraints.
2. Team-grade Claude Code config: skills, hooks, sub-agents, MCP, plugins, governance.
3. Deep-review methodology for generated code — diff, reason, correct.
4. CI guardrails: automated tests on AI PRs, security scans, prompt audit trail.
5. Dev/lead coaching — from initial prompt to merge.
6. Impact metrics (velocity, quality, satisfaction) before/after.

**Use cases (3, was 2)** — keep the existing two, add a third:

FR — "Audit de code généré par IA" / "Détecter les anti-patterns, sécuriser les générations existantes."
EN — "AI-generated code audit" / "Detect anti-patterns, secure existing generations."

**FAQ (4, was 2)** — keep existing two, add:

FR :
- Q : Vous gardez l'humain dans la boucle ?
- A : Oui — la promesse n'est pas « moins de devs », c'est « plus de devs efficaces, qui gardent la maîtrise ». Chaque ligne générée passe par une revue.

- Q : Combien de temps pour un pilote ?
- A : 4 à 6 semaines, équipe de 3 à 5 devs, livrable mesuré.

EN :
- Q : Do you keep humans in the loop?
- A : Yes — the promise isn't "fewer devs", it's "more effective devs who keep ownership". Every generated line gets reviewed.

- Q : How long for a pilot?
- A : 4 to 6 weeks, team of 3 to 5 devs, measured deliverable.

**Pricing FAQ entry (new, strategy B)**:

FR :
- Q : Quel est votre TJM en vibe coding ?
- A : 800 € — il s'agit d'une mission de coaching et de transmission, dont une partie significative consiste à former l'équipe en pair-programming.

EN :
- Q : What's your day rate for vibe-coding work?
- A : 800 € — these engagements are coaching and transmission, with significant time spent in pair-programming.

### New service `ia-en-entreprise` / `ai-enterprise`

Inserted at `order: 5`. `applications-mobiles` and `sites-internet` shift to `order: 6` and `order: 7` respectively.

**FR entry (full)**:

```jsonc
{
  "slug": "ia-en-entreprise",
  "title": "IA en entreprise",
  "kicker": "IA SOUVERAINE & MESURABLE",
  "tagline": "J'installe l'IA chez vous : modèles locaux, MCP sur-mesure, site lisible par les LLM, analytics multi-régies.",
  "iconId": "ai-enterprise",
  "summary": "L'IA générative arrive en entreprise. Restez maître de vos données, créez des intégrations sur-mesure, mesurez son impact. Je couvre quatre angles : IA locale (Ollama, vLLM, modèles open-weight), serveurs MCP custom, site optimisé pour la lecture par LLM (llms.txt, structured data), et analytics IA-aware (Google, Bing, Meta).",
  "highlights": [
    "IA locale on-premise — Ollama, vLLM, modèles open-weight (Llama, Qwen, Mistral)",
    "Serveurs MCP sur-mesure — exposez votre SI aux IA de vos devs (Claude Code, Cursor, Copilot)",
    "Site lisible par IA — llms.txt, ai.txt, JSON-LD enrichi, robots.txt IA-aware",
    "Analytics multi-régies — Google Analytics 4, Bing Webmaster, Meta Pixel, intégration RGPD",
    "Cadrage souveraineté & RGPD — où vivent les prompts, où vivent les données",
    "Mesure d'impact business — KPI IA injectés dans vos dashboards existants"
  ],
  "useCases": [
    { "title": "Déploiement IA on-premise", "description": "Pour un client soumis à confidentialité forte : sélection des modèles, dimensionnement matériel, intégration aux outils internes." },
    { "title": "Serveur MCP custom", "description": "Interconnecter votre SI ou votre base de connaissance à Claude Code / Cursor pour décupler la productivité dev." },
    { "title": "Refonte IA-discoverability", "description": "llms.txt + JSON-LD + analytics IA pour un site B2B qui veut apparaître dans les réponses Perplexity / ChatGPT." }
  ],
  "faq": [
    { "question": "Quel est votre TJM ?", "answer": "800 € — mission de mise en place technique et de coaching." },
    { "question": "Pourquoi héberger l'IA chez moi plutôt qu'utiliser ChatGPT/Claude ?", "answer": "Souveraineté des données, conformité RGPD/sectorielle, coût récurrent maîtrisé sur des usages de masse." },
    { "question": "Quels modèles vous installez ?", "answer": "Llama 3, Qwen, Mistral, Gemma — choix selon use case (codage, recherche, summarization) et matériel disponible." },
    { "question": "C'est quoi un serveur MCP, concrètement ?", "answer": "Un connecteur standardisé entre une IA et vos outils : exposez vos APIs internes, votre base docs, vos données métier — l'IA les utilise comme des fonctions." },
    { "question": "Vous touchez à mes pixels marketing existants ?", "answer": "Non — on étend. On ajoute les events IA-aware sans casser GA4 / Meta Pixel en place." }
  ],
  "ctaLabel": null,
  "order": 5
}
```

**EN entry (full)**:

```jsonc
{
  "slug": "ai-enterprise",
  "title": "AI for the enterprise",
  "kicker": "SOVEREIGN & MEASURABLE AI",
  "tagline": "I bring AI in-house: local models, custom MCP servers, LLM-readable site, multi-platform analytics.",
  "iconId": "ai-enterprise",
  "summary": "Generative AI is reaching the enterprise. Stay sovereign with your data, build custom integrations, measure the impact. I cover four angles: on-prem AI (Ollama, vLLM, open-weight models), custom MCP servers, sites optimized for LLM consumption (llms.txt, structured data), and AI-aware analytics (Google, Bing, Meta).",
  "highlights": [
    "On-premise AI — Ollama, vLLM, open-weight models (Llama, Qwen, Mistral)",
    "Custom MCP servers — expose your IT systems to your devs' AI (Claude Code, Cursor, Copilot)",
    "LLM-readable site — llms.txt, ai.txt, enriched JSON-LD, AI-aware robots.txt",
    "Multi-platform analytics — Google Analytics 4, Bing Webmaster, Meta Pixel, GDPR-compliant",
    "Sovereignty & GDPR scoping — where prompts live, where data lives",
    "Business impact metrics — AI KPIs in your existing dashboards"
  ],
  "useCases": [
    { "title": "On-prem AI deployment", "description": "For a confidentiality-bound client: model selection, hardware sizing, internal tool integration." },
    { "title": "Custom MCP server", "description": "Connect your IT systems or knowledge base to Claude Code / Cursor for compounded dev productivity." },
    { "title": "AI-discoverability overhaul", "description": "llms.txt + JSON-LD + AI analytics for a B2B site that wants to surface in Perplexity / ChatGPT answers." }
  ],
  "faq": [
    { "question": "What's your day rate?", "answer": "800 € — technical setup and coaching engagement." },
    { "question": "Why self-host AI rather than use ChatGPT/Claude?", "answer": "Data sovereignty, GDPR / sector compliance, controlled recurring cost on heavy usage." },
    { "question": "Which models do you install?", "answer": "Llama 3, Qwen, Mistral, Gemma — based on use case (coding, search, summarization) and available hardware." },
    { "question": "What's an MCP server, exactly?", "answer": "A standardized connector between an AI and your tools: expose internal APIs, doc bases, business data — the AI uses them as functions." },
    { "question": "Will you touch our existing marketing pixels?", "answer": "No — we extend. AI-aware events get added without breaking GA4 / Meta Pixel already in place." }
  ],
  "ctaLabel": null,
  "order": 5
}
```

`SlugTranslator.cs` gains the pair `ia-en-entreprise` ↔ `ai-enterprise`.

### Cinema impact (decision C-1)

- The `/services` hub scene (currently a 2×3 grid of 6 nodes) gets a 7th node placed asymmetrically below the grid, consistent with the editorial feel of V3. No new motif file.
- `/services/ia-en-entreprise` and `/services/ai-enterprise` reuse the `vibe-coding` signature motif at launch.
- A dedicated motif may be added in a later PR.

### Pricing FAQ updates per service (strategy B)

| Service | Pricing FAQ |
| --- | --- |
| `consultant-dotnet-azure` | Keep "Sur demande" / "On request" |
| `techlead` | Keep "Sur demande" / "On request" (no rate FAQ added) |
| `formateur` | New explicit FAQ — "TJM 800 €. TJM × jours dispensés, ou forfait inter / intra selon le format." / "800 € day rate. Either day-rate × days or inter/in-house package." |
| `vibe-coding` | New explicit FAQ — 800 € (per spec above) |
| `ia-en-entreprise` / `ai-enterprise` | New explicit FAQ — 800 € (per spec above) |
| `applications-mobiles` | Unchanged |
| `sites-internet` | Unchanged |

## 5. FAQ Home expansion (Section 4/7)

The `Pages/Home.razor` `faq` list grows from 3 to **11 entries**. The existing rendering loop with `<QABlock>` handles the count automatically; the JSON-LD `FAQPage` serializer iterates the same list and surfaces 11 questions for SERP rich snippets.

Order: from broadest (does this match my need?) to most specific (do you do X?).

### Q01 — Quels projets acceptez-vous ? / What projects do you take on?

FR : Des missions de consulting, techlead, formation, vibe coding, IA en entreprise, ou des réalisations sur-mesure — .NET, Azure, mobile, web. Si le cadrage est clair et le délai sain, j'y vais.
EN : Consulting, tech-lead, training, vibe coding, enterprise AI, or custom delivery — .NET, Azure, mobile, web. If the scope is clear and the timeline sane, I'm in.

### Q02 — Quels sont vos tarifs ? / What are your rates?

FR : TJM 600 € en consulting et techlead, 800 € en formation, vibe coding et IA entreprise. Ajusté selon durée, complexité et niveau d'implication. Cadrage initial gratuit.
EN : Day rate: 600 € for consulting & tech-lead, 800 € for training, vibe coding and enterprise AI. Adjusted for duration, complexity and engagement level. First scoping call is free.

### Q03 — Où pouvez-vous intervenir ? / Where do you work?

FR : Lyon, Paris, Genève, Fribourg — sur site, hybride ou full-remote selon votre besoin. Je me déplace volontiers pour les kick-offs, les ateliers techniques et les sessions de formation.
EN : Lyon, Paris, Geneva, Fribourg — on-site, hybrid or fully remote depending on your need. I travel for kick-offs, technical workshops and training sessions.

### Q04 — Comment me commander une mission ? / How do I engage you?

FR : Je travaille en portage salarial via OpenWork (société française). Facturation en EUR par défaut ; CHF possible pour les missions côté suisse. Pas de prestation directe — le portage simplifie le contractuel pour vous comme pour moi.
EN : I work via French wage-portage company OpenWork. Default invoicing in EUR; CHF available for Swiss assignments. No direct freelance billing — portage keeps the contract simple for both sides.

### Q05 — Quelles formations dispensez-vous ? / What trainings do you deliver?

FR : Vingt modules au catalogue, regroupés en quatre familles : .NET, Azure, vibe coding & IA, architecture & DevOps. Chaque module se décline en inter ou intra. Détail sur la fiche [Formateur](/fr/services/formateur).
EN : Twenty catalogue modules across four families: .NET, Azure, vibe coding & AI, architecture & DevOps. Each module runs as inter-company or in-house. Full details on the [Trainer page](/en/services/formateur).

### Q06 — Vous installez de l'IA en interne chez nous ? / Can you set up AI in-house?

FR : Oui — modèles open-weight (Llama, Qwen, Mistral) hébergés localement avec Ollama ou vLLM, intégrés à vos outils existants. Détail sur la fiche [IA en entreprise](/fr/services/ia-en-entreprise).
EN : Yes — open-weight models (Llama, Qwen, Mistral) self-hosted with Ollama or vLLM, integrated with your existing tooling. Full details on the [Enterprise AI page](/en/services/ai-enterprise).

### Q07 — Vous savez créer des serveurs MCP ? / Can you build MCP servers?

FR : Oui — c'est un livrable courant des missions IA en entreprise. Un serveur MCP custom expose votre SI ou votre base de connaissance aux IA des dev (Claude Code, Cursor, Copilot).
EN : Yes — it's a regular deliverable on enterprise AI engagements. A custom MCP server exposes your IT systems or knowledge base to dev-team AI (Claude Code, Cursor, Copilot).

### Q08 — Quels outils IA utilisez-vous au quotidien ? / What AI tools do you use day-to-day?

FR : Claude Code en orchestrateur principal, Cursor pour le pair-programming au plus près du code, GitHub Copilot pour l'autocomplétion fine, Antigravity + Gemini quand un browser-side agent est utile. Le choix dépend du contexte client.
EN : Claude Code as the main orchestrator, Cursor for close-quarters pair programming, GitHub Copilot for fine-grained autocomplete, Antigravity + Gemini when a browser-side agent is useful. The choice depends on the client's context.

### Q09 — Comment garantissez-vous la qualité du code généré par IA ? / How do you guarantee AI-generated code quality?

FR : Aucune ligne générée n'est mergée sans relecture. Je diffe, je raisonne, je corrige — la productivité IA n'est utile que si elle ne crée pas de dette cachée. Cette méthodologie est au cœur de mes [missions vibe-coding](/fr/services/vibe-coding).
EN : No AI-generated line gets merged without review. I diff, reason, correct — AI productivity is only valuable if it doesn't create hidden debt. This methodology is central to my [vibe-coding engagements](/en/services/vibe-coding).

### Q10 — Vous configurez des analytics multi-régies ? / Do you configure multi-platform analytics?

FR : Oui — Google Analytics 4, Bing Webmaster, Meta Pixel, en respectant la conformité RGPD (consentement, anonymisation, durées de rétention). On peut aussi intégrer des KPI IA-aware si vous mesurez des trafics venant des assistants conversationnels.
EN : Yes — Google Analytics 4, Bing Webmaster, Meta Pixel, with GDPR compliance (consent, anonymization, retention). I can also wire AI-aware KPIs if you want to measure traffic from conversational assistants.

### Q11 — Mon site doit être lisible par les IA — vous savez faire ? / Can you make a site readable by AIs?

FR : Oui. Trois leviers : llms.txt et ai.txt pour exposer votre contenu aux crawlers IA, JSON-LD enrichi (Schema.org) pour structurer la sémantique, et un robots.txt IA-aware pour gérer ce que vous autorisez. Approche identique à celle qui rend ce site indexable par Perplexity et ChatGPT.
EN : Yes. Three levers: llms.txt and ai.txt to expose content to AI crawlers, enriched JSON-LD (Schema.org) for semantic structure, and an AI-aware robots.txt to control what you allow. Same approach used on this site to make it indexable by Perplexity and ChatGPT.

## 6. Locations & Schema.org (Section 5/7)

### Copy updates

| Surface | Before | After |
| --- | --- | --- |
| `Home.razor` lead FR | « .NET, Azure, mobile, web — à Lyon et à distance. » | « .NET, Azure, mobile, web — Lyon · Paris · Genève · Fribourg ou full-remote. » |
| `Home.razor` lead EN | « .NET, Azure, mobile, web — in Lyon and remote. » | « .NET, Azure, mobile, web — Lyon · Paris · Geneva · Fribourg or fully remote. » |
| `Components/Footer.razor` | (audit during impl) | Discreet line "Lyon · Paris · Genève · Fribourg — full-remote" near copyright |
| `wwwroot/llms.txt` | (audit) | Mention 4 cities |
| `wwwroot/ai.txt` | (audit) | Mention 4 cities |

### Schema.org `Person.workLocation`

Existing `address` (Lyon) is kept as the legal/postal address. A new `workLocation` array is added on `Person`:

```jsonc
"workLocation": [
  { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": "Lyon",     "addressCountry": "FR" } },
  { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": "Paris",    "addressCountry": "FR" } },
  { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": "Geneva",   "addressCountry": "CH" } },
  { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": "Fribourg", "addressCountry": "CH" } }
]
```

Implementation: extend `SchemaOrg.Person` with a nullable `WorkLocation: SchemaOrg.Place[]?` property. Add a `Place` record if not already present.

### Schema.org `Service.areaServed`

| Before FR | After FR |
| --- | --- |
| « France et international (remote) » | « France · Suisse · Europe (remote) » |
| « France and worldwide (remote) » | « France · Switzerland · Europe (remote) » |

## 7. Implementation plan (Section 6/7)

Single PR, three internal commits.

### Branch & PR

- **Branch** : `feature/content-revision-v3-1`
- **PR title** : `feat(content): training catalogue, ai-enterprise service, expanded FAQ, locations`
- **PR base** : `main`

### Commit 1 — `feat(data): extract training centers + introduce trainings catalogue plumbing`

- New JSON files (training centers extracted, trainings placeholder).
- New `Training` model.
- `Resume` model loses `TrainingCenters`.
- Gateway methods added.
- Home and CV switch to new gateway methods.

### Commit 2 — `feat(formateur): publish 20-module training catalogue`

- Fill `trainings-{fr,en}.json` with the 20 modules above.
- New `TrainingCatalogue` component + SCSS partial.
- Slug-conditional rendering in `ServiceDetail.razor`.
- JSON-LD `Course[]` emission for `/services/formateur`.

### Commit 3 — `feat(content): expand FAQ, add ai-enterprise service, update locations`

- Enrich `vibe-coding` and add `ia-en-entreprise` / `ai-enterprise` to `services-{fr,en}.json`.
- 11 Q&A in `Home.razor` (FR + EN).
- Pricing FAQ updates per strategy B.
- `Person.workLocation × 4` JSON-LD.
- Lead, footer, llms.txt, ai.txt copy updates.
- `SlugTranslator` pair added.

### Estimated effort

| Commit | Coding | Content writing | Review | Total |
| --- | --- | --- | --- | --- |
| 1 | 2 h | 0 | 30 min | ~3 h |
| 2 | 3 h | already drafted (this spec) | 1 h | ~4 h |
| 3 | 4 h | already drafted (this spec) | 1 h | ~5 h |

**Total** ≈ 12 h coding + review (content rewriting cost moved into this spec phase).

## 8. Tests, open assumptions & checkpoints (Section 7/7)

### Test surface

| Test | Change |
| --- | --- |
| `BundleBudgetTests` | Inchangé — pas de nouveau JS |
| `HardcodedPathsTests` | Inchangé — toutes les nouvelles routes via `ILocalizedRoute` |
| `LocalizedRouteTests` | + assertion paire `ia-en-entreprise` ↔ `ai-enterprise` |
| `RealisationFilterTests` | Inchangé |
| `IntegrationTests` | + `/services/ai-enterprise` (FR/EN), 4 nouveaux JSON publiés, `FAQPage ≥ 11`, `Person.workLocation × 4`, `Course[]` sur formateur |
| `JsonContentGatewayTests` *(new file if absent)* | `GetTrainingsAsync`, `GetTrainingCentersAsync`, parity FR/EN, count = 20 |
| `TrainingCatalogueTests` *(new)* | Rendu groupé par catégorie, ordre stable, pills présents |

### Open assumptions (placeholders to confirm during spec review)

1. **Training centers list** — to extract from existing `resume-{fr,en}.json`. Andrés may also want to add new entries (3-4 schools mentioned during brainstorming). The spec ships with the existing centers preserved; new entries are TBD by Andrés.
2. **Module content above** — drafted from public Microsoft Learn / Anthropic / GitHub / OpenMCP programs. Andrés to correct any factual mismatches with his actual practice.
3. **iconId `ai-enterprise`** — to be defined during impl. Either reuse existing iconography or add a sober ~1 KB SVG consistent with the other 6 icons.
4. **Footer placement** — line near copyright. Final position to be validated visually during impl.

### Implementation checkpoints

Three internal validation gates during the single-PR implementation:

- **Checkpoint A** *(after commit 1)* : `git diff --stat` review; verify JSON migration is clean and Home + CV still render the centers.
- **Checkpoint B** *(after commit 2)* : screenshots of `/fr/services/formateur` and `/en/services/formateur` on desktop + mobile.
- **Checkpoint C** *(after commit 3)* : screenshots of Home FR + EN, the new `ia-en-entreprise` fiche, footer.

After Checkpoint C the PR is opened.

### Definition of done

- ✅ Branch `feature/content-revision-v3-1` merged into `main` via PR.
- ✅ CI green (build + tests + Sonar).
- ✅ `https://ideastud.io/fr` renders 11 Q&A.
- ✅ `https://ideastud.io/fr/services/formateur` renders the 20 modules grouped.
- ✅ `https://ideastud.io/fr/services/ia-en-entreprise` and `/en/services/ai-enterprise` render `200 OK`.
- ✅ Lighthouse SEO score unchanged or improved (FAQPage rich snippet eligibility).
