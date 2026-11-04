# 003 — Page Backlog

**Statut** : Livrée

## Contexte

Le backlog est l'endroit où l'on crée les user stories et où le PO les valide avant de les embarquer dans un sprint. Il doit montrer d'un coup d'œil ce qui est à valider, prêt ou terminé.

## Comportement attendu

- **En-tête** : titre « Backlog », onglets **Sandbox** / **Accepted** / **Done** avec le nombre d'US de chacun, bouton **New Story** à droite.
  - Sandbox : US pas encore validées.
  - Accepted : US validées, pas encore terminées.
  - Done : US terminées.
- **Cards** : une card par US, avec son titre et sa feature (ou « Sans feature »).
- **Modal d'US**, la même pour la création (« New Story ») et la modification (clic sur une card) :
  - en-tête : titre de l'US et badge de statut (ou « Nouvelle user story ») ;
  - onglet **Details** : titre, description, vélocité (liste Fibonacci), feature (facultative). Bouton « Créer l'US » ou « Enregistrer » ;
  - onglet **Tasks (n)** : liste et saisie des tâches (voir [004 — Tâches](../004-taches/spec.md)) ;
  - bouton **Accepter** en bas de la modal, pour une US en Sandbox : elle passe dans Accepted.
- À la création, les tâches restent en brouillon dans la modal ; elles sont créées avec l'US.
- Après « Créer l'US » ou « Enregistrer », la modal se ferme et la card est à jour. Après une création, l'onglet Sandbox s'affiche.
- La modal se rouvre toujours sur l'onglet Details.
- Les erreurs de l'API s'affichent dans un toast ; la modal reste ouverte.

## Règles métier

- Une US se crée avec au minimum un titre et une tâche : « Créer l'US » reste grisé sinon, avec le message « Ajoute au moins une tâche dans l'onglet Tasks. ». Le back refuse aussi une US sans tâche (400).
- L'US et ses tâches sont créées ensemble : tout ou rien.
- Le Backlog est le seul endroit où l'on crée une US.

## Hors périmètre

- Suppression d'une US.
- Droits PO / Dev : tout le monde peut valider (lot 3).

## Questions ouvertes

- Les tâches en brouillon sont perdues si on ferme la modal sans créer l'US : les garder ?
- Modification d'une US en sprint ou terminée (voir [002](../002-modele-et-api/spec.md)).

## Recettes

R03, R03c, R03d, R04, R07.

## Décisions

- **Onglets** (un statut à la fois) plutôt que trois colonnes côte à côte.
- **Une seule modal** pour créer et modifier, pour que l'utilisateur retrouve les mêmes champs aux mêmes endroits.
- **Création atomique côté back** (`POST /user-stories` avec `tasks`) plutôt que plusieurs appels depuis le front : la règle « au moins une tâche » est vérifiée par le serveur, et un échec ne laisse pas d'US à moitié créée.
- **Corps séparés** : `NewUserStory` (avec les tâches) pour la création, `UserStoryUpdate` (sans les tâches) pour la modification ; les tâches d'une US existante se gèrent une par une.
- **Card hors du composant** : la card est dans le template de la page, le composant `forms/user-story/component.ts` est le contenu de la modal, recréé à chaque ouverture (état remis à zéro).
