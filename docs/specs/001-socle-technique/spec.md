# 001 — Socle technique

**Statut** : Livrée

## Contexte

Poser une base commune au back, au front et à la base de données, lançable d'une seule commande, avec des contrats partagés pour que front et back ne divergent pas.

## Comportement attendu

- `docker compose up --build` lance les trois services : `db` (PostgreSQL 17), `backend` (Rust), `frontend` (Angular servi par nginx).
- L'application est sur http://localhost:4200 ; l'API est servie sous `/api` par le nginx du front (pas de CORS). Le back et la base ne sont pas exposés sur la machine hôte.
- Le schéma de la base est appliqué automatiquement au démarrage du back.
- `GET /api/health` indique si le back et la base répondent.

## Règles

- **Back** : architecture MVC, un dossier par entité (`model.rs` = entité SeaORM et requêtes, `controller.rs` = serializer des entrées / sorties avec `validate()`, `view.rs` = endpoints, `mod.rs` = routes).
- **Toutes les règles métier sont vérifiées par le back.** Le front peut masquer une action, c'est le back qui la refuse.
- **Contrats** : les types JSON sont écrits une seule fois, en Rust (`#[derive(TS)]`). `./scripts/gen-contracts.sh` génère `contracts/*.ts`, importés par le front via `@contracts/<Type>`. Les fichiers générés ne se modifient pas à la main.
- **Front** : un dossier par page dans `pages/` (`component.ts`, `template.html`, `template.scss`, `forms/<entité>/`), les appels API dans `services/`.
- **Qualité front** : `npm run lint` (angular-eslint, règles d'accessibilité comprises) et `npm run format` (Prettier) ; `libs/ui/` (Spartan) est exclu.
- **Tests API** : collection Bruno dans `bruno/`.

## Hors périmètre

- CI, déploiement, authentification.

## Questions ouvertes

- Base de test séparée (`firescrum_test`) pour que les tests ne vident plus la base de travail.
- Initialiser un dépôt git (rien n'est récupérable aujourd'hui).

## Recettes

Aucune recette fonctionnelle. Vérifications : build Docker, `/api/health`, lint, collection Bruno.

## Décisions

- **Axum 0.8 + SeaORM 2.0** : requêtes typées et statuts en enums Rust. SeaORM n'apporte pas de protection supplémentaire contre l'injection SQL (les requêtes étaient déjà paramétrées), mais évite les erreurs de colonnes et de valeurs.
- **Schéma en SQL brut** (`backend/migrations/0001_init.sql`) appliqué par `sea-orm-migration` : il utilise des contraintes CHECK et un index partiel, plus lisibles en SQL. Tant que rien n'est déployé et que la base est vide, ce fichier est modifié directement plutôt que d'empiler des migrations.
- **ts-rs** plutôt que des types TypeScript écrits à la main : un écart de contrat fait échouer le build du front. Les `i64` sont exportés en `number` (`TS_RS_LARGE_INT`).
- **Contrats dans `contracts/` à la racine**, conservés dans le projet : le build du front n'a pas besoin de Rust. Le build Docker du front part donc de la racine (`.dockerignore` ne garde que `frontend/` et `contracts/`).
- **Angular 22** : composants standalone, sans zone.js, Signal Forms, `@Service()`, `rxResource`.
- **Spartan** (portage Angular de shadcn/ui), style `vega`, thème `neutral`, Tailwind 4. Le composant `native-select` généré ne compilait pas : remplacé par un `<select>` natif avec la classe `.select` (`styles.css`).
- **Icônes** : `@ng-icons/material-icons` en 33.4, version imposée par Spartan.
- **ESLint + Prettier** plutôt que Biome : Biome ne vérifie pas les templates Angular.
- **MCP** : context7, angular-cli, spartan-ui, playwright (`.mcp.json`).
