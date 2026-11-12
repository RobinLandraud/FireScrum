# FireScrum — Cahier de recettes

Statuts possibles : `À tester` / `OK` / `KO` / `Bloqué`

Les tests sont regroupés par lot, dans l'ordre de réalisation. Chaque lot ne dépend que des lots précédents.

| Lot | Contenu |
|-----|---------|
| 1 | Entités (projet, feature, US, tâche, sprint) et pages Backlog / Sprint |
| 2 | Pourcentages d'avancement et dates de sprint |
| 3 | Utilisateurs, types de compte (PO / Dev) et assignation |

---

# Lot 1 — Entités, Backlog et Sprint

Pas d'utilisateurs dans ce lot : toutes les actions sont possibles pour tout le monde.

## Backlog

| ID | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|----|----------------|----------|------------------|-----------------|--------|
| R01 | Projet | Ouvrir l'application | Le projet unique est affiché, aucune sélection de projet n'est proposée |  | À tester |
| R02 | Feature | Créer une feature (page Features) | La feature apparaît en card dans la page Features |  | À tester |
| R03 | User Story | Créer une US avec « New Story », avec et sans feature | L'US apparaît en card dans l'onglet Sandbox, avec sa feature si associée |  | À tester |
| R03d | User Story | Cliquer sur « New Story », saisir un titre sans tâche | La modal a les onglets Details / Tasks ; « Créer l'US » reste grisé tant qu'il n'y a pas au moins une tâche dans l'onglet Tasks |  | À tester |
| R03b | Feature | Dans la modal d'une feature (onglet User stories), rechercher (recherche approximative) et ajouter une US sans feature puis la retirer ; à la création, ajouter une US avant de créer | L'US apparaît dans la liste de la feature, puis redevient sans feature ; à la création, la feature est créée avec l'US |  | À tester |
| R03f | Feature | Ouvrir une feature qui a une US de chaque état (Sandbox, validée, dans le sprint en cours, terminée), onglet User stories | Chaque US a son badge : « En attente » (gris), « Planifié » (bleu), « En cours » (orange), « Terminé » (vert), lisibles en clair et en sombre |  | À tester |
| R03g | Feature | Ouvrir une feature qui a une US terminée ; chercher une US terminée sans feature ; `POST /features` avec l'id d'une US terminée | Pas d'icône « Retirer » sur l'US terminée ; elle n'est pas proposée à l'ajout ; l'API répond 400 |  | À tester |
| R46 | Progression | Une US avec 1 tâche en Terminé sur 2 (et une « En validation ») ; une US terminée | Barre à 50 % dans le Backlog, sur la page Sprint et dans la modal de sa feature ; l'US terminée affiche 100 % en vert |  | À tester |
| R47 | Progression | Une feature avec 1 US terminée sur 4 ; une feature sans US | Sa card affiche 25 % ; pas de barre sans US |  | À tester |
| R48 | Progression | Passer une tâche en Terminé sur la page Sprint, revenir sur le Backlog | La barre de l'US a avancé |  | À tester |
| R02c | Feature | Cliquer sur une feature, modifier titre et description, enregistrer | Même modal que la création, champs pré-remplis ; la card est mise à jour |  | À tester |
| R03c | User Story | Cliquer sur une US du backlog, modifier titre, description, vélocité et feature, enregistrer | La modal reprend le formulaire de création pré-rempli ; les modifications sont visibles sur la card et conservées après rechargement |  | À tester |
| R04 | Vélocité | Saisir la vélocité d'une US | Seules les valeurs de Fibonacci (1, 2, 3, 5, 8, 13, 21…) sont proposées |  | À tester |
| R05 | Tâche | Dans la modal d'une US, onglet Tasks : créer une tâche avec un nom, une description et des points de validation | La tâche apparaît dans la liste (nom seul), statut `À faire` |  | À tester |
| R05b | Tâche | Cliquer sur l'icône modifier d'une tâche, changer le nom, valider | Les champs du bas sont pré-remplis, le bouton devient « Modifier la tâche » ; après validation la liste est à jour et le formulaire revient à vide avec « Ajouter la tâche » |  | À tester |
| R05c | Tâche | Cliquer sur l'icône supprimer d'une tâche | La tâche disparaît de la liste |  | À tester |
| R06 | Persistance | Créer une feature, une US et une tâche, puis recharger la page | Les trois éléments sont toujours présents |  | À tester |
| R07 | Validation | Valider une US depuis sa modal | L'US passe de Sandbox à Accepted et peut être ajoutée à un sprint (page Sprint) |  | À tester |
| R08 | Validation | Tenter d'ajouter une US non validée à un sprint | L'ajout est impossible |  | À tester |

## Page Sprint

| ID | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|----|----------------|----------|------------------|-----------------|--------|
| R09 | Lancer un sprint | Lancer un sprint avec des US validées | Le sprint devient le sprint actuel et ses US s'affichent sur la page Sprint |  | À tester |
| R10 | Affichage | Ouvrir la page du sprint actuel | Une ligne par US du sprint (avec sa vélocité), colonnes `À faire` / `En cours` / `En validation` / `Terminé` |  | À tester |
| R11 | Vélocité sprint | Sprint avec 3 US de vélocité 2, 3 et 5 | La vélocité totale du sprint affichée est 10 |  | À tester |
| R12 | Déplacement | Déplacer une tâche de `À faire` à `En cours` | La tâche est dans la colonne `En cours`, le statut est conservé après rechargement |  | À tester |
| R12b | Tâche | Cliquer sur la carte « + » d'une US, saisir un nom, « Ajouter la tâche » | La tâche apparaît dans la colonne `À faire` de cette US |  | À tester |
| R12c | Tâche | Cliquer sur une tâche du tableau, changer son nom, « Modifier la tâche », puis la rouvrir et cliquer sur la corbeille | Le nom est mis à jour sur la carte ; après suppression, un toast confirme et la carte disparaît |  | À tester |
| R13 | Ligne US | Déplacer une tâche | La tâche reste sur la ligne de son US |  | À tester |
| R14 | Points de validation | Déplacer en `Terminé` une tâche dont un point de validation n'est pas coché | Le déplacement est refusé, la tâche reste dans sa colonne |  | À tester |
| R15 | Points de validation | Dans l'onglet « Points de validation » de la modal de la tâche, cocher tous les points, puis déplacer la tâche en `Terminé` | La tâche est dans la colonne `Terminé` |  | À tester |
| R15b | Points de validation | Décocher un point d'une tâche `Terminé` | Refusé avec le message « Sors d'abord la tâche de Terminé. », le point reste coché |  | À tester |
| R16 | Clôturer un sprint | Clôturer le sprint actuel en cochant « Clore » pour toutes les US | Le sprint est clos, ses US sont « Close » et passent dans l'onglet Done du Backlog ; le bouton devient « Nouveau sprint » |  | À tester |
| R16b | Pré-cochage | Ouvrir la clôture d'un sprint avec une US dont toutes les tâches sont `Terminé`, une US avec une tâche `En cours` et une US sans tâche commencée | « Clore » pré-coché pour la 1re, « Reporter » pour la 2e et la 3e ; cocher l'une des deux cases décoche l'autre |  | À tester |
| R16c | US terminée | Ouvrir une US de l'onglet Done du Backlog | La modal est en lecture seule (détails et tâches) |  | À tester |
| R17 | Report d'US | Clôturer un sprint en cochant « Reporter » pour une US, puis cliquer sur « Nouveau sprint » | L'US est « Reportée » dans le sprint clos ; dans la modal de lancement, elle est déjà cochée et comptée dans le total |  | À tester |
| R17b | Retour au backlog | Clôturer un sprint sans cocher de case pour une US | L'US est « Retournée au backlog » dans le sprint clos et réapparaît dans l'onglet Accepted |  | À tester |
| R17c | Lancement | Dans la modal de lancement, décocher toutes les US | « Lancer le sprint » est grisé |  | À tester |
| R17d | Report d'US | Décocher une US reportée dans la modal de lancement, puis lancer | L'US n'est pas dans le nouveau sprint et reste dans l'onglet Accepted |  | À tester |
| R18 | Report d'US | Reporter une US dont une tâche est `En cours` et une autre `Terminé` | Dans le sprint suivant, l'US garde ses tâches avec les mêmes statuts |  | À tester |
| R19 | Sprints passés | Choisir un sprint clos dans le menu, après avoir fait avancer une de ses US reportée dans le sprint suivant | Les tâches sont affichées telles qu'à la clôture, en lecture seule (ni déplacement, ni modification, ni carte « + »), avec le sort de chaque US |  | À tester |

## Cadre et thème

| ID | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|----|----------------|----------|------------------|-----------------|--------|
| R40 | Barre latérale | Ouvrir l'app | Barre latérale avec le logo, le nom du projet et les 4 pages avec leur icône ; la page affichée est surlignée en bleu |  | À tester |
| R41 | Repli | Sur grand écran, replier la barre latérale puis recharger | Elle reste repliée, en colonne d'icônes, et la navigation marche toujours |  | À tester |
| R42 | Mobile | Sur mobile, ouvrir la barre avec le bouton de l'en-tête, puis cliquer sur le fond | Elle s'affiche par-dessus la page avec un fond assombri ; le clic sur le fond la referme |  | À tester |
| R43 | Mode sombre | Passer en mode sombre puis recharger | Toutes les pages et les modals sont sombres et lisibles, le choix est conservé |  | À tester |
| R44 | Mode sombre | Premier lancement avec le système en thème sombre | L'app s'ouvre en mode sombre |  | À tester |
| R45 | Non-régression | Rejouer les recettes R01 à R19 | Toutes passent, sans changement de comportement |  | À tester |

## Modals

| ID | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|----|----------------|----------|------------------|-----------------|--------|
| R49 | Taille | Sur grand écran, ouvrir chaque modal (nouvelle feature, détail feature, nouvelle US, détail US, tâche du sprint, lancer et clôturer un sprint) et changer d'onglet | Toutes ont la même taille (1024 px × 85 % de l'écran), quel que soit l'onglet |  | À tester |
| R50 | Tâches de l'US | Dans l'onglet Tasks d'une US, ajouter des tâches jusqu'à dépasser la zone grise | La modal garde sa taille, la liste défile à la molette et avec la barre de droite, le formulaire reste visible en dessous |  | À tester |
| R51 | US de la feature | Ouvrir une feature avec beaucoup d'US alors qu'il reste beaucoup d'US sans feature, onglet User stories ; puis sans aucune US sans feature | Deux zones grises de même hauteur qui défilent chacune ; sans US sans feature, la liste de la feature prend toute la hauteur |  | À tester |
| R52 | Clôture | Clôturer un sprint avec beaucoup d'US | Le tableau défile dans la zone grise, son en-tête et le bouton « Clôturer le sprint » restent visibles |  | À tester |
| R53 | Lancement | Lancer un sprint avec beaucoup d'US acceptées, puis sans aucune | La liste défile dans la zone grise ; sans US, le message s'affiche dans la zone |  | À tester |
| R54 | Tâche du sprint | Ouvrir une tâche du sprint en cours, puis d'un sprint clos ; cliquer sur la carte « + » | Onglets « Points de validation (n) » (ouvert) et « Details » : formulaire sur fond blanc pour le sprint en cours, description dans la zone grise pour le sprint clos ; à la création, pas d'onglets, zone « Pas encore de points de validation » et formulaire en dessous |  | À tester |
| R55 | Mobile | Sur téléphone, ouvrir la modal d'une US | Elle tient dans la largeur de l'écran ; si le contenu dépasse, la modal défile |  | À tester |

---

# Lot 2 — Pourcentages et dates

## Avancement

| ID | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|----|----------------|----------|------------------|-----------------|--------|
| R20 | % US | Créer une US | L'US affiche 0 % dans le backlog et sur la page Sprint |  | À tester |
| R21 | % US | US avec 4 tâches, passer 1 tâche en `Terminé` | L'US affiche 25 % |  | À tester |
| R22 | % US | Passer toutes les tâches d'une US en `Terminé` | L'US affiche 100 % et est terminée |  | À tester |
| R23 | % US | Remettre une tâche `Terminé` en `En cours` | Le % de l'US diminue |  | À tester |
| R24 | % feature | Créer une feature | La feature affiche 0 % |  | À tester |
| R25 | % feature | Feature avec 4 US de vélocités différentes (1, 2, 5, 8), terminer l'US de vélocité 8 | La feature affiche 25 % (la vélocité n'est pas prise en compte) |  | À tester |
| R26 | % feature | Une US de la feature passe à 50 % sans être terminée | Le % de la feature ne change pas |  | À tester |
| R27 | Pré-cochage | Ouvrir la clôture d'un sprint avec une US à 100 % et une US à 50 % | L'US à 100 % est pré-cochée, l'US à 50 % ne l'est pas |  | À tester |

## Dates de sprint

| ID | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|----|----------------|----------|------------------|-----------------|--------|
| R28 | Dates | Lancer un sprint avec une date de début et une date de fin | Les dates s'affichent sur la page Sprint |  | À tester |
| R29 | Date de fin | Laisser passer la date de fin du sprint actuel sans le clôturer | Le sprint reste le sprint actuel, toutes les actions restent possibles |  | À tester |

---

# Lot 3 — Utilisateurs et types de compte

## Utilisateurs

| ID | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|----|----------------|----------|------------------|-----------------|--------|
| R30 | Comptes | Créer un utilisateur PO et un utilisateur Dev, puis choisir l'un puis l'autre comme utilisateur courant (sans mot de passe) | Les deux utilisateurs existent avec leur type affiché ; l'utilisateur courant change |  | À tester |
| R31 | Multi-utilisateurs | Deux utilisateurs ouvrent le projet, l'un déplace une tâche | L'autre utilisateur voit la tâche dans sa nouvelle colonne (après rechargement) |  | À tester |
| R32 | Assignation | Créer une tâche en l'assignant à une personne | La personne assignée est affichée sur la tâche |  | À tester |
| R33 | Assignation | Changer la personne assignée à une tâche | La nouvelle personne est affichée sur la tâche |  | À tester |

## Droits

| ID | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|----|----------------|----------|------------------|-----------------|--------|
| R34 | Droits PO | Avec un compte PO, créer une feature, une US et une tâche | Les trois éléments sont créés |  | À tester |
| R35 | Droits PO | Avec un compte PO, valider une US, lancer puis terminer un sprint | Les actions sont effectuées |  | À tester |
| R36 | Droits Dev | Avec un compte Dev, tenter de créer une feature, une US ou une tâche | L'action est impossible (bouton absent ou refus) |  | À tester |
| R37 | Droits Dev | Avec un compte Dev, tenter de lancer ou terminer un sprint | L'action est impossible (bouton absent ou refus) |  | À tester |
| R38 | Droits Dev | Avec un compte Dev, tenter de valider une US dans le backlog | L'action est impossible (bouton absent ou refus) |  | À tester |
| R39 | Droits Dev | Avec un compte Dev, déplacer une tâche et cocher ses points de validation | Les actions sont effectuées |  | À tester |
