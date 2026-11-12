# 009 — Modals de taille fixe et listes qui défilent

**Statut** : Livrée

## Contexte

Chaque modal a aujourd'hui sa propre largeur, et sa hauteur suit son contenu : ajouter une tâche, chercher une US ou changer d'onglet fait grandir ou rétrécir la modal sous les yeux de l'utilisateur. On donne à toutes les modals une même grande taille fixe, et chaque liste a sa zone réservée, qui défile au lieu de pousser le reste. Aucune règle métier ne change.

## Comportement attendu

### Toutes les modals

- Même taille pour toutes : 1024 px de large et 85 % de la hauteur de l'écran, quel que soit le contenu ou l'onglet ouvert. Un onglet sans liste (Details) garde la même hauteur, avec du vide en bas.
- Concernées : nouvelle feature et détail d'une feature, nouvelle US et détail d'une US (Backlog), tâche du sprint, lancer un sprint, clôturer un sprint.
- Sur téléphone : la modal prend la largeur de l'écran moins une marge et garde 85 % de la hauteur ; si le contenu ne tient pas, la modal entière défile en dernier recours.

### Zones de liste

- Chaque liste est dans une zone à fond gris (gris « muted » du thème, lisible en clair et en sombre) avec une bordure arrondie.
- La zone remplit la hauteur restante de la modal. Au-delà, les lignes défilent à la molette ou avec la barre de défilement à droite ; le reste de la modal ne bouge pas.
- Une zone vide affiche son message à l'intérieur.
- La zone grise ne contient que des listes ou du texte en lecture seule, jamais un formulaire.

### Par modal

- **Feature › onglet User stories** : deux zones grises, moitié-moitié : les US de la feature (« Aucune US dans cette feature. »), puis, sous le champ de recherche, les US trouvées (« Aucune US ne correspond à … »). S'il n'existe aucune US sans feature, la recherche et la 2ᵉ zone sont remplacées par le message actuel, et la liste de la feature prend toute la hauteur.
- **US › onglet Tasks** : la liste des tâches dans la zone grise (« Aucune tâche. »), et le formulaire de tâche en dessous, sur fond blanc.
- **Lancer un sprint** : les US acceptées dans la zone grise (« Aucune US acceptée. Accepte des US depuis le Backlog. »). Le nom du sprint au-dessus et le bouton « Lancer le sprint » en dessous restent visibles.
- **Clôturer un sprint** : le tableau dans la zone grise, avec sa ligne d'en-tête (User story / Clore / Reporter) figée pendant le défilement. Nouveau message s'il est vide : « Aucune US dans ce sprint. »
- **Tâche du sprint** (ouverture d'une tâche existante) : deux onglets.
  - « Points de validation (n) », ouvert par défaut : les points à cocher dans la zone grise (« Aucun point de validation. »).
  - « Details » : la description dans la zone grise quand la tâche est en lecture seule (« Pas de description. »), ou bien le formulaire de modification, sur fond blanc, quand elle est modifiable.
- **Tâche du sprint** (création, carte « + ») : pas d'onglets. Une zone grise « Pas encore de points de validation », et le formulaire en dessous, sur fond blanc.

## Règles métier

- Aucune règle ajoutée ni modifiée.

## Hors périmètre

- Le contenu des formulaires (champs, libellés, boutons) et leur comportement.
- Les listes en dehors des modals (pages Backlog, Features, Sprint).

## Questions ouvertes

- Aucune.

## Recettes

Scénarios de validation, chacun avec son ID du [cahier de recettes](../../cahier-de-recettes.md) (nouveau ou modifié) :

- [ ] **R49** — Ouvrir chacune des modals (nouvelle feature, détail feature, nouvelle US, détail US, tâche du sprint, lancer et clôturer un sprint) sur grand écran → elles ont toutes la même taille (1024 px × 85 % de l'écran) ; changer d'onglet ne change pas cette taille.
- [ ] **R50** — Dans l'onglet Tasks d'une US, ajouter des tâches jusqu'à dépasser la zone grise → la modal garde sa taille, la liste défile à la molette et avec la barre de droite, le formulaire reste visible en dessous.
- [ ] **R51** — Ouvrir une feature avec beaucoup d'US et beaucoup d'US sans feature, onglet User stories → deux zones grises de même hauteur qui défilent chacune ; sans aucune US sans feature, la liste de la feature prend toute la hauteur.
- [ ] **R52** — Clôturer un sprint avec beaucoup d'US → le tableau défile dans la zone grise, son en-tête reste visible, le bouton « Clôturer le sprint » aussi.
- [ ] **R53** — Lancer un sprint avec beaucoup d'US acceptées, puis sans aucune → la liste défile dans la zone grise ; sans US, le message s'affiche dans la zone.
- [ ] **R54** — Ouvrir une tâche du sprint → onglets « Points de validation (n) » (ouvert) et « Details » ; dans un sprint clos, Details montre la description dans la zone grise ; sur le sprint en cours, le formulaire sur fond blanc. Cliquer sur « + » → pas d'onglets, zone grise « Pas encore de points de validation » et le formulaire en dessous.
- [ ] **R55** — Sur téléphone, ouvrir la modal d'une US → elle tient dans la largeur de l'écran ; si le contenu dépasse, la modal défile.
- [ ] **R15** (modifié) — Dans l'onglet « Points de validation » de la modal de la tâche, cocher tous les points, puis déplacer la tâche en `Terminé` → la tâche est dans la colonne `Terminé`.
- [ ] **R43** — Rejouer en mode sombre → les zones grises sont lisibles.

## Décisions

- **Une seule taille pour toutes les modals, y compris la tâche du sprint** : la modal ne bouge plus d'un écran à l'autre ; la tâche du sprint, d'abord gardée petite, passe en grande taille, avec des onglets pour l'occuper.
- **La zone remplit l'espace restant** plutôt qu'une hauteur fixe identique : pas de grand vide sous les modals qui n'ont qu'une liste.
- **Le gris est réservé aux listes et à la lecture seule** : un formulaire reste sur fond blanc, ce qui sépare ce qu'on lit de ce qu'on saisit.
- **Points de validation ouverts par défaut** dans la tâche du sprint : en sprint, on ouvre surtout une tâche pour cocher ses points.
- **En-tête du tableau de clôture figé** : on garde le sens des colonnes Clore / Reporter en faisant défiler.
- **Taille fixée dans le défaut de `HlmDialogContent`** (`libs/ui/dialog`) plutôt que sur chaque modal : une nouvelle modal a d'office la bonne taille. La modal devient une colonne flex, avec un défilement de secours sur petit écran.
- **Une classe CSS `.list-zone`** dans `styles.css`, à côté de `.select`, plutôt qu'un composant : c'est du style pur, sans logique. Chaque niveau entre la modal et la zone est en `flex-1 min-h-0`, sinon la zone ne peut ni remplir la hauteur ni défiler.
- **Séparateurs de lignes en couleur `--input`** (`divide-input`) : `--border` se voit à peine sur le gris, et se confond avec lui en mode sombre (même valeur).
- **Lignes de la liste de lancement en `auto-rows-max`** : dans une zone de hauteur fixe, la grille écrasait les cartes pour tout faire tenir.
- **Trait sous l'en-tête figé dessiné en ombre** : une bordure ne suit pas une cellule `sticky` dans un tableau.
- **Onglets de la tâche du sprint pilotés par un signal `tab`**, comme la modal d'US : le contenu de la modal est recréé à chaque ouverture, l'onglet repart donc sur les points de validation.
- **Recherche d'US limitée à 5 résultats, inchangée** : la 2ᵉ zone de la feature ne défile donc pas ; on ne change pas ce comportement dans cette spec.
