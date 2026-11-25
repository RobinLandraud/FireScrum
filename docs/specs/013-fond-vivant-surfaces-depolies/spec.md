# 013 — Fond vivant et surfaces dépolies

**Statut** : Validée

## Contexte

Avec le style neumorphique (spec [012](../012-style-neumorphique/spec.md)), le fond et tous les blocs ont la même couleur. Les blocs se détachent mal de la page, et les écrans paraissent plats. Une planche de maquettes a comparé plusieurs fonds, et la piste retenue (ticket #25) garde le neumorphisme partout, au-dessus d'un fond animé doux qu'on voit à travers des surfaces dépolies. La barre latérale récupère les boutons de l'en-tête. Aucun comportement métier ne change.

Cette spec remplace deux règles de la 012 : « même couleur de surface pour le fond et les blocs », et « la barre latérale et l'en-tête gardent le fonctionnement de la spec 008 ».

## Comportement attendu

### Fond animé

- Derrière toute l'application, un fond plein écran montre trois halos doux sur la couleur de surface du thème : bleu de marque, orange et lavande.
- Les halos dérivent lentement, et ils se décalent nettement vers le pointeur (souris, doigt ou stylet) avec un mouvement lissé, sans à-coup. Une lueur suit le pointeur.
- Derrière le pointeur en mouvement, le fond se déforme et laisse une traînée qui s'étale comme de l'encre dans l'eau, puis s'efface en une seconde environ.
- Quand le pointeur quitte la fenêtre, les halos reviennent au centre.
- **Clair** : surface `#e4e8f0`. **Sombre** : surface `#222a3a`, avec un halo bleu plus présent et un orange plus discret.
- Au changement de thème, le fond passe d'une couleur à l'autre en douceur (300 ms environ).
- Le fond est un décor : il ne capte aucun clic ni le focus, et les lecteurs d'écran l'ignorent.
- Il n'y a aucun réglage dans l'application pour le moment.

### Surfaces

- Tous les blocs restent neumorphiques, en relief ou en creux, avec une ombre claire et une ombre foncée. Leur surface est translucide, de la couleur du thème, et laisse voir le fond.
- **Dépolis** (le fond apparaît flou à travers) : la barre latérale, la barre du haut sur mobile, les en-têtes de page et les lignes d'US du Sprint.
- **Translucides sans flou** : les colonnes et les tâches du Sprint, les cartes du Backlog et des Features.
- **Opaques** (couleur surface, en relief, sans flou) : les modals, les toasts et les menus déroulants.
- **Aucun bouton, champ ni badge n'est posé directement sur le fond animé** : ils sont toujours dans un panneau.
- Les badges (par exemple « 8 pts » ou « en cours ») sont en relief, sans bordure.
- En sombre, le relief des boutons a un reflet clair plus marqué, pour rester visible.

### Barre latérale

- Elle est neumorphique et dépolie, comme les blocs.
- Le bouton qui replie ou déplie la barre est **dans la barre**, à droite du titre « FireScrum ». Barre repliée (90 px), il passe sous le logo.
- Le bouton clair / sombre est **tout en bas de la barre**, séparé des liens. Il montre un soleil en mode sombre et une lune en mode clair, et c'est le même bouton sur toutes les tailles d'écran.
- Sur grand écran, il n'y a plus d'en-tête en haut de la page.

### Petit écran (sous 1024 px)

- Une barre neumorphique dépolie, collée en haut de l'écran, contient seulement le bouton du menu. Il ouvre la barre latérale par-dessus la page, comme aujourd'hui.
- Le bouton clair / sombre est en bas de la barre latérale ouverte.

### En-têtes de page

Sur chaque page, le titre et les commandes de la page sont regroupés dans un panneau neumorphique dépoli :

- **Backlog** : titre, onglets, « New Story ».
- **Features** : titre, « New Feature ».
- **Planning** : titre.
- **Sprint** : titre, choix du sprint, badge « en cours », points, « Clôturer le sprint » ou « Nouveau sprint ».

### Contenu

- Le contenu des pages est centré dans l'espace à côté de la barre latérale, que la barre soit dépliée ou repliée.

### Cas particuliers

- **« Réduire les animations » activé dans le système** : le fond ne s'anime pas. Il est dessiné fixe et ne bouge qu'au déplacement du pointeur, sans traînée, et le changement de thème est immédiat.
- **Pas de WebGL, ou fond impossible à afficher** : un dégradé fixe avec les mêmes halos s'affiche à la place, et l'application fonctionne normalement.
- **Onglet caché** : l'animation se met en pause, puis reprend quand l'onglet revient.

## Règles métier

- Aucune : rien ne change côté back.

## Hors périmètre

- Un espace de réglages (couper le fond, intensité, etc.), prévu dans une spec future.
- Un autre comportement selon l'appareil : le fond est le même sur mobile, tablette et ordinateur.

## Questions ouvertes

- Aucune.

## Recettes

Scénarios de validation, chacun avec son ID du [cahier de recettes](../../cahier-de-recettes.md) (nouveau ou modifié) :

- [ ] **R40** (modifiée) — Ouvrir l'app sur grand écran → barre latérale avec le logo, le nom du projet, le bouton de repli à côté du titre, les 4 pages avec leur icône, et le bouton clair / sombre tout en bas ; pas d'en-tête en haut de la page.
- [ ] **R41** (modifiée) — Sur grand écran, replier la barre avec son bouton, puis recharger → elle reste repliée en colonne d'icônes, avec le bouton sous le logo ; la navigation fonctionne.
- [ ] **R42** (modifiée) — Sur mobile, ouvrir la barre avec le bouton de la barre du haut, puis cliquer sur le fond → elle s'affiche par-dessus la page, puis se ferme ; le bouton clair / sombre est en bas de la barre ouverte.
- [ ] **R64** (modifiée) — Ouvrir chaque page en mode clair → les blocs neumorphiques (sans bordure) laissent voir le fond animé ; la barre latérale, les en-têtes et les lignes d'US le montrent flou.
- [ ] **R75** — Déplacer le pointeur dans la fenêtre, puis le sortir → les halos se décalent nettement vers lui sans à-coup, une traînée déformée s'étale derrière lui puis s'efface ; à la sortie, les halos reviennent au centre.
- [ ] **R76** — Activer « réduire les animations » dans le système, puis ouvrir l'app → le fond ne s'anime pas, et il ne bouge qu'au déplacement du pointeur.
- [ ] **R77** — Ouvrir l'app dans un navigateur sans WebGL → un dégradé fixe avec les halos s'affiche, sans erreur, et l'app fonctionne.
- [ ] **R78** — Cliquer à travers le fond, puis le parcourir au clavier et au lecteur d'écran → le clic atteint l'élément visé ; le fond ne prend jamais le focus et n'est pas annoncé.
- [ ] **R79** — Passer à un autre onglet puis revenir → l'animation est en pause pendant l'absence, puis reprend.
- [ ] **R80** — Passer de clair à sombre avec le bouton du bas de la barre, puis recharger → le fond change en douceur, l'icône passe de la lune au soleil, et le choix est conservé.
- [ ] **R81** — Ouvrir Backlog, Features, Planning et Sprint → le titre et les commandes de chaque page sont dans un panneau, et aucun bouton ni champ n'est posé directement sur le fond.
- [ ] **R82** — Sur le Sprint, en clair puis en sombre → les badges « X pts » et « en cours » sont en relief, sans bordure ; « Clôturer le sprint », le « + » et les boutons de la barre ont un relief visible.
- [ ] **R83** — Déplier puis replier la barre latérale sur grand écran → le contenu reste centré dans l'espace restant.
- [ ] **R84** — Ouvrir une modal, faire apparaître un toast → ils sont opaques, en relief, et le fond ne se voit pas à travers.
- [ ] **R71** (rejouée) — Mesurer le contraste des textes sur les surfaces translucides, en clair et en sombre, y compris devant les halos → au moins 4,5:1.

## Décisions

- **Une spec 013 plutôt qu'une réécriture de la 012** : la 012 reste l'historique du neumorphisme, et la 013 porte le fond, le dépoli et le déplacement des boutons.
- **Modals, toasts et menus déroulants opaques** : au-dessus du voile sombre, le texte des formulaires et les champs en creux ont besoin d'une surface franche pour rester lisibles.
- **Flou réservé aux grands panneaux, comme sur la maquette** : les cartes du Backlog peuvent être des dizaines, et le flou sur un fond redessiné à chaque image coûte cher.
- **Aucun contrôle sur le fond** : un bouton neumorphique ne se lit que sur une surface de sa couleur. Sur le fond animé, son relief disparaît (c'est ce qui cassait « Clôturer le sprint » sur la maquette).
- **Bouton clair / sombre en bas de la barre latérale, sur toutes les tailles d'écran** : la barre regroupe les commandes de l'application, et la barre mobile ne garde que le bouton du menu.
- **Préférence « réduire les animations » du système respectée, sans réglage dans l'app** : le mouvement continu gêne les personnes sensibles. Un espace de réglages viendra plus tard.
- **Même suivi du pointeur pour souris, doigt et stylet** : un seul comportement, sans cas particulier par appareil.
- **Sillage fluide plutôt que par points** (ajouté après T10) : une traînée qui s'étale comme de l'encre donne un rendu plus organique ; elle demande une seconde passe de rendu, au quart de la résolution.
