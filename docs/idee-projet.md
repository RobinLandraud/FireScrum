# FireScrum — Idée du projet

## Objectif

Outil de suivi Scrum multi-utilisateurs permettant d'organiser le travail d'un projet en features, user stories et tâches, et de suivre leur avancement sprint par sprint.

## Hiérarchie

```
Projet
 ├─ Feature        (% d'avancement calculé à partir de ses US)
 └─ User Story     (vélocité + % d'avancement calculé à partir de ses tâches)
     │              rattachée à une feature, ou sans feature
     └─ Tâche      (nom + description + points de validation + statut)
```

## Fonctionnalités principales

### Utilisateurs
- Plusieurs utilisateurs peuvent utiliser l'outil.
- Deux types de compte : **PO** et **Dev**.
- MVP : pas d'authentification (ni identifiant ni mot de passe). On choisit l'utilisateur courant dans une liste. L'authentification est prévue pour plus tard.

| Action | PO | Dev |
|--------|:--:|:---:|
| Créer des features / US / tâches | ✅ | ❌ |
| Lancer et terminer un sprint | ✅ | ❌ |
| Valider dans le backlog | ✅ | ❌ |
| Déplacer une tâche / cocher ses points de validation | ✅ | ✅ |

### Tâche
- Une description.
- Une personne assignée.
- Une liste de points de validation (critères à cocher).
- Un statut, correspondant à une colonne du tableau :
  `À faire` → `En cours` → `En validation` → `Terminé`
- Une tâche ne peut passer en `Terminé` que si **tous** ses points de validation sont validés.

### User Story
- Une vélocité (estimation de l'effort), choisie dans la suite de Fibonacci : 1, 2, 3, 5, 8, 13, 21…
- Un pourcentage d'avancement : nombre de tâches `Terminé` / nombre total de tâches de l'US.
- Une US est terminée quand elle est à 100 %.

### Feature
- Un pourcentage d'avancement : nombre d'US terminées / nombre total d'US de la feature (la vélocité n'entre pas en compte).
- Il se met à jour automatiquement quand une US associée passe à 100 % (ou en repart).

### Cadre
- Barre latérale : logo, nom du projet et les pages (Backlog, Features, Planning, Sprint) avec leur icône. Repliable en colonne d'icônes sur grand écran, ouverte par-dessus la page sur mobile.
- En-tête : bouton de la barre latérale et bascule clair / sombre (préférence du système au premier lancement, puis choix mémorisé).
- Style repris du template TailAdmin Angular (MIT).

### Page Sprint
- Le PO lance et termine les sprints depuis cette page : un seul bouton, « Nouveau sprint » ou « Clôturer le sprint » selon l'état du dernier sprint.
- Lancement : nom du sprint et choix des US acceptées (au moins une) ; les US reportées au sprint précédent sont pré-cochées.
- Un sprint a une date de début et une date de fin. La date de fin est indicative : elle ne bloque rien et ne clôture pas le sprint automatiquement.
- Clôture d'un sprint : pour chaque US, le PO coche « Clore » (l'US est terminée) ou « Reporter » (pré-cochée au prochain lancement) ; sans case, l'US retourne dans le backlog. Les US gardent leurs tâches et leurs statuts. Pré-cochage selon l'état des tâches (lot 1 : « Clore » si toutes sont Terminé, « Reporter » sinon), puis selon le % (lot 2 : les US à 100 % sont pré-cochées « Clore »).
- Affiche le sprint actuel et permet de consulter les sprints passés (menu déroulant), en lecture seule, tels qu'ils étaient à la clôture.
- Affiche la vélocité totale du sprint (somme des vélocités de ses US).
- Affichage en lignes : une ligne par user story.
- Sur chaque ligne, les tâches de l'US sont réparties dans les colonnes `À faire` / `En cours` / `En validation` / `Terminé`, et on les déplace d'une colonne à l'autre (comme une todo-list / kanban). Un clic sur une tâche ouvre sa modal : points de validation à cocher, modification, suppression. Une carte « + » ajoute une tâche.

```
              | À faire | En cours | En validation | Terminé |
US-1 (5) 33%  | [T1]    | [T2]     |               | [T3]    |
US-2 (3)  0%  |         | [T4]     | [T5]          |         |
```

### Page Backlog
- Onglets **Sandbox** (US à valider), **Accepted** (validées, pas encore terminées) et **Done** (terminées).
- Bouton « New Story » : création d'une US dans la même modal que la modification (onglets Details et Tasks), avec ou sans feature. Il faut au minimum un titre et une tâche. C'est le seul endroit où l'on crée une US.
- US affichées en cards (titre + feature associée). Un clic ouvre une modal à deux onglets : **Details** (formulaire de création pré-rempli pour modifier titre, description, vélocité, feature) et **Tasks** (liste des tâches par nom, avec icônes modifier et supprimer sur chaque ligne ; formulaire du bas : nom, description, points de validation, en mode ajout ou modification). Bouton de validation (Sandbox → Accepted) en bas de la modal.
- Seul le PO peut valider.
- Une US terminée (onglet Done) est en lecture seule.

### Page Features
- Features affichées en cards.
- « New Feature » et le clic sur une card ouvrent la même modal, à deux onglets : **Details** (titre, description) et **User stories** (liste des US de la feature, avec un bouton pour retirer chacune ; ajout d'une US sans feature via une recherche approximative sur le titre : lettres dans l'ordre, accents et majuscules ignorés ; Entrée ajoute le premier résultat).
- On n'y modifie pas les US : seulement ajouter ou retirer.

### Page Planning
- Calendrier des sprints (à venir). Le lancement d'un sprint est sur la page Sprint.

## Hors périmètre (à confirmer)

- Intégration Git.
- Authentification (identifiant / mot de passe) : prévue après le MVP.
- Multi-projets : le MVP gère un seul projet. Le multi-projets est prévu pour plus tard.
