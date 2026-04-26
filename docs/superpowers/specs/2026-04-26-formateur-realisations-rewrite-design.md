# Design — Réalisations + page Formateur + clarification CV

**Date** : 2026-04-26
**Auteur** : Andrés Talavera (via Claude)
**Scope** : éditorial + structurel — pas de refonte technique

## Contexte

Trois besoins se cumulent :

1. **Réalisations** : ajouter le projet **Brasa Geneva**, renommer **Krosquare → K-RO SQUARE**, et recaler la chronologie (les `completedOn` actuels ne reflètent pas l'ordre réel des projets).
2. **Page formateur** (`/{culture}/services/formateur`) : enrichir le contenu (summary, highlights, useCases, FAQ), partager la liste des centres de formation avec la page CV, et rendre visible l'invitation à composer un programme sur-mesure à partir de modules officiels.
3. **CV** : lever l'ambiguïté du bloc "J'apprends, j'enseigne." — la liste contient en réalité les centres et écoles **où Andrés a enseigné**.

Périmètre transverse : revoir la tonalité éditoriale en s'inspirant du vocabulaire de `wwwroot/data/resume-fr.json`, et corriger deux kickers/titres trop vagues ou trop familiers de `ServiceDetail.razor` ("Ce que vous obtenez", "Où ça a fonctionné") qui s'appliquent à toutes les fiches services.

**Non-objectif** : ne pas modifier les textes des `experiences[]`, `aboutSections[]`, `personalInformation` dans `resume-{fr,en}.json`. Tout le reste est dans le périmètre.

## Décisions structurantes

- **TeachList partagé** : le composant `Components/TeachList.razor` est déjà utilisé par Home et CV. On l'utilise tel quel sur `services/formateur` — pas de modif du composant ni du modèle `TrainingCenter`.
- **Convention d'image réalisations** : passage des SVG illustratifs (`images/realisations/<slug>.svg`) aux **captures PNG** déjà déposées dans `wwwroot/images/www.<domaine>.png`. MonSeigneur Champagne n'a pas de PNG `www.*` : il **garde son SVG** existant.
- **Slug stable** : Krosquare est renommé pour l'affichage (`title`, `client`) mais le slug reste `krosquare` — on préserve l'URL, le déduplication SEO et les liens entrants éventuels.
- **Localized route formateur** : pas d'ajout dans `LocalizedRoute.StaticRoutes`. On construit l'URL côté Home via `$"{LocalizedRoute.For("services.hub")}/{trainerSlug}"` avec `trainerSlug = fr ? "formateur" : "trainer"`.

## Section 1 — Réalisations

### Fichier `wwwroot/data/realisations-fr.json` (et son miroir EN)

**Nouvelle entrée Brasa Geneva** (FR) :

```json
{
  "slug": "brasageneva",
  "title": "Brasa Geneva",
  "client": "Brasa Geneva",
  "summary": "Site vitrine d'un club de cigares genevois — identité feutrée, parcours membre, version suisse de l'esprit Corona Club.",
  "imageUrl": "images/www.brasageneva.ch.png",
  "imageAlt": "Capture d'écran du site Brasa Geneva",
  "liveUrl": "https://www.brasageneva.ch",
  "type": "SiteVitrine",
  "technologies": [".NET", "Blazor", "Netlify"],
  "completedOn": "2026-04-01",
  "displayOrder": 1
}
```

**Renommage Krosquare → K-RO SQUARE** : `title` et `client` deviennent `"K-RO SQUARE"`. Slug et `liveUrl` inchangés.

**Recalage chronologique** (du plus récent au plus ancien — `displayOrder` croissant) :

| displayOrder | Projet | completedOn | imageUrl |
|---|---|---|---|
| 1 | Brasa Geneva | 2026-04-01 | `images/www.brasageneva.ch.png` |
| 2 | IdeaStud.io | 2026-02-01 | `images/www.ideastud.io.png` |
| 3 | Corona Club Noblesse | 2025-12-01 | `images/www.coronaclubnobless.ch.png` |
| 4 | K-RO SQUARE | 2025-10-01 | `images/www.krosquare.fr.png` |
| 5 | Monseigneur Champagne | 2025-08-01 | `images/realisations/monseigneur-champagne.svg` (inchangé) |

**Réécriture des summaries** (FR) — ton éditorial cohérent avec `resume-fr.json` :

- **Brasa Geneva** : voir entrée ci-dessus.
- **IdeaStud.io** : "Le site que vous lisez : portfolio éditorial, fiches de services, blog technique. Blazor WASM AOT, design system maison, design tokens partagés entre SCSS et runtime JS."
- **Corona Club Noblesse** : "Site institutionnel d'un club suisse — rendu élégant, navigation tri-langue, mise en valeur d'une identité héritée."
- **K-RO SQUARE** : "Site vitrine et présentation d'offre pour une marque française — direction artistique épurée, mise en scène claire de l'identité."
- **Monseigneur Champagne** : "Vitrine d'une maison de champagne — identité premium, parcours client soigné jusqu'à la prise de contact."

**Équivalents EN** (à produire pendant l'implémentation) : même structure, traduits dans la même tonalité que `realisations-en.json` actuel.

## Section 2 — Home : lien "Voir toutes les formations"

Fichier : `Pages/Home.razor`

- Champ `trainerSlug` ajouté au code-behind, valorisé dans `LoadTexts()` :
  - FR → `"formateur"`
  - EN → `"trainer"`
- Le lien (ligne 92-93) devient :

```razor
<a class="ds-link" href="@($"{LocalizedRoute.For("services.hub")}/{trainerSlug}")">
    @allTrainings <span class="ds-link__arrow" aria-hidden="true">→</span>
</a>
```

- `teachKicker`, `teachTitle`, `allTrainings` inchangés.

## Section 3 — CV : clarification du bloc "J'apprends, j'enseigne."

Fichier : `Pages/Cv.razor`

- **Renommage du titre** dans `LoadTexts()` :
  - `trainTitle` FR : `"J'apprends, j'enseigne."` → `"Là où j'ai enseigné."`
  - `trainTitle` EN : `"I learn, I teach."` → `"Where I've taught."`
- **Chapter IV** inchangé (`"Formations"` / `"Trainings"`).
- **Ajout d'une intro** entre `<ChapterBand>` et `<TeachList>` (ligne 80) :

```razor
<ChapterBand Kicker="@chapterFour" Title="@trainTitle" />
<p class="ds-lead" data-reveal style="margin-block-start: 1.5rem;">@trainIntro</p>
<div style="margin-block-start: 2rem;">
    <TeachList Centers="@trainingCenters" />
</div>
```

- Texte de l'intro :
  - FR : "Centres de formation et écoles qui m'ont confié leurs sessions, en présentiel comme en distanciel. Trois décennies de stack Microsoft, transmises à des publics très variés — de l'étudiant Supinfo au développeur senior en reconversion cloud."
  - EN : "Training centres and schools that have trusted me with their sessions, on-site and remote. Three decades of Microsoft stack, passed on to wildly different audiences — from Supinfo students to senior devs reskilling on cloud."

## Section 4 — Page `services/formateur` enrichie + partage TeachList

### 4.1 Architecture (modif `Pages/ServiceDetail.razor`)

Nouvel ordre des sections pour la fiche `formateur` (les autres fiches restent à 5 sections) :

1. Hero (inchangé)
2. Summary (réécrit — voir 4.2)
3. **Le périmètre** (highlights, kicker/titre revus — voir §5)
4. **Cas d'usage** (useCases, kicker/titre revus — voir §5)
5. **Centres partenaires** ← NOUVEAU, formateur only
6. FAQ
7. Catalogue des 20 modules (inchangé)

Bloc `Centres partenaires` (markup) :

```razor
@if (service.Slug == "formateur" && centers.Count > 0)
{
    <section class="ds-section ds-section--chapter ds-section--bordered">
        <div class="ds-container">
            <ChapterBand Kicker="@centersKicker" Title="@centersTitle" />
            <p class="ds-lead" data-reveal style="margin-block-start: 1.5rem;">@centersIntro</p>
            <div style="margin-block-start: 2rem;">
                <TeachList Centers="@centers" />
            </div>
        </div>
    </section>
}
```

Code-behind — chargement des centres en parallèle des trainings :

```csharp
private IReadOnlyList<TrainingCenter> centers = Array.Empty<TrainingCenter>();
…
if (service.Slug == "formateur")
{
    trainings = await Content.GetTrainingsAsync(culture);
    centers   = await Content.GetTrainingCentersAsync(culture);
}
```

Strings localisées :

```csharp
private string centersKicker = "Partenaires";
private string centersTitle  = "Là où j'ai enseigné.";
private string centersIntro  = "Centres de formation et écoles qui m'ont confié leurs sessions, en présentiel comme en distanciel.";
…
// dans LoadTexts()
centersKicker = fr ? "Partenaires"           : "Partners";
centersTitle  = fr ? "Là où j'ai enseigné."  : "Where I've taught.";
centersIntro  = fr ? "Centres de formation et écoles qui m'ont confié leurs sessions, en présentiel comme en distanciel."
                   : "Training centres and schools that have trusted me with their sessions, on-site and remote.";
```

### 4.2 Réécriture du contenu — `services-fr.json` entrée `formateur`

**Tagline** (inchangée) : "Je forme vos équipes aux fondamentaux et aux pratiques avancées .NET, Azure et web moderne."

**Summary** (réécrit) :

> "Plus de 3 000 heures de formation à mon actif, sur deux décennies de stack Microsoft. Auprès de développeurs juniors comme de techleads en quête de recul, dans des écoles (Supinfo, NextFormation) ou de grands centres (ORSYS, IP-Formation, Happly), en présentiel, classe virtuelle ou intra sur-mesure. Vingt modules au catalogue ci-dessous — à prendre tels quels, ou à recomposer ensemble pour bâtir le programme qui colle à votre équipe."

**Highlights** (étoffés et plus précis) :

```json
"highlights": [
  "ASP.NET Core 10, Blazor 10 (Server, WASM, Hybrid), Entity Framework Core",
  "Azure plateforme et préparation aux examens AZ-204 (développeur) et AZ-400 (DevOps)",
  "Architecture logicielle pragmatique — Clean Architecture, CQRS, event-driven, DDD-lite",
  "Tests automatisés, TDD, snapshot et tests de mutation",
  "DevOps et CI/CD — GitHub Actions, Azure Pipelines, IaC Bicep / Terraform",
  "Vibe coding & IA en équipe — Claude Code, GitHub Copilot, MCP, modèles open-weight en local",
  "Programmes sur-mesure assemblés à partir de plusieurs modules officiels"
]
```

**Use cases** (passage de 2 à 3 — ajout du programme à la carte) :

```json
"useCases": [
  {
    "title": "Inter-entreprise · 3 jours",
    "description": "Sessions catalogue dispensées chez ORSYS, IP-Formation ou en classe virtuelle. Inscriptions individuelles, groupe mixte d'apprenants — Blazor, Azure DevOps, Clean Architecture, AZ-204."
  },
  {
    "title": "Intra sur-mesure",
    "description": "Programme calibré avec vous : audit de besoins préalable, choix des modules, profondeur et exemples adaptés à votre code base."
  },
  {
    "title": "Programme à la carte",
    "description": "Vous partez d'un module officiel comme socle (par exemple AZ-204), on le complète avec deux ou trois modules connexes pour couvrir précisément le périmètre de votre équipe — ni trop court, ni trop long."
  }
]
```

**FAQ** (passage de 3 à 5) :

```json
"faq": [
  { "question": "Quel est votre TJM en formation ?", "answer": "800 € par jour, ou forfait inter / intra selon le format. Devis chiffré sous 24 h à partir d'un brief court." },
  { "question": "Formez-vous à distance ?", "answer": "Oui — classe virtuelle synchrone, exercices en binôme, démos en partage d'écran, retours en direct. La même rigueur qu'en présentiel." },
  { "question": "Êtes-vous certifié ?", "answer": "Microsoft Certified Trainer (MCT) actif, et plusieurs certifications Azure (AZ-204, AZ-400 entre autres). Mes modules de préparation aux examens reposent sur ce vécu." },
  { "question": "Comment construire un programme sur-mesure ?", "answer": "On part d'un module catalogue qui couvre le cœur de votre besoin, on identifie ce qui manque et ce qui est superflu, on emprunte des chapitres aux modules connexes, on cale la durée. Le brief tient en un appel de 30 minutes." },
  { "question": "Quels dispositifs de financement ?", "answer": "Les centres partenaires (ORSYS, IP-Formation, NextFormation) sont Qualiopi : OPCO, CPF entreprise, plan de développement des compétences. En intra direct, je vous oriente vers le dispositif adapté." }
]
```

**Équivalents EN** (à produire pendant l'implémentation) : même structure JSON, même nombre d'items, mêmes idées clés, anglais idiomatique aligné sur le ton existant de `services-en.json` (entrée `trainer`). À soumettre à validation utilisateur en même temps que la version FR.

## Section 5 — Kickers/titres transverses (`ServiceDetail.razor`)

Modifications dans `LoadTexts()` — affecte **toutes** les fiches services (pas seulement formateur) :

| Champ | Actuel FR | Proposé FR | Actuel EN | Proposé EN |
|---|---|---|---|---|
| `highlightsKicker` | Concrètement | **Le périmètre** | Concretely | **Scope** |
| `highlightsTitle` | Ce que vous obtenez. | **Ce que la mission couvre.** | What you get. | **What the engagement covers.** |
| `useCaseKicker` | Cas d'usage | _(inchangé)_ | Use cases | _(inchangé)_ |
| `useCaseTitle` | Où ça a fonctionné. | **Quand on m'appelle.** | Where it worked. | **When clients reach out.** |
| `faqKicker` | Questions fréquentes | _(inchangé)_ | Frequent questions | _(inchangé)_ |
| `faqTitle` | Ce que les clients demandent. | _(inchangé)_ | What clients ask. | _(inchangé)_ |

Justification : "Le périmètre / Ce que la mission couvre." marche pour tout type de service (livrables d'un consultant comme sujets enseignés par un formateur). "Quand on m'appelle." remplace une formulation familière par un cadrage plus éditorial — qui fonctionne aussi pour tous les services.

## Impact, risques, tests

### Impact transverse

- **5 fiches services autres que formateur** (consultant, techlead, vibe-coding, ia-en-entreprise, mobile, sites) verront leurs kickers/titres "Le périmètre / Ce que la mission couvre." et "Cas d'usage / Quand on m'appelle." — **acceptable et voulu** (cohérence éditoriale).
- **Page Home** : pas d'impact visible côté utilisateur sauf le lien `Voir toutes les formations` qui pointe désormais vers la fiche formateur.
- **Page Realisations** (`/{culture}/realisations` ou `/projects`) : nouvelles images, nouveau projet en tête de liste, summaries réécrits.

### Risques

- **Tests à vérifier** : `IntegrationTests`, `LocalizedRouteTests`, `RealisationFilterTests`, `HardcodedPathsTests`. Aucune route nouvelle, donc `LocalizedRouteTests` ne devrait pas être impacté. `RealisationFilterTests` peut buter sur l'ordre/le nombre d'éléments — à relire pendant l'implémentation.
- **Bundle JS** (`BundleBudgetTests`) : non impacté (pas de modif `wwwroot/src/cinema/`).
- **Image MonSeigneur** : seule réalisation à conserver son SVG. Cohérence visuelle : à vérifier rapidement en dev — si le mix SVG/PNG est gênant, on demandera à l'utilisateur de fournir un PNG aussi.
- **Slug `brasageneva`** : nouveau, pas de collision attendue. À vérifier qu'il n'existe pas de fichier ou route conflictuelle.

### Vérifications de fin

1. `dotnet build IdeaStudio.sln` passe (déclenche aussi le pipeline npm).
2. `dotnet test IdeaStudio.sln` passe.
3. Smoke manuel `dotnet watch run` :
   - `/fr` — section "Où j'enseigne." → le lien "Voir toutes les formations" mène à `/fr/services/formateur`.
   - `/fr/realisations` — Brasa Geneva en tête, K-RO SQUARE renommé, dates cohérentes.
   - `/fr/services/formateur` — nouveau bloc "Centres partenaires" visible entre Cas d'usage et FAQ.
   - `/fr/cv` — section "Là où j'ai enseigné." avec son intro.
   - Mêmes vérifications côté `/en` (lien `/en/services/trainer`, etc.).

## Hors-périmètre explicite

- Pas de modif des `experiences[]`, `aboutSections[]`, `personalInformation` dans `resume-{fr,en}.json`.
- Pas de modif du composant `TeachList.razor` ni du modèle `TrainingCenter`.
- Pas de migration de l'image MonSeigneur Champagne (faute de PNG `www.*`).
- Pas de nouvelle entrée dans `LocalizedRoute.StaticRoutes` (pas de PageId `services.formateur`).
- Pas de retouche des autres fiches services (consultant, techlead, vibe-coding, ia-en-entreprise, mobile, sites) au-delà des deux kickers/titres transverses listés en §5.
