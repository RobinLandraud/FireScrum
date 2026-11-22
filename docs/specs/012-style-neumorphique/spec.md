# 012 — Style neumorphique

**Statut** : Livrée

## Contexte

FireScrum a aujourd'hui le look de TailAdmin (spec [008](../008-style-tailadmin/spec.md)) : des cartes blanches avec bordures sur un fond gris clair. On le remplace par un style neumorphique, qui donne un rendu plus doux et plus tactile. Le fond et les éléments ont la même couleur ; les éléments sortent de la surface ou s'y creusent grâce à deux ombres, une claire et une foncée. La maquette de référence est [FireScrum Neumorphic Preview](https://claude.ai/artifact/Vsq5Q7hwsY5Yqd4L8uW4q8). Aucun comportement métier ne change.

## Comportement attendu

### Identité conservée

- Couleur de marque bleue `#465fff`, police Outfit et coins arrondis de 12 px, comme aujourd'hui.
- La barre latérale, l'en-tête et la bascule clair / sombre de la spec 008 gardent leur fonctionnement.

### Surfaces

- Le fond de page, la barre latérale, l'en-tête, les cartes et les colonnes ont tous la même couleur de surface. Il n'y a plus de bordure pour séparer les blocs.
- **En relief** (ils sortent de la surface) : les cartes, les boutons, les badges, l'onglet actif, les tâches du Sprint, les modals et les toasts.
- **En creux** (ils sont creusés dans la surface) :
  - les champs de saisie, les zones de texte, les listes déroulantes et les cases à cocher ;
  - la barre d'onglets, les barres de progression, les colonnes du Sprint ;
  - le lien actif de la barre latérale.
- **Survol** : une carte ou une tâche cliquable ressort un peu plus.

### Boutons

- **Principal** : plein bleu, en relief ; il s'enfonce quand on clique dessus.
- **Destructif** : plein rouge, avec le même comportement.
- **Secondaire** (`outline`, par exemple « Clôturer le sprint ») : couleur de la surface, en relief, sans bordure.
- **Discret** (`ghost`) : plat, il ne ressort qu'au survol.

### Modals et toasts

- La modal s'ouvre en relief marqué au-dessus d'un fond assombri, qui reste en place.
- Les toasts sont en relief, de la couleur de la surface.

### Couleurs de statut

- Le vert (en cours, terminé) et le bleu (informations) restent des couleurs de statut. Elles suivent le thème clair ou sombre comme le reste de l'app.

### Glisser-déposer du tableau Sprint

- Quand on saisit une tâche, elle se soulève (grande ombre), grossit légèrement et s'incline.
- À sa place d'origine reste une trace pâle et vide, qui montre d'où elle vient.
- La colonne survolée se creuse davantage et s'entoure d'un contour bleu.
- Quand on la lâche, la tâche se pose dans la colonne et son ombre redescend en douceur.
- Si le système demande de réduire les animations, la tâche se déplace sans transition.

### Accessibilité

- Les textes respectent un contraste WCAG AA (4,5:1) sur la surface, en clair comme en sombre.
- Le contour bleu du focus reste visible au clavier sur tous les éléments interactifs.
- Les champs de saisie gardent un creux nettement visible, avec au besoin un léger trait en plus de l'ombre.

### Mode sombre

- Une surface gris-bleu foncé et ses deux ombres sont calibrées pour que chaque carte, champ et colonne se distingue du fond sans effort.

## Règles métier

- Aucune règle ajoutée ni modifiée.

## Hors périmètre

- Tout changement de mise en page, de contenu ou de comportement des pages.
- Un réglage pour choisir entre l'ancien et le nouveau style.
- Le déplacement des tâches au clavier (absent aujourd'hui).

## Questions ouvertes

- Aucune.

## Recettes

Scénarios de validation, chacun avec son ID du [cahier de recettes](../../cahier-de-recettes.md) (nouveau ou modifié) :

- [ ] **R64** — Ouvrir chaque page en mode clair → fond et blocs de la même couleur, sans bordure. Les cartes, les boutons et l'onglet actif sont en relief ; les champs, la barre d'onglets, les barres de progression et les colonnes du Sprint sont en creux.
- [ ] **R65** — Cliquer sur un bouton principal → il s'enfonce pendant le clic, puis reprend son relief.
- [ ] **R66** — Survoler une carte du Backlog ou une tâche du Sprint → elle ressort davantage.
- [ ] **R67** — Ouvrir une modal → elle apparaît en relief au-dessus d'un fond assombri. Un toast s'affiche en relief.
- [ ] **R68** — Sur le Sprint, saisir une tâche et la glisser vers une autre colonne. Pendant le glisser : la tâche se soulève et s'incline, une trace pâle reste à sa place, la colonne survolée se creuse avec un contour bleu. Au lâcher : la tâche se pose dans la nouvelle colonne et son statut est enregistré.
- [ ] **R69** — Activer « réduire les animations » dans le système, puis glisser une tâche → elle change de colonne sans transition animée.
- [ ] **R70** — Parcourir chaque page à la touche Tab → le contour bleu du focus est visible sur chaque élément interactif.
- [ ] **R71** — Mesurer le contraste des textes principaux et secondaires, en clair et en sombre → au moins 4,5:1.
- [ ] **R72** — Passer en mode sombre et ouvrir chaque page et chaque modal → chaque carte, champ et colonne se distingue du fond sans plisser les yeux, et tout est lisible.
- [ ] **R73** — Rejouer les recettes R01 à R19 et R40 à R45 → elles passent toutes, sans changement de comportement.

## Décisions

- **Remplacer TailAdmin plutôt que proposer un choix de style** : un seul jeu de styles à maintenir dans chaque composant.
- **Nouvelle spec plutôt que modifier la 008** : la barre latérale et la bascule de la 008 restent valables. Seul son thème est remplacé, et la 008 renvoie vers la 012.
- **Garder le bleu, Outfit et les rayons** : l'identité de FireScrum ne change pas, seul le traitement des surfaces change.
- **Boutons principal et destructif pleins** : un bouton couleur surface avec du texte bleu serait plus « pur », mais l'action principale se verrait moins.
- **Contraste AA, focus visible et champs bien creusés** : le neumorphisme est connu pour son faible contraste ; ces trois garde-fous gardent l'app utilisable.
- **Couleurs de statut passées en variables de thème** : les verts, bleus et gris écrits en dur dans les écrans suivraient sinon l'ancien style.
- **Fond assombri conservé sous les modals** : sans lui, une modal de la couleur de la surface se confondrait avec la page.
- **Trace laissée par la tâche et inclinaison quand on la saisit** : reprises de la maquette, pour qu'on voie d'où vient la tâche et qu'elle a bien été attrapée.
- **Thème construit à partir des variables de Spartan** (`styles.css`), comme pour la 008, plutôt qu'un thème neumorphique tout fait : ceux qui existent sont écrits pour Bootstrap. Les ombres sont construites à partir de deux couleurs (`--neu-light`, `--neu-dark`) et exposées en utilitaires Tailwind (`shadow-raised`, `shadow-inset`…) : le mode sombre ne redéfinit que ces deux couleurs, et chaque composant Helm reste le seul endroit où il est stylé.
- **Ombres du mode sombre plus marquées qu'en clair** : sur une surface foncée, la même différence de teinte se voit moins.
- **Trait des champs et des cases à cocher distinct du trait léger des blocs** (`--input`) : en sombre, il atteint 3:1 sur la surface, sinon une case vide disparaît presque.
- **Couleurs ajustées pour le contraste AA** : bleu des textes et des badges plus foncé en clair, plus clair en sombre ; rouge `#b42318` en clair, `#fda29b` en sombre, avec un texte foncé sur le bouton destructif en sombre (`--destructive-foreground`). Le statut « En cours » d'une story, orange, passe aussi par une variable (`--warning`).
- **Trace à l'origine par l'option `cdkDropListHasAnchor` du CDK, risque accepté** : avec elle, un dépôt échoue parfois (la tâche revient à sa place, sans message ; 3 fois sur 60 dans les tests, jamais sans l'option). Une trace affichée par le composant lui-même a été écartée. Si les échecs gênent, c'est la piste à reprendre.
- **Inclinaison par `rotate` / `scale`, pas `transform`** : le CDK déplace la tâche saisie avec `transform`.
- **Le statut part à la fin de l'animation de pose (250 ms)** : le CDK ne signale le dépôt qu'à ce moment ; les tests navigateur attendent la fin du dépôt avant de recharger la page.
- **Une règle globale pour « réduire les animations »** dans `styles.css`, plutôt qu'une par composant : elle couvre aussi les animations des modals et du glisser-déposer.
