# FireScrum — Stack technique

## Vue d'ensemble

| Couche | Technologie | Dossier |
|--------|-------------|---------|
| Front | Angular | `frontend/` |
| Back (API) | Rust | `backend/` |
| Base de données | PostgreSQL | `data/` (données persistées) |
| Conteneurisation | Docker + Docker Compose | racine du projet |

Tout tourne dans des conteneurs Docker : un conteneur par service.

```
Navigateur ──HTTP──> [frontend : Angular] ──API REST──> [backend : Rust] ──SQL──> [db : PostgreSQL]
                                                                                     │
                                                                               volume data/
```

## Services Docker

| Service | Rôle | Image de base |
|---------|------|---------------|
| `frontend` | Sert l'application Angular compilée | `node` (build) puis `nginx` (exécution) |
| `backend` | API REST, règles métier (droits PO/Dev, calcul des %, points de validation) | `rust` (build) puis une image légère (exécution) |
| `db` | Stockage des projets, features, US, tâches, sprints, utilisateurs | `postgres` |

Les trois services sont décrits dans `docker-compose.yml` à la racine, complété par un fichier par environnement (voir [Environnements](#environnements)). Le lancement se fait avec :

```bash
just dev
```

## Répartition des responsabilités

- **Front** : affichage (Backlog, Sprint), déplacement des tâches entre colonnes, choix de l'utilisateur courant.
- **Back** : toutes les règles métier sont vérifiées côté serveur. Le front peut masquer un bouton, mais c'est le back qui refuse l'action :
  - droits PO / Dev ;
  - passage en `Terminé` seulement si tous les points de validation sont cochés ;
  - vélocité limitée à la suite de Fibonacci ;
  - calcul des % (US et feature) et de la vélocité totale du sprint.
- **DB** : persistance uniquement.

## Choix retenus

| Sujet | Choix |
|-------|-------|
| Framework web Rust | Axum 0.8 |
| Accès à la base en Rust | SeaORM 2.0 (ORM). Le schéma reste en SQL dans `backend/migrations/`, appliqué par `sea-orm-migration` au démarrage |
| Front | Angular 22, composants standalone, sans zone.js |
| UI | Spartan (portage Angular de shadcn/ui), style `vega`, thème `neutral` + Tailwind CSS 4 |
| Glisser-déposer des tâches | Angular CDK (déjà installé, requis par Spartan) |
| Base de données | PostgreSQL 17 |

## Architecture du back (MVC)

Un dossier par entité dans `backend/src/` (`project`, `feature`, `user_story`, `task`, `validation_point`, `sprint`) :

| Fichier | Rôle |
|---------|------|
| `model.rs` | Entité SeaORM (`Model`, statuts en enum) + fonctions de requête |
| `controller.rs` | Serializer : format JSON d'entrée (`New…`, `…Update` + `validate()`) et de sortie (`…Out`) |
| `view.rs` | Endpoints axum : lisent la requête, appellent controller et model, renvoient la réponse |
| `mod.rs` | Routes de l'entité, fusionnées dans `main.rs` |

Le schéma de la base est dans `backend/migrations/`, appliqué automatiquement au démarrage du back. Les routes sont décrites dans [api.md](api.md).

Pour appeler l'API à la main : ouvrir le dossier `bruno/` dans [Bruno](https://www.usebruno.com/), environnement `local` (stack de travail) ou `test` (stack de test lancée avec `KEEP=1 just tests`). La collection documente chaque route ; ses assertions s'affichent quand on envoie une requête, mais elle ne fait pas partie des tests (voir [Tests](#tests)).

## Architecture du front

Dans `frontend/src/app/` :

```
services/                 Appels API (un fichier par entité), error.ts, task-status.ts
pages/<page>/             Un dossier par page (backlog, features, planning, sprint)
├── component.ts          Composant de la page
├── template.html
├── template.scss
└── forms/<entité>/       Un dossier par entité (ex. user-story, task, sprint)
    ├── component.ts      Affichage de l'entité  (+ template.html, template.scss)
    └── form.ts           Formulaire de création (+ form.html, form.scss)
```

Le style passe surtout par les classes Tailwind dans les templates ; les `.scss` servent aux cas particuliers.

## Contrats partagés back ↔ front (ts-rs)

Les types JSON de l'API sont écrits une seule fois, en Rust (`controller.rs` et statuts des `model.rs`, marqués `#[derive(TS)]`). [ts-rs](https://github.com/Aleph-Alpha/ts-rs) en génère un fichier TypeScript par type dans `contracts/`, que le front importe via l'alias `@contracts/<Type>` :

```ts
import type { FeatureOut } from '@contracts/FeatureOut';
```

- Génération à la demande, pas à l'exécution : après avoir modifié un type Rust, lancer `./scripts/gen-contracts.sh` (Rust tourne dans Docker). Si le front utilise un champ qui n'existe plus, son build échoue.
- Les fichiers de `contracts/` sont générés : ne pas les modifier à la main. Ils sont conservés dans le projet, donc le build du front n'a pas besoin de Rust.
- Les ids (`i64`) sont exportés en `number` (réglage dans `backend/.cargo/config.toml`).
- Le build Docker du front part de la racine du projet pour voir `contracts/` (voir `.dockerignore` à la racine).

## Qualité du code front

Depuis `frontend/` :

```bash
npm run lint           # ESLint (angular-eslint) : TS + templates, dont règles d'accessibilité
npm run format         # Prettier : formate le code (templates inline compris)
npm run format:check   # vérifie le formatage sans modifier
```

`libs/ui/` (code généré par Spartan) n'est ni linté ni formaté.

## Composants UI (Spartan)

Les composants sont copiés dans `frontend/libs/ui/` (on peut les modifier) et importés via l'alias `@spartan-ng/helm/<composant>`. Config : `frontend/components.json`.

Ajouter un composant (depuis `frontend/`) :

```bash
npx ng g @spartan-ng/cli:ui <composant>   # ex. card, dialog, input
```

## Lancer le projet

Prérequis : Docker avec Compose, [`just`](https://github.com/casey/just), et Node (pour les types des tests dans l'IDE).

```bash
cp .env.template .env   # identifiants de la base et ports, propres à chaque machine
just dev                # stack de travail
just down               # l'arrête
```

`just --list` affiche toutes les recettes.

- Application : http://localhost:4200
- L'API est servie sous `/api` via le nginx du front (pas de CORS).
- Les données PostgreSQL sont stockées dans `data/` (ignoré par git). Pour repartir d'une base vide : arrêter les conteneurs et vider `data/`.

### Environnements

Un fichier Compose par environnement, par-dessus la base `docker-compose.yml`. Les ports viennent du `.env` (`FRONTEND_PORT`, `BACKEND_PORT`, `DB_PORT`, et `TEST_FRONTEND_PORT` pour la stack de test) : les trois environnements ont les mêmes variables, chaque machine a ses valeurs.

| Environnement | Commande | Fichiers | Ports publiés |
|---------------|----------|----------|---------------|
| Dev | `just dev` | `docker-compose.yml` + `docker-compose.dev.yml` | front `FRONTEND_PORT` ; base et backend sur `127.0.0.1` (`DB_PORT`, `BACKEND_PORT`) |
| Prod | `just prod` | `docker-compose.yml` | front `FRONTEND_PORT` seulement |
| Test | `just tests` | `docker-compose.yml` + `docker-compose.test.yml` | front `TEST_FRONTEND_PORT` (4201) ; base non publiée ; mode UI sur `127.0.0.1:9324` |

Dev et prod partagent le même projet Compose (`firescrum`) et la même base `data/` : `just prod` remplace la stack de dev.

## Tests

Tests de l'API et tests navigateur, avec [Playwright](https://playwright.dev/), sur la stack de test (base en mémoire, port 4201). `just tests` la construit, la lance, attend qu'elle réponde, joue les tests puis l'arrête, même en cas d'échec. La stack de travail et sa base ne sont jamais touchées.

```bash
just tests                        # tout : API et navigateur
just tests --back                 # tests de l'API seuls (sans navigateur, quelques secondes)
just tests --front                # tests navigateur seuls
just tests --grep R49             # un test par son ID de recette (combinable avec --back / --front)
just tests --front e2e/sprint/    # un seul dossier
just tests --ui                   # mode UI de Playwright : http://localhost:9324, jusqu'à Ctrl+C
KEEP=1 just tests                 # laisse la stack de test lancée à la fin
```

```
tests/
├── playwright.config.ts   projets api (testDir api/) et e2e (testDir e2e/)
├── fixtures.ts            partagé : base vidée avant chaque test, api() / call(), fabriques (createStory, startSprint…)
├── Dockerfile             lanceur : image Playwright, dépendances installées au build
├── entrypoint.sh          traduit --back / --front / --ui, puis lance Playwright
├── api/<entité>/          logic.spec.ts, rules.spec.ts : requêtes HTTP, aucun navigateur
└── e2e/<entité>/          logic.spec.ts, rules.spec.ts, style.spec.ts ; e2e/helpers.ts : localisateurs, surveillance de la console
```

- Lancés par le service `tests` de `docker-compose.test.yml` : pas de navigateur à installer. Le service est sur le réseau de la stack de test, joint le front et la base par leur nom (`frontend`, `db`), et attend que le front soit *healthy* (`/api/health`). `npm install` dans `tests/` ne sert qu'aux types dans l'IDE.
- La base est vidée avant chaque test (`TRUNCATE`) : chaque test crée ses données par l'API (fabriques de `fixtures.ts`), puis vérifie une réponse (`call`) ou un écran.
- Le titre d'un test commence par son ID du [cahier de recettes](cahier-de-recettes.md) ; dans un test API, chaque `expect` porte le libellé de la vérification.
- Tests navigateur : une erreur dans la console fait échouer le test (sauf les réponses 400, 404 et 409 attendues).
- Rapport HTML dans `tests/report/index.html` (ignoré par git) ; chaque test en échec a sa trace (étapes, captures, DOM, et onglet *Network* pour les requêtes), à ouvrir dans le Trace Viewer : `npx playwright show-trace <trace.zip>` ou https://trace.playwright.dev.
