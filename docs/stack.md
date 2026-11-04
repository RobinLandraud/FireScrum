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

Les trois services sont décrits dans un `docker-compose.yml` à la racine. Le lancement se fait avec :

```bash
docker compose up
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

Pour tester l'API : ouvrir le dossier `bruno/` dans [Bruno](https://www.usebruno.com/) (environnement `local`), ou lancer toute la collection en ligne de commande :

```bash
cd bruno && npx @usebruno/cli run -r --env local
```

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

```bash
cp .env.example .env   # identifiants de la base, à adapter
docker compose up --build
```

- Application : http://localhost:4200
- L'API est servie sous `/api` via le nginx du front (pas de CORS). Le back et la base ne sont pas exposés sur la machine hôte.
- Les données PostgreSQL sont stockées dans `data/` (ignoré par git). Pour repartir d'une base vide : arrêter les conteneurs et vider `data/`.
