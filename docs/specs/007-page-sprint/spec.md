# 007 — Page Sprint

**Statut** : Livrée

## Contexte

La page Sprint est encore vide : on ne peut ni suivre l'avancement des tâches, ni clôturer un sprint, ni consulter les sprints passés. Le lancement d'un sprint est aujourd'hui sur la page Planning, qui doit à terme devenir un calendrier.

Cette spec regroupe toute la vie d'un sprint sur une seule page : lancement, suivi en kanban, clôture et historique. Elle termine le lot 1 (recettes R10 à R19).

## Comportement attendu

### En-tête de la page

- **Menu déroulant des sprints** : les sprints clos d'abord, puis le sprint actuel en dernier, sélectionné par défaut. S'il est en cours, il porte la mention « en cours » et une couleur différente.
- **Vélocité totale** du sprint sélectionné.
- **Un seul bouton, tout à droite** :
  - « Nouveau sprint » si le dernier sprint est clos, ou s'il n'y a aucun sprint ;
  - « Clôturer le sprint » si le dernier sprint est en cours.
- **Aucun sprint** : le menu est masqué, la page affiche « Aucun sprint pour l'instant. » et le bouton « Nouveau sprint ».

### Tableau du sprint sélectionné

- **Une ligne par US**, avec un en-tête : titre, feature (ou « Sans feature ») et vélocité.
- **Les tâches en kanban** dans les colonnes À faire, En cours, En validation et Terminé.
- **Carte de tâche** : nom de la tâche et avancement de ses points (ex. « 1/2 »).
- **Déplacement** : une tâche se déplace vers n'importe quelle colonne, y compris depuis Terminé, mais reste sur la ligne de son US.
- **Ordre** : dans une colonne, les tâches sont triées par ordre de création. Pas de réordonnancement manuel.
- **Arrivée refusée dans Terminé** : si un point n'est pas coché, la tâche revient à sa place avec un message d'erreur.
- **Carte « + »**, en dernier dans la colonne À faire de chaque US : elle ouvre la modal de tâche, vide. La nouvelle tâche arrive dans À faire.

### Modal de tâche

- En haut, **les points de validation à cocher**.
- En dessous, **le même formulaire que dans le Backlog** : nom, description, points un par ligne, avec « Modifier la tâche » (ou « Ajouter la tâche » depuis la carte « + »).
- **Icône corbeille** : supprime la tâche immédiatement, avec un toast de confirmation.

### Sprint clos

- **Photo à la clôture** : le sprint clos affiche les tâches de chaque US telles qu'elles étaient au moment de la clôture (statut, points cochés), même si une US reportée a continué d'avancer depuis.
- **Lecture seule** : pas de déplacement, pas de modification, pas de case à cocher, pas de carte « + ».
- **Un clic sur une tâche** l'ouvre en consultation : nom, description, points cochés ou non, tels qu'à la clôture.
- **Chaque ligne d'US affiche son sort** : « Close », « Reportée » ou « Retournée au backlog ».

### Lancement d'un sprint (modal)

- **Nom du sprint**, obligatoire.
- **US acceptées en cards**, avec leur feature, leur vélocité et une case à cocher.
- **US reportées** au sprint précédent : elles apparaissent comme les autres US acceptées, mais déjà cochées. Le PO peut les décocher.
- **Bouton « Lancer le sprint (n US, x pts) »**, grisé tant qu'aucune US n'est cochée. Le total compte les US pré-cochées dès l'ouverture.
- **Après le lancement**, le menu sélectionne le nouveau sprint.

### Clôture d'un sprint (modal)

- **Deux colonnes de cases par US**, « Clore » et « Reporter ». Cocher l'une décoche l'autre.
- **Pré-cochage** à l'ouverture :
  - « Clore » si toutes les tâches de l'US sont Terminé ;
  - « Reporter » sinon, même si aucune tâche n'a commencé.
- **Aucune case n'est jamais pré-cochée à vide** : pour renvoyer une US au Backlog, le PO décoche.
- **Le PO peut corriger** chaque case, y compris clore une US inachevée.
- **Sort de chaque US après la clôture** :
  - **Clore** : l'US est terminée et passe dans l'onglet Done du Backlog ;
  - **Reporter** : elle sera pré-cochée au prochain lancement ;
  - **aucune case** : elle retourne dans l'onglet Accepted du Backlog.
- **Après la clôture**, on reste sur ce sprint, en lecture seule, et le bouton devient « Nouveau sprint ».

### Effets sur les autres pages

- **Planning** : la page reste dans la navigation mais devient vide. Son contenu actuel (le lancement) part dans la page Sprint.
- **Backlog** : une US de l'onglet Done passe en lecture seule dans sa modal, détails compris.

## Règles métier

- Un seul sprint en cours à la fois (409).
- Un sprint ne peut pas être lancé sans US (400).
- Seules les US acceptées et non terminées peuvent entrer dans un sprint (400).
- **Le back n'ajoute plus automatiquement d'US au lancement** : les US « Reporter » sont seulement pré-cochées dans la modal.
- **À la clôture**, chaque US du sprint a un des trois sorts : close, reportée ou retournée au backlog. Une US ne peut pas être à la fois close et reportée (400).
- Un sprint clos ne peut plus être clôturé (409).
- À la clôture, une photo des tâches de chaque US du sprint (nom, description, statut, points cochés) est enregistrée. Le sprint clos affiche cette photo, qui ne change plus.
- Une US terminée ne peut plus être modifiée, ni ses tâches (409).
- Une tâche ne passe en Terminé que si tous ses points sont cochés (409).
- On ne peut pas décocher un point d'une tâche Terminé (409, « Sors d'abord la tâche de Terminé. »).
- Une US reportée ou retournée au backlog garde ses tâches et leurs statuts.
- Deux sprints peuvent porter le même nom.

## Hors périmètre

- Dates de début et de fin de sprint (lot 2).
- Pourcentages d'avancement (lot 2).
- Calendrier de la page Planning (spec séparée).
- Recherche parmi les US acceptées au lancement (la liste reste courte).
- Réordonnancement des tâches dans une colonne.

## Questions ouvertes

- Aucune.

## Recettes

À ajouter ou modifier dans le [cahier de recettes](../../cahier-de-recettes.md) :

- **Inchangées** : R10, R11, R12, R13, R14, R15, R18.
- **À modifier** :
  - R16 : clôturer en cochant « Clore » pour toutes les US ;
  - R17 : clôturer avec des US « Reporter » ; elles sont pré-cochées au lancement suivant ;
  - R19 : consulter un sprint clos dans le menu, en lecture seule, avec le sort de chaque US.
- **À ajouter** :
  - US sans case cochée à la clôture : elle retourne dans Accepted ;
  - pré-cochage des cases à l'ouverture de la clôture ;
  - lancement impossible sans US cochée ;
  - US reportée décochée au lancement : elle reste dans Accepted ;
  - création d'une tâche via la carte « + » ;
  - modification et suppression d'une tâche depuis le tableau ;
  - décochage refusé sur une tâche Terminé ;
  - US terminée en lecture seule dans le Backlog.

## Décisions

- **Toute la vie d'un sprint sur la page Sprint** : la page Planning est réservée au futur calendrier des sprints.
- **Un seul bouton d'action dans l'en-tête**, « Nouveau sprint » ou « Clôturer le sprint » selon l'état du dernier sprint : il n'y a jamais qu'une action possible à la fois.
- **Sprint actuel en dernier dans le menu**, sélectionné par défaut et mis en couleur s'il est en cours : c'est le sprint qu'on consulte le plus.
- **Trois sorts à la clôture** au lieu de deux (fini ou reporté) : le PO peut renvoyer au Backlog une US qu'il ne veut pas garder dans le sprint suivant.
- **Report par pré-cochage**, et non plus par ajout automatique au lancement : le PO voit et contrôle la vraie charge du nouveau sprint, et les US reportées s'affichent comme les autres.
- **Pré-cochage selon l'état des tâches** à la clôture (« Clore » si tout est Terminé, « Reporter » sinon) : le PO ne corrige que les cas particuliers. Une US pas commencée est pré-reportée, pas renvoyée au Backlog : la renvoyer est un choix explicite du PO, une US n'en sort jamais par oubli. C'est la version du lot 1 du pré-cochage à 100 % prévu au lot 2 (R27).
- **Le PO peut clore une US inachevée** : c'est lui qui juge ce qui est vraiment fini.
- **Photo des tâches à la clôture** : une US reportée garde les mêmes tâches d'un sprint à l'autre ; sans photo, un sprint clos afficherait leur état d'aujourd'hui et non leur état final (R19). La lecture seule d'un sprint clos vient de la photo, pas d'un blocage des tâches, qui restent modifiables dans le sprint en cours.
- **US terminée en lecture seule**, refusée aussi par le back : son historique ne doit plus changer.
- **Gestion des tâches aussi sur la page Sprint** (création via la carte « + », modification, suppression) : on peut ajuster le découpage en cours de sprint sans repasser par le Backlog.
- **Décochage refusé sur une tâche Terminé** : une tâche Terminé a toujours tous ses points cochés.
- **Pas de lancement sans US** : sans report automatique, un sprint vide n'aurait aucun contenu.
- **Photo en colonne JSON** (`sprint_user_story.snapshot`) plutôt qu'une table par tâche : la photo n'est jamais interrogée, seulement affichée.
- **Migration `0002` au lieu de modifier `0001_init.sql`** : la base de travail n'est plus vidée à chaque évolution du modèle.
- **Pas de route dédiée aux US reportées** : le front lit le dernier sprint clos (`GET /sprints/{id}`) et le sort de ses US pour pré-cocher la modal de lancement.
- **Stack de test séparée** (`scripts/test.sh`, projet Docker `firescrum-test`, base en mémoire, port 4201) : les tests ne touchent jamais la base de travail.
