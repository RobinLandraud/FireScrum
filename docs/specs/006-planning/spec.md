# 006 — Page Planning

**Statut** : Livrée — remplacée par la [007 — Page Sprint](../007-page-sprint/spec.md) : le lancement est passé sur la page Sprint, les US reportées y sont pré-cochées (plus de report automatique) et un sprint ne se lance plus sans US. La page Planning est vide en attendant le calendrier.

## Contexte

Le lancement d'un sprint est séparé du Backlog : on y choisit, parmi les US acceptées, celles à embarquer.

## Comportement attendu

- **Aucun sprint en cours** :
  - champ « Nom du sprint » et bouton « Lancer le sprint (n US, x pts) », mis à jour à chaque sélection ;
  - une card par US acceptée, avec une case à cocher, son titre et sa vélocité ;
  - rappel : « Les US non finies du sprint précédent sont reportées automatiquement. » ;
  - sans US acceptée : « Aucune US acceptée. Accepte des US depuis le Backlog. ».
- Après le lancement : toast « Sprint « nom » lancé », puis redirection vers la page Sprint.
- **Un sprint en cours** : message avec un lien vers le sprint, son nombre d'US et sa vélocité totale ; on ne peut pas en lancer un autre.
- On ne crée pas d'US sur cette page.

## Règles métier

- Seules les US acceptées et non terminées sont proposées (le back refuse les autres : 400).
- Le nom du sprint est obligatoire.
- Un sprint peut être lancé sans US cochée : il reçoit alors seulement les US reportées.
- Un seul sprint en cours (409).

## Hors périmètre

- Dates de début et de fin (lot 2).
- Clôture du sprint (page Sprint).

## Questions ouvertes

- Aucune.

## Recettes

R08, R09.

## Décisions

- **Lancement sur une page dédiée** plutôt que dans le Backlog : le Backlog reste centré sur la création et la validation des US.
- **Total de points affiché sur le bouton**, pour voir la charge du sprint avant de le lancer.
