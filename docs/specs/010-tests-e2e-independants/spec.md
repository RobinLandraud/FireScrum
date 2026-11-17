# 010 — Tests navigateur indépendants et environnements séparés

**Statut** : Livrée

## Contexte

Les tests navigateur sont un seul script ([`tests/e2e/pages.mjs`](../../../tests/e2e/pages.mjs), 677 lignes) qui raconte une longue histoire : chaque vérification dépend de l'état laissé par les précédentes. Conséquences :

- une vérification ne se lit pas, ne se lance pas et ne se débogue pas seule ;
- un échec fait tomber les suivantes ;
- un KO ne laisse qu'une capture d'écran, sans trace des étapes.

Les erreurs console sont affichées en fin de run mais ne font rien échouer.

Autre problème : une seule configuration Docker Compose sert à la fois au travail et à la prod. Les tests ont leur fichier à part, mais rien ne sépare le dev de la prod.

On passe au lanceur standard `@playwright/test`, avec des tests rangés par entité, chacun sur une base vide. On sépare les environnements Compose (prod, dev, test), et on lance le tout avec un `justfile`. Aucune règle métier et aucun code de l'app ne changent.

## Comportement attendu

### Lancer les tests

| Commande | Effet |
|----------|-------|
| `just tests` | Toutes les suites (api, bruno, e2e) sur la stack de test (port 4201, base jetable) |
| `just tests e2e` | Les suites citées seulement |
| `just e2e` | La suite e2e seule |
| `just e2e --grep R49` | Seulement les tests dont le titre contient R49 |
| `just e2e sprint/` | Seulement les tests du dossier `sprint/` |

- Les tests tournent toujours dans Docker (image `mcr.microsoft.com/playwright:v1.64.1-noble`) : il n'y a pas de navigateur à installer sur le poste.
- La stack de travail (port 4200) et sa base ne sont jamais touchées.
- À la fin du run, un rapport HTML est disponible dans `tests/e2e/report/` (ignoré par git). Chaque test en échec y a sa **trace Playwright** (étapes, captures, DOM, réseau), qu'on ouvre dans le Trace Viewer.

### Organisation des tests

```
tests/e2e/
├── package.json          ← @playwright/test 1.64.1 + pg (types dans l'IDE, npm ci dans Docker)
├── playwright.config.ts  ← baseURL depuis BASE, 1 worker, 0 relance, rapport HTML, trace si échec
├── helpers.ts            ← fixtures (db, resetDb, errors, api), fabriques (createStory, startSprint…), localisateurs, drag(), expectModalSize()
├── feature/      logic.spec.ts (R02, R02c, R03b ×4, R03f, R47) · rules.spec.ts (R03g)
├── user-story/   logic.spec.ts (backlog vide, R03 ×2, R03c ×3, R07, R46) · rules.spec.ts (R03d, R03 titre blanc)
├── task/         logic.spec.ts (R05, R05b ×2, R05c, R12, R12b, R12c, R54) · rules.spec.ts (R14, R15, R15b)
├── sprint/       logic.spec.ts (R08, R09, R10, R11, R16, R16b, R17 ×2, R17b, R18, R19, R48) · rules.spec.ts (R08, R17 : lancement bloqué sans US)
└── layout/       style.spec.ts (R40–R44, page Planning, R49)
(feature/ et sprint/ ont aussi un seed.ts : un jeu de données partagé par plusieurs tests)
```

- Les tests sont rangés par entité, puis par sous-catégorie : `logic` (comportement), `rules` (règles métier refusées), `style` (affichage). Une sous-catégorie n'a de fichier que si elle a des tests.
- Chaque `check()` actuel devient un `test()`. Son titre est l'ID suivi du libellé français actuel, par exemple `R49 toutes les modals ont la même taille, quel que soit l'onglet`. Aucune vérification n'est perdue.
- Au-dessus de chaque `describe`, un commentaire renvoie à la spec d'origine : `// Spec 004-taches : R05c, R12, R12b, R12c, R54`.
- **Base vide avant chaque test** : chaque test crée ses données de départ par l'API, puis utilise l'UI seulement pour ce qu'il vérifie.
- La fenêtre reste en 1280 × 800. R42 (mobile) et R44 (thème système sombre) changent la fenêtre ou le thème par `test.use`.
- Les assertions Playwright (`toBeVisible`, `toHaveValue`, `toBeChecked`…), qui réessaient d'elles-mêmes, remplacent `check()`, `visible()`, `hasValue()`, `isChecked()` et `until()`.
- **Une erreur JavaScript ou une erreur console inattendue fait échouer le test.** Les réponses HTTP 400, 404 et 409, provoquées exprès par certains tests, sont ignorées.
- Les captures « de doc » (`shot()`) sont supprimées : le rapport et les traces les remplacent.

### Environnements Docker Compose

Les ports viennent du `.env` de chaque machine (modèle `.env.template`, en blocs db / back / front) : `FRONTEND_PORT`, `BACKEND_PORT`, `DB_PORT`. Les trois environnements ont les mêmes variables.

| Fichier | Rôle | Ports publiés |
|---------|------|---------------|
| `docker-compose.yml` | Base commune, et configuration de prod | front `FRONTEND_PORT` |
| `docker-compose.dev.yml` | Stack de travail, base `./data` | en plus : db `127.0.0.1:DB_PORT`, backend `127.0.0.1:BACKEND_PORT` |
| `docker-compose.test.yml` | Stack de test, base en mémoire (tmpfs) | en plus : db `127.0.0.1:DB_PORT` ; `test.sh` impose front 4201 et db 5443 |

Le `justfile` à la racine contient :

| Recette | Effet |
|---------|-------|
| `just dev` | Lance la stack de travail (port 4200) |
| `just prod` | Lance la stack de prod (port 80) |
| `just down` | Arrête la stack de dev ou de prod |
| `just tests [suites]` | Lance les suites de tests |
| `just e2e [args]` | Lance la suite e2e, avec les options passées à Playwright |

Dev et prod partagent le projet Compose `firescrum` et la base `data/` : `just prod` remplace la stack de dev.

Le README gagne une section **Prérequis** : Docker avec Compose, `just`, et Node (pour les types dans l'IDE).

## Règles métier

- Aucune règle ajoutée ni modifiée.

## Hors périmètre

- Le code de l'app (front, back) : aucun changement.
- Le workflow GitHub Actions qui lance les tests : prévu dans une autre PR.
- De nouvelles vérifications : on migre l'existant, sans rien ajouter.

## Questions ouvertes

- Aucune.

## Recettes

Nouvelle section « Outillage » dans le [cahier de recettes](../../cahier-de-recettes.md) :

- [ ] **R56** — `just tests` → toutes les suites passent ; la suite e2e contient tous les IDs de l'ancien script.
- [ ] **R57** — `just e2e sprint/` → seuls les tests de sprint tournent, et passent sans les autres fichiers.
- [ ] **R58** — `just e2e --grep R49` → seul R49 tourne.
- [ ] **R59** — Faire échouer un test exprès → le rapport HTML le montre avec sa trace (étapes, captures, DOM).
- [ ] **R60** — Lancer `just tests` avec la stack de travail lancée et des données dedans → elle tourne toujours, sa base est inchangée.
- [ ] **R61** — `just dev` → l'app répond sur `FRONTEND_PORT`, la base et le backend sur `127.0.0.1` (`DB_PORT`, `BACKEND_PORT`) ; `just prod` → seule l'app est publiée.

## Décisions

- **`@playwright/test` plutôt qu'une boucle `check()` maison** : isolation, filtre par ID, rapport HTML et traces sont fournis.
- **Données de départ par l'API, action et vérification par l'UI** : les tests sont courts et indépendants.
- **Base vidée avant chaque test par `TRUNCATE`** des 6 tables métier (la ligne `project`, créée par la migration, est gardée) : cela prend quelques millisecondes. Redémarrer les conteneurs prendrait environ 10 s par groupe et obligerait à fusionner plusieurs rapports.
- **Tests rangés par entité puis par sous-catégorie** plutôt que par parcours : chaque fichier se lit seul.
- **Erreurs console bloquantes, avec 409 ignoré** : R14 et R15b provoquent un 409 exprès.
- **Trace seulement en cas d'échec, 0 relance** : les runs restent rapides, et une relance cacherait les tests instables.
- **Un fichier Compose par environnement plutôt que des `profiles`** : les profils activent des services mais ne changent ni les ports ni les volumes d'un service.
- **`justfile` plutôt qu'un `package.json` racine** : il est neutre vis-à-vis des langages dans un monorepo Rust + TS. La logique reste dans `scripts/test.sh`.
- **`tests/e2e/package.json` gardé** : il donne les types à l'IDE et fixe la version de Playwright à un seul endroit (`npm ci` dans le conteneur).
- **Fixtures Playwright** dans `helpers.ts` (`db` de portée worker, `resetDb` et `errors` automatiques, `api` sur la fixture `request`) : les specs importent `test` et `expect` de `helpers.ts` et ne voient pas la mécanique ; les appels API apparaissent dans la trace.
- **Fonctions de localisation plutôt que page objects**, **fonctions fabriques plutôt qu'un Builder** : la suite (51 tests) est trop petite pour justifier des classes ou un mini-langage.
- **Un jeu de données partagé par dossier quand plusieurs tests partent du même état** (`feature/seed.ts`, `sprint/seed.ts`) : un sprint en cours, clôturé ou reporté se prépare en une ligne.
- **R08 et R17 découpés** : la partie « lancement bloqué sans US » passe dans `sprint/rules.spec.ts` ; 49 vérifications deviennent 51 tests.
- **Ports en variables du `.env`** (`FRONTEND_PORT`, `BACKEND_PORT`, `DB_PORT`), mêmes noms dans tous les environnements : 5432 et 5433 étaient déjà pris sur le poste de dev, et chaque machine a ses contraintes. La stack de test impose les siens depuis `test.sh` (prioritaires sur le `.env`), car elle tourne à côté de la stack de dev.
- **Pas de `docker-compose.prod.yml`** : le front est publié dans les trois environnements, donc dans la base ; la prod n'a rien à surcharger.
- **Base et backend publiés sur `127.0.0.1` seulement** : sans préfixe, Docker les ouvrirait au réseau local en passant par-dessus le pare-feu, avec des identifiants faibles.
- **`node_modules` du conteneur dans un volume anonyme** : les tests tournent directement dans `tests/e2e` (rapport et traces au bon endroit) sans utiliser ni écraser le `node_modules` local, qui ne sert qu'aux types de l'IDE.
