# 002 — Modèle de données et API (lot 1)

**Statut** : Livrée (l'API du sprint est prête ; la page Sprint reste à faire)

## Contexte

Représenter le travail d'un projet (features, user stories, tâches, points de validation) et son déroulé en sprints, avec les règles Scrum du lot 1. Détail des routes : [api.md](../../api.md).

## Comportement attendu

- **Projet** : un seul projet (« FireScrum »), créé avec le schéma.
- **Feature** : titre, description. Contient des US.
- **User story** : titre, description, vélocité, feature facultative. Statut : `validated` (acceptée par le PO) et `done` (terminée à la clôture d'un sprint).
- **Tâche** : nom, description, statut (`todo`, `in_progress`, `in_review`, `done`), points de validation.
- **Point de validation** : libellé, coché ou non.
- **Sprint** : nom, statut `active` ou `closed`, liste d'US.

## Règles métier

- La vélocité d'une US est une valeur de Fibonacci : 1, 2, 3, 5, 8, 13, 21.
- Une US peut exister sans feature ; une US retirée d'une feature redevient sans feature.
- Une tâche ne passe en `done` que si tous ses points de validation sont cochés (sinon 409).
- Un seul sprint en cours à la fois (sinon 409).
- Seules les US validées et non terminées entrent dans un sprint (sinon 400).
- Au lancement, le sprint reçoit les US choisies **et** automatiquement les US reportées (non cochées à la clôture d'un sprint précédent, pas encore terminées), avec leurs tâches et leurs statuts.
- À la clôture, le PO indique les US vraiment finies : elles passent `done`. Les autres sont reportées au prochain sprint.
- *Modifié par la [007](../007-page-sprint/spec.md) : plus de report automatique ; à la clôture, chaque US est close, reportée (pré-cochée au lancement suivant) ou retournée au backlog ; `finished` est remplacé par `outcome` et une photo des tâches.*
- Un sprint clôturé ne peut pas l'être une seconde fois (409).
- La vélocité totale d'un sprint est la somme des vélocités de ses US.

## Hors périmètre

- Pourcentages d'avancement, dates de sprint (lot 2).
- Utilisateurs, assignation, droits PO / Dev (lot 3).
- Suppression de features, d'US ou de sprints.
- Multi-projet (prévu plus tard).

## Questions ouvertes

- Peut-on modifier une US dans un sprint en cours ou terminée ? Aujourd'hui oui : changer sa vélocité modifie le total du sprint en cours.

## Recettes

R01, R04, R06, R08 à R19 (lot 1).

## Décisions

- **Historique des sprints** : table `sprint_user_story(sprint_id, user_story_id, finished)`. Une US reportée apparaît dans l'ancien sprint avec `finished = false` et dans le nouveau avec `finished = null` (sprint en cours). Le sprint passé garde ainsi sa composition réelle.
- **Report automatique** au lancement plutôt qu'une sélection manuelle : une US non finie ne peut pas être oubliée.
- **Statuts en codes anglais** (`todo`, `active`…) côté API et base ; les libellés français sont côté front.
- **`project_id` sur l'US** (en plus de la feature) : l'US peut exister sans feature, et le multi-projet est préparé.
- **Feature supprimée → US sans feature** (`ON DELETE SET NULL`), même s'il n'y a pas encore de route de suppression.
- **Erreurs** : `{ "error": "<message>" }` ; 400 donnée invalide, 404 introuvable (y compris clé étrangère inexistante), 409 règle métier, 422 JSON mal formé ou valeur inconnue (ex. statut hors liste).
