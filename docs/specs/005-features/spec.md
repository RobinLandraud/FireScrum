# 005 — Page Features

**Statut** : Livrée

## Contexte

Les features regroupent des US. Leur gestion est séparée du Backlog : on y crée les features et on y range les US existantes, sans créer ni modifier d'US.

## Comportement attendu

- **En-tête** : titre « Features », bouton **New Feature** à droite.
- **Cards** : une card par feature, avec son titre, sa description et son nombre d'US.
- **Modal de feature**, la même pour la création (« New Feature ») et la modification (clic sur une card) :
  - en-tête : titre de la feature (ou « Nouvelle feature ») ;
  - onglet **Details** : titre, description. Bouton « Créer la feature » ou « Enregistrer » ;
  - onglet **User stories (n)** :
    - liste des US de la feature, une ligne par US : son titre, un badge de statut à sa droite, et une icône pour la retirer (sauf si l'US est terminée) ;
    - recherche d'une US sans feature et non terminée à ajouter, résultats en dessous avec une icône « + » ;
    - sans US disponible : « Aucune US sans feature. Crée-en depuis le Backlog. ».
- **Recherche approximative** sur le titre : les lettres tapées doivent apparaître dans l'ordre, pas forcément à la suite ; accents et majuscules ignorés (« deco » trouve « Se déconnecter »). Résultats triés par pertinence (lettres consécutives et débuts de mot favorisés), **5 au plus**. Champ vide : les 5 premières US sans feature. Entrée ajoute le premier résultat.
- **Statut d'une US** (badge, avec sa variante sombre) :

  | Statut | Condition | Couleur |
  |--------|-----------|---------|
  | En attente | Sandbox : pas encore validée | gris |
  | Planifié | validée, hors du sprint en cours | bleu |
  | En cours | dans le sprint en cours | orange |
  | Terminé | terminée | vert |

- **Barre de progression** : barre fine avec le pourcentage arrondi à droite (« 50 % »), bleue, verte à 100 %, annoncée aux lecteurs d'écran avec sa valeur.
  - **US** : tâches en Terminé ÷ nombre de tâches ; une US terminée est à 100 %.
  - **Feature** : US terminées ÷ nombre d'US ; une feature sans US n'a pas de barre (elle garde « 0 US »).
  - Affichée sur les cards de feature et chaque ligne de l'onglet User stories (entre le titre et le badge), sur les cards d'US du Backlog et sur la ligne de chaque US de la page Sprint.
- À la création, les US ajoutées restent en brouillon ; la feature est créée avec elles.
- En modification, un ajout ou un retrait est enregistré tout de suite (la modal reste ouverte) ; « Enregistrer » met à jour titre et description et ferme la modal.

## Règles métier

- On ne peut ajouter à une feature que des US sans feature et non terminées (400 sinon, à la création).
- Une US terminée ne change plus de feature : la retirer ou la déplacer est refusé (409).
- La feature et ses US sont rattachées ensemble : tout ou rien.
- Une feature peut être créée sans US.
- On ne modifie pas les US depuis cette page : seulement ajouter ou retirer.

## Hors périmètre

- Suppression d'une feature.
- Déplacer directement une US d'une feature à une autre (il faut d'abord la retirer).

## Questions ouvertes

- Indiquer qu'il existe plus de 5 résultats (« … et N autres ») ?

## Recettes

R02, R02c, R03b, et :

- [ ] **R03f** — Ouvrir une feature qui a une US de chaque état (Sandbox, validée, dans le sprint en cours, terminée) → les badges « En attente », « Planifié », « En cours » et « Terminé » s'affichent, avec leur couleur.
- [ ] **R03g** — Ouvrir une feature qui a une US terminée → pas d'icône « Retirer » sur cette US ; une US terminée sans feature n'apparaît pas dans la recherche d'ajout ; `POST /features` avec l'id d'une US terminée → 400.
- [ ] **R46** — Une US avec 1 tâche en Terminé sur 2 → sa barre affiche 50 % dans le Backlog, sur la page Sprint et dans la modal de sa feature ; une tâche « En validation » ne compte pas ; une US terminée affiche 100 % en vert.
- [ ] **R47** — Une feature avec 1 US terminée sur 4 → sa card affiche 25 % ; une feature sans US n'a pas de barre.
- [ ] **R48** — Passer une tâche en Terminé sur la page Sprint puis revenir sur le Backlog → la barre de l'US a avancé.

## Décisions

- **Même modal pour créer et modifier**, sur le modèle de la modal d'US.
- **Recherche approximative maison** (`services/fuzzy.ts`, ~40 lignes) plutôt qu'une bibliothèque : le besoin est simple (titres courts).
- **Liste de résultats + boutons** plutôt qu'une liste déroulante : plus rapide à parcourir et utilisable au clavier.
- **Création atomique côté back** (`POST /features` avec `user_story_ids`), comme pour les US.
- **Une US terminée est figée vis-à-vis de sa feature** : la retirer fausserait l'historique de la feature.
- **Statut affiché seulement dans la modal de feature** : c'est là qu'on suit l'avancement d'une feature.
- **« En cours » = dans le sprint en cours**, quel que soit l'état de ses tâches.
- **Statut calculé par le back** (champ `status` de chaque US, comme le statut des tâches) plutôt que déduit par le front : une seule source de vérité pour tous les clients.
- **Photos des sprints clos** : elles gardent le statut à la clôture ; celles d'avant cette évolution n'en ont pas et valent « En attente » (le statut n'est affiché qu'à partir des US actuelles).
- **Avancement d'une US = tâches en Terminé ÷ nombre de tâches** : simple à vérifier à la main ; les points de validation sont écartés (une tâche sans point ne compterait pas). « En validation » ne compte pas.
- **Avancement d'une feature = US terminées ÷ nombre d'US**, même logique que les tâches pour une US : la barre n'avance qu'à la clôture d'un sprint.
- **Avancé du lot 2** : le besoin de suivre l'avancement est déjà là.
- **Avancement calculé par le front** (`services/progress.ts`), contrairement au statut : toutes les données sont déjà dans la réponse, et le calcul reste juste sur les photos des sprints clos.
- **Composant `app-progress` (adapter) autour du Progress de Spartan** : les pages ne passent que `value` et `max` ; pourcentage, couleur et garde de `max = 0` sont au même endroit.
