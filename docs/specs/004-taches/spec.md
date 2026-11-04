# 004 — Tâches d'une US

**Statut** : Livrée (gestion dans le Backlog ; le déplacement entre colonnes relève de la page Sprint)

## Contexte

Une US se découpe en tâches. Chaque tâche a des points de validation qui doivent tous être cochés avant qu'elle soit terminée.

## Comportement attendu

Dans l'onglet **Tasks** de la modal d'une US (création ou modification) :

- **Liste** : une ligne par tâche, avec seulement son nom, et deux icônes : modifier (crayon) et supprimer (corbeille).
- **Formulaire du bas**, sur toute la largeur de la modal, champs empilés :
  - « Task » : nom de la tâche (obligatoire) ;
  - « Description » : texte plus long (facultatif) ;
  - « Points de validation » : un point par ligne.
- **Ajouter** : « Ajouter la tâche » ajoute la tâche à la liste et vide le formulaire.
- **Modifier** : l'icône crayon remplit le formulaire avec la tâche et surligne sa ligne ; le bouton devient « Modifier la tâche », avec un bouton « Annuler ». Après validation ou annulation, le formulaire revient à vide avec « Ajouter la tâche ».
- **Supprimer** : l'icône corbeille retire la tâche, avec un toast de confirmation.
- Sur une US terminée (Done), la liste est en lecture seule : pas de formulaire ni d'icônes.
- En création d'US, ces actions portent sur des brouillons ; en modification, elles sont enregistrées tout de suite.

## Règles métier

- Le nom d'une tâche est obligatoire (400).
- Modifier une tâche synchronise ses points par libellé : un point conservé garde son état coché, un point retiré est supprimé, un nouveau libellé crée un point non coché.
- On ne peut pas ajouter de point à une tâche terminée (409) : elle aurait un point non coché.
- Supprimer une tâche supprime ses points de validation.
- Une tâche se crée au statut `todo`.

## Hors périmètre

- Déplacement entre colonnes et cochage des points (page Sprint).
- Assignation à une personne (lot 3).

## Questions ouvertes

- Demander une confirmation avant de supprimer une tâche ? (aujourd'hui : suppression immédiate)

## Recettes

R05, R05b, R05c, R14, R15.

## Décisions

- **Nom + description** : la tâche avait au départ une seule « description », affichée comme son nom. Un champ `title` a été ajouté.
- **Le formulaire de tâche n'appelle pas l'API** : il émet les valeurs saisies, et la modal de l'US décide de les enregistrer (US existante) ou de les garder en brouillon (création).
- **Synchronisation par libellé** plutôt que remplacement de tous les points : modifier le nom d'une tâche ne décoche pas ses points.
- **Bouton « Annuler »** ajouté en mode modification, pour sortir sans enregistrer.
