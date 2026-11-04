# 008 — Nouveau look : barre latérale et mode sombre

**Statut** : Livrée

## Contexte

FireScrum a aujourd'hui une simple barre de liens en haut et le style par défaut des composants. On reprend le style du template [TailAdmin Angular](https://github.com/tailadmin/free-angular-tailwind-dashboard) (licence MIT), qui partage la même stack (Angular 22, Tailwind 4, `@spartan-ng/brain`), pour donner à l'app un vrai cadre de tableau de bord et un mode sombre. Aucun comportement métier ne change.

## Comportement attendu

### Barre latérale

- En haut : le logo « FireScrum » et le nom du projet (lu par l'API).
- Les 4 pages avec leur icône : Backlog (liste), Features (regroupement), Planning (calendrier), Sprint (tableau en colonnes). La page active est surlignée en bleu.
- **Grand écran** : la barre se replie en une colonne d'icônes ; l'état replié ou déplié est conservé après rechargement.
- **Mobile** : la barre est cachée ; le bouton de l'en-tête l'ouvre par-dessus la page, avec un fond assombri qui la referme au clic. Choisir une page la referme aussi.

### En-tête

- Le bouton qui replie ou ouvre la barre latérale.
- La bascule clair / sombre.

### Thème

- Couleur de marque bleue `#465fff` (boutons principaux, navigation active), police Outfit, coins arrondis, bordures et ombres de TailAdmin.
- **Mode sombre** : au premier lancement, l'app suit la préférence du système ; le choix fait avec la bascule est ensuite conservé après rechargement. Toutes les pages et les modals fonctionnent dans les deux thèmes.
- Tous les composants sont restylés : boutons, cards, badges, modals, champs, zones de texte, libellés, cases à cocher, onglets, toasts, menus déroulants natifs, cartes du kanban de la page Sprint.
- Les modals, onglets et cases gardent leur comportement actuel (focus, touche Échap, accessibilité).

## Règles métier

- Aucune règle ajoutée ni modifiée.

## Hors périmètre

- Recherche, notifications et menu utilisateur de l'en-tête de TailAdmin (pas d'utilisateurs avant le lot 3).
- Les modals de TailAdmin, ses graphiques, son calendrier et ses autres pages de démonstration.
- Tout changement de contenu des pages.

## Questions ouvertes

- Aucune.

## Recettes

Scénarios de validation, chacun avec son ID du [cahier de recettes](../../cahier-de-recettes.md) (nouveau ou modifié) :

- [ ] **R40** — Ouvrir l'app → barre latérale avec le logo, le nom du projet et les 4 pages avec leur icône ; la page affichée est surlignée en bleu.
- [ ] **R41** — Sur grand écran, replier la barre latérale puis recharger → elle reste repliée, en colonne d'icônes, et la navigation marche toujours.
- [ ] **R42** — Sur mobile, ouvrir la barre avec le bouton de l'en-tête → elle s'affiche par-dessus la page avec un fond assombri ; un clic sur le fond la referme.
- [ ] **R43** — Passer en mode sombre puis recharger → toutes les pages et les modals sont sombres et lisibles, et le choix est conservé.
- [ ] **R44** — Premier lancement avec le système en thème sombre → l'app s'ouvre en mode sombre.
- [ ] **R45** — Rejouer les recettes R01 à R19 → toutes passent, sans changement de comportement.

## Décisions

- **Le look de TailAdmin, pas ses composants** : ses modals sont de simples `div`, sans piège de focus ni rôle `dialog`. Les composants Spartan en place gardent ce comportement, et les tests navigateur aussi.
- **TailAdmin plutôt qu'un template payant ou un autre gratuit** : licence MIT, même stack que FireScrum (Angular 22, Tailwind 4, Spartan brain), et assez de boutons, cards et champs pour l'app.
- **En-tête réduit à deux boutons** : la recherche, les notifications et le menu utilisateur n'ont pas de sens sans utilisateurs (lot 3).
- **Outfit servie par le front** (paquet npm), sans Google Fonts : pas d'appel à un service externe, l'app marche hors ligne.
- **Mode sombre par défaut selon le système**, puis choix mémorisé : rien à régler au premier lancement.
- **Mention de licence** dans `frontend/THIRD-PARTY-NOTICES.md` et en tête des fichiers repris en grande partie, comme l'exige la licence MIT.
- **La palette de TailAdmin traduite dans les variables de thème de Spartan** (`styles.css`) plutôt que dans les classes de chaque composant : tous les composants changent d'un coup ; seuls les détails non couverts (hauteurs, coins, ombres) sont retouchés dans `libs/ui/`.
- **Deux services partagés** (`ThemeService`, `SidebarService`) plutôt qu'un état dans `App` : l'en-tête, la barre et le fond assombri lisent le même état, et `App` ne fait que poser le cadre. Le `localStorage` passe par un `try/catch` commun (`services/storage.ts`), car il peut être bloqué.
- **Préférence du système lue au premier lancement seulement**, jamais suivie en direct, et jamais mémorisée à la place de l'utilisateur.
- **Grand écran à partir de 1024 px** : au-dessus, barre fixe et repliable ; en dessous, barre par-dessus la page.
- **Choisir une page referme la barre sur mobile** : sinon elle resterait ouverte par-dessus la nouvelle page.
