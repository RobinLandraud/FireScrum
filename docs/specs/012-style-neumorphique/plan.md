# 012 — Plan

Supprimé à la livraison : reporter d'abord les décisions utiles dans `spec.md`.

## Approche

- **Variables de thème** dans `frontend/src/styles.css` (le mécanisme de la spec 008) :
  - `--background`, `--card`, `--popover`, `--secondary`, `--muted` et `--sidebar` prennent la même couleur de surface, en clair et en sombre ;
  - nouvelles variables d'ombre : `--shadow-raised`, `--shadow-raised-sm`, `--shadow-raised-lg` (survol), `--shadow-inset`, `--shadow-lift` (tâche soulevée) et `--shadow-pressed` (bouton enfoncé). Elles sont construites dans `:root` à partir de `--neu-light` et `--neu-dark` (variables `--neu-*`), puis exposées dans `@theme inline` : le mode sombre ne redéfinit que les deux couleurs ;
  - nouvelles couleurs de statut : `--success`, `--success-foreground`, `--info`, `--info-foreground`.
- **Utilitaires Tailwind** déclarés dans `@theme` : `shadow-raised`, `shadow-inset`, `bg-success`… Les composants les utilisent comme les autres classes, sans CSS propre à chacun.
- **Composants Helm** (`frontend/libs/ui/`) : on retire `border` et `shadow-xs` des classes de chaque variante et on met à la place une ombre en relief ou en creux. Leur logique, leurs entrées et leur accessibilité ne changent pas.
- **Glisser-déposer** : on style les classes que le CDK ajoute déjà (`.cdk-drag-preview`, `.cdk-drag-placeholder`, `.cdk-drag-anchor`, `.cdk-drop-list-dragging`, `.cdk-drag-animating`) dans le `template.scss` du composant. `component.ts` n'est pas modifié.
  - La colonne survolée porte `.cdk-drop-list-dragging` ; `.cdk-drop-list-receiving` est posée sur toutes les colonnes qui peuvent recevoir la tâche.
  - La trace à l'origine vient de `cdkDropListHasAnchor` : sans elle, la case vide suit la tâche dans la colonne survolée.
    Risque accepté : avec cette option, un dépôt échoue parfois (la tâche revient à sa place, sans message). Mesuré en T10 : 3 échecs sur 60 répétitions de R14 / R15, aucun sur 60 sans l'option. Une trace faite par le composant a été écartée.
  - Inclinaison et agrandissement par `rotate` / `scale`, car le CDK déplace l'aperçu avec `transform`.
  - Le dépôt (et l'enregistrement du statut) part à la fin de l'animation de pose (250 ms) : le helper `drag` des tests e2e attend la disparition de l'aperçu.
- **Réduire les animations** : une seule règle `@media (prefers-reduced-motion: reduce)` dans `styles.css` coupe les transitions et animations.
- **Écarté** :
  - un thème neumorphique tout fait (Neumorphism UI de Themesberg) : il est écrit pour Bootstrap, alors que l'app utilise Spartan et Tailwind v4 ;
  - une classe CSS par composant dans `styles.css` : ça doublerait les variantes Helm, qui restent le seul endroit où un composant est stylé.

## Impacts

- **Base** : aucun.
- **API** : aucune.
- **Contrats** : aucun.
- **Front** :
  - `styles.css` ;
  - les composants Helm (button, badge, card, tabs, progress, input, textarea, checkbox, dialog, sonner) ;
  - `layout/sidebar` et `layout/header` ;
  - `components/progress`, `services/user-story-status.ts` ;
  - les pages Sprint (`pages/sprint`, `pages/sprint/forms/user-story`).
- **Tests** : `tests/e2e/layout/style.spec.ts` et `tests/e2e/user-story/logic.spec.ts`, plus un nouveau test pour le glisser-déposer.
- **Docs** : `cahier-de-recettes.md` (R64 à R73), la spec 008 (renvoi vers la 012) et `THIRD-PARTY-NOTICES.md`.

## Tâches

Courtes, dans l'ordre : le code s'arrête après chaque tâche pour validation.

- [x] **T1 — Variables du thème** : surface unique et ombres en clair et en sombre, couleurs de statut, utilitaires `@theme`, règle « réduire les animations » (`styles.css`).
  → vérif : lint + build.
  → à regarder : le diff de `styles.css`. Dans l'app, le fond et les cartes ont la même couleur ; les bordures restent jusqu'à T2–T5.
- [x] **T2 — Boutons et badges** : variantes principale, destructive, `outline`, `ghost`, secondaire ; enfoncement au clic (`libs/ui/button`, `libs/ui/badge`).
  → vérif : lint + build + parcours navigateur.
  → à regarder : « New Story », « Clôturer le sprint » et les badges de points sur le Sprint (R65).
- [x] **T3 — Cartes, onglets, progression** : cartes en relief qui ressortent au survol, barre d'onglets en creux et onglet actif en relief, rail de progression en creux (`libs/ui/card`, `libs/ui/tabs`, `libs/ui/progress`).
  → vérif : lint + build + parcours navigateur.
  → à regarder : la page Backlog (R64, R66).
- [x] **T4 — Champs de formulaire** : champs, zones de texte, cases à cocher, `.select` et `.list-zone` en creux, avec un trait léger et le focus bleu (`libs/ui/input`, `libs/ui/textarea`, `libs/ui/checkbox`, `styles.css`).
  → vérif : lint + build + parcours navigateur au clavier.
  → à regarder : le formulaire « New Story » et la liste du Sprint, parcourus à la touche Tab (R70).
- [x] **T5 — Modals et toasts** : modal en relief marqué sur le fond assombri, toasts en relief (`libs/ui/dialog`, `libs/ui/sonner`).
  → vérif : lint + build + parcours navigateur.
  → à regarder : ouvrir une story, l'enregistrer, regarder le toast (R67).
- [x] **T6 — Barre latérale et en-tête** : plus de bordure, lien actif en creux, boutons de l'en-tête en relief (`layout/sidebar`, `layout/header`). Mettre à jour `style.spec.ts` si la classe du lien actif change.
  → vérif : lint + build + `just tests --grep R40`.
  → à regarder : la navigation, barre repliée et dépliée, sur mobile et sur grand écran.
- [x] **T7 — Couleurs de statut en variables** : remplacer `emerald`, `blue` et `gray` écrits en dur par `success`, `info` et les variables de surface (`components/progress`, `services/user-story-status.ts`, `pages/sprint`, `layout/sidebar`). Mettre à jour `logic.spec.ts` (`bg-emerald-500` devient `bg-success`).
  → vérif : lint + build + `just tests --front`.
  → à regarder : le badge « en cours » du Sprint et une progression à 100 %, en clair et en sombre.
- [x] **T8 — Tableau Sprint et glisser-déposer** : colonnes en creux, tâches en relief, et styles des classes CDK (soulevée et inclinée, trace pâle, colonne en creux avec contour bleu, tâche qui se repose) (`pages/sprint/forms/user-story/template.html` et `template.scss`).
  → vérif : lint + build + parcours navigateur, dont un passage avec « réduire les animations ».
  → à regarder : glisser une tâche d'une colonne à l'autre (R68, R69).
- [x] **T9 — Calibrage du mode sombre et du contraste** : ajuster les valeurs de surface et d'ombre, puis mesurer les contrastes des textes (`styles.css`).
  → vérif : mesures de contraste (outils du navigateur) ≥ 4,5:1, en clair et en sombre.
  → à regarder : chaque page et chaque modal en sombre (R71, R72).
- [x] **T10 — Test e2e du glisser-déposer** : vérifier que la tâche change de colonne et que son statut est enregistré après le lâcher (`tests/e2e/…`, ID R68).
  → vérif : `just tests --grep R68`, puis `just tests` complet (R73).
  → à regarder : le rapport Playwright.
- [x] **T11 — Docs** : ajouter R64 à R73 dans `cahier-de-recettes.md` ; dans la spec 008, une ligne qui renvoie vers la 012 ; dans `THIRD-PARTY-NOTICES.md`, préciser ce qui reste de TailAdmin (police, rayons, cadre barre latérale / en-tête).
  → vérif : relecture.
  → à regarder : les trois fichiers.
