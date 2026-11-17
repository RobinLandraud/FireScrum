# 011 — Tests de l'API indépendants, au même endroit que les tests navigateur

**Statut** : Livrée

## Contexte

Les tests de l'API sont un script bash (`tests/api.sh`, 88 vérifications, supprimé par cette spec). Il a les défauts qu'avait l'ancien script e2e avant la spec 010 :

- c'est une seule histoire enchaînée, où les ids créés passent d'une vérification à l'autre (`$F`, `$A`, `$T1`…) ;
- un échec fait tomber les vérifications suivantes ;
- on ne peut pas lancer une vérification seule, et il n'y a pas de trace ;
- il faut `node -e` pour lire le JSON.

Bruno tourne aussi dans `just tests`. Pourtant, ses assertions ne vérifient que le chemin nominal, déjà couvert par `api.sh`, à une exception près : la route Health.

On porte `api.sh` dans Playwright, à côté des tests navigateur, avec les mêmes fixtures (base vide avant chaque test, fabriques), le même rapport et les mêmes traces. Bruno redevient un outil pour manipuler l'API à la main, et `just tests` devient la seule commande de test. Aucune règle métier ni aucun code de l'app ne change.

## Comportement attendu

### Lancer les tests

| Commande | Effet |
|----------|-------|
| `just tests` | Tous les tests, API et navigateur, sur la stack de test (port 4201, base jetable) |
| `just tests --back` | Tests de l'API seuls (sans navigateur, quelques secondes) |
| `just tests --front` | Tests navigateur seuls |
| `just tests --front --grep R49` | Filtre par ID de recette ; tout autre option est passée à Playwright |
| `just tests --ui` | Mode UI de Playwright sur http://localhost:9324, jusqu'à Ctrl+C (combinable avec `--back` / `--front`) |
| `KEEP=1 just tests` | Laisse la stack de test lancée à la fin |

- `just tests` construit la stack de test, la lance, attend qu'elle réponde, joue les tests, puis l'arrête, même en cas d'échec.
- Un seul run Playwright, donc un seul rapport HTML (`tests/report/`), avec une trace pour chaque test en échec. Dans la trace d'un test API, l'onglet *Network* montre chaque requête et chaque réponse.
- La stack de travail (port 4200) et sa base ne sont jamais touchées.
- Bruno n'est plus lancé par les tests. La collection `bruno/` reste là pour manipuler l'API à la main (environnements `local` et `test`), avec ses assertions, qui s'affichent dans l'IDE Bruno.

### Organisation des tests

```
tests/
├── package.json, package-lock.json   ← @playwright/test, pg, @types (remontés de tests/e2e/)
├── Dockerfile, entrypoint.sh         ← image du lanceur ; entrypoint traduit --back / --front / --ui
├── playwright.config.ts              ← projets api (testDir api/) et e2e (testDir e2e/, viewport, trace)
├── fixtures.ts                       ← test étendu (db, resetDb, api, call), fabriques : partagés
├── api/
│   ├── project/   logic.spec.ts  (R01, Health)
│   ├── feature/   logic.spec.ts  (R02, R02b, R02c, R03, R06) · rules.spec.ts (R02, R02b, R02c, R03g)
│   ├── user-story/ logic.spec.ts (R03, R03c, R03f, R07) · rules.spec.ts (R03, R03c, R03e, R04)
│   ├── task/      logic.spec.ts  (R05, R05b, R05c, R12, R15, R18) · rules.spec.ts (R05, R05b, R05c, R05d, R12, R14, R15b)
│   └── sprint/    logic.spec.ts  (R09, R10, R11, R16, R17, R17b, R18, R19, R19b) · rules.spec.ts (R08, R09, R16, R17, R17b)
└── e2e/
    ├── helpers.ts                    ← propre à l'UI : fixture errors (console), localisateurs, drag()
    └── feature/ … (inchangé)
```

- **Un test par comportement** : les vérifications d'`api.sh` qui portent sur une même requête deviennent plusieurs `expect` d'un même test. Chaque `expect` garde le libellé de la vérification comme message, par exemple `expect(story.feature_id, 'US rattachée à la feature')`. **Aucune vérification n'est perdue.**
- Le titre d'un test commence par son ID de recette : `R05d ajouter une tâche à une US terminée refusé`. Au-dessus de chaque `describe`, un commentaire renvoie à la spec d'origine, comme en e2e.
- Chaque test part d'une base vide et crée ses données par les fabriques. Plus aucun id ne passe d'un test à l'autre. Les identifiants inexistants restent `9999`.
- Les tests API n'utilisent que la fixture `request` : aucun navigateur n'est lancé.
- Un nouveau test vérifie la route **Health** (200, `db: true`). C'était la seule vérification propre à Bruno.
- Un commentaire `// TODO` dans `fixtures.ts` prévoit de typer les réponses avec `contracts/` plus tard.

### Lancement

- `scripts/test.sh` est supprimé. La recette `tests` du `justfile` devient une recette *shebang* (bash) :
  - elle construit les images de la stack de test et du lanceur ;
  - elle lance `docker compose run tests …` en lui passant les arguments tels quels. `run` démarre la stack et attend que le front soit *healthy* ;
  - elle arrête la stack à la fin, même en cas d'échec (`trap`).
- Le service Compose `e2e` est renommé **`tests`**. Il monte `./tests`, son image est construite depuis `tests/Dockerfile`, et il dépend du front de test (`depends_on: service_healthy`).
- Le port du front de test vient du `.env` : `TEST_FRONTEND_PORT` (4201 par défaut).
- `tests/api.sh` est supprimé.

## Règles métier

- Aucune règle ajoutée ni modifiée. Les tests vérifient les règles existantes de [api.md](../../api.md).

## Hors périmètre

- Le code de l'app (front, back) et la collection Bruno : aucun changement.
- Le typage des réponses avec `contracts/` : prévu plus tard (`// TODO`).
- De nouvelles vérifications, sauf Health : on migre l'existant.
- Le workflow GitHub Actions : autre PR.

## Questions ouvertes

- Aucune.

## Recettes

Section « Outillage » du [cahier de recettes](../../cahier-de-recettes.md) :

- [ ] **R56** (modifié) — `just tests` → les tests API et navigateur passent ; les tests API contiennent toutes les vérifications de `api.sh` (comparaison des IDs et des libellés).
- [ ] **R57** (modifié) — `just tests --front e2e/sprint/` → seuls les tests navigateur de sprint tournent, et passent seuls.
- [ ] **R58** (modifié) — `just tests --front --grep R49` → seul R49 tourne.
- [ ] **R59** — Faire échouer un test API exprès → le rapport le montre avec sa trace, et l'onglet *Network* affiche la requête et la réponse.
- [ ] **R60** — Lancer `just tests` avec la stack de travail lancée et des données dedans → elle tourne toujours, sa base est inchangée.
- [ ] **R62** — `just tests --back` → seuls les tests API tournent, sans navigateur, en quelques secondes.
- [ ] **R63** — `just tests --ui` → le mode UI s'ouvre sur http://localhost:9324, avec les deux projets api et e2e ; Ctrl+C arrête le mode UI puis la stack de test.

## Décisions

- **Tests API dans Playwright plutôt qu'en bash, Hurl ou Bruno** : Playwright était déjà installé, avec les fixtures, les fabriques, le rapport, les traces et le mode UI. Un seul lanceur sert les deux niveaux de tests.
- **Un dossier `tests/api/` à côté de `tests/e2e/`, avec deux projets Playwright**, plutôt qu'un `api.spec.ts` dans chaque entité : on les lance séparément (`--back` / `--front`), chacun a ses réglages (navigateur, viewport, surveillance de la console pour l'e2e seulement), et `e2e` garde un nom juste.
- **Même rangement qu'en e2e** (entité, puis `logic` / `rules`) : une seule convention dans tout `tests/`.
- **Un test par comportement**, chaque vérification gardée comme `expect` avec son libellé : 47 tests lisibles (plus Health) au lieu de 88 tests qui recréeraient chacun les mêmes données. Une comparaison automatique a confirmé que les 88 libellés d'`api.sh` sont tous présents, avec leur ID dans le titre du test.
- **Un seul run, un seul rapport** : le choix de ce qui tourne passe par des options (`--back`, `--front`, `--grep`), au lieu de suites séparées qui écraseraient le rapport.
- **`--back`, `--front` et `--ui` traduits par `entrypoint.sh`** : toute la traduction des options est dans l'image, et le `justfile` transmet les arguments sans les lire.
- **`scripts/test.sh` remplacé par une recette shebang** : sans Bruno ni suites, il ne restait que lancer, attendre et arrêter la stack. Le `trap` marche dans une recette shebang.
- **Bruno sorti des tests** : ses assertions ne vérifiaient que le chemin nominal, déjà couvert. La collection reste l'outil pour manipuler l'API à la main.
- **La fixture `errors` reste propre à l'e2e** : elle dépend de `page`, et elle lancerait un navigateur pour chaque test API.
- **Fixture `call` à côté de `api`** : `api` prépare les données et lève une erreur si la réponse n'est pas OK ; `call` renvoie la réponse brute pour vérifier un 400, un 404 ou un 409. Même signature, préfixe `/api` à un seul endroit, et un test de règle tient sur une ligne.
- **Compose attend la stack, pas le script** : un healthcheck sur le front de test (`/api/health`, qui traverse nginx, le backend et la base) et `depends_on: service_healthy` sur le service `tests` remplacent la boucle `curl` du script. Le healthcheck vise `127.0.0.1` : dans l'image alpine, `localhost` se résout d'abord en IPv6, que nginx n'écoute pas.
- **`TEST_FRONTEND_PORT` dans le `.env`** plutôt qu'un port en dur dans la recette : tous les ports se règlent au même endroit, chaque machine a ses valeurs.
- **Nettoyage par `--profile tests down --remove-orphans`** : un conteneur lancé par `run` (mode UI interrompu, par exemple) survivait à un simple `down` et bloquait le port 9324. Il faut les deux options : chacune seule ne le supprime pas.
- **R02b, R03e, R05d, R19b ajoutées au cahier de recettes** : elles n'existaient que dans `api.sh`.
