# Specs

Une évolution fonctionnelle = un dossier `NNN-nom/` (numéro sur 3 chiffres, nom court en kebab-case).

```
specs/
├── _modele/          ← à copier pour une nouvelle spec
│   ├── spec.md
│   └── plan.md
└── 001-page-sprint/
    ├── spec.md       ← ce que fait la fonctionnalité et pourquoi : gardé
    └── plan.md       ← comment on la construit : supprimé à la livraison
```

## Étapes

Le déroulé (spec → plan → code → livraison) est dans le skill [dstory](../../.claude/skills/dstory/SKILL.md), lancé par Claude pour chaque évolution fonctionnelle.

## Specs

| N° | Spec | Statut |
|----|------|--------|
| 001 | [Socle technique](001-socle-technique/spec.md) | Livrée |
| 002 | [Modèle de données et API (lot 1)](002-modele-et-api/spec.md) | Livrée |
| 003 | [Page Backlog](003-backlog/spec.md) | Livrée |
| 004 | [Tâches d'une US](004-taches/spec.md) | Livrée |
| 005 | [Page Features](005-features/spec.md) | Livrée |
| 006 | [Page Planning](006-planning/spec.md) | Livrée |
| 007 | [Page Sprint](007-page-sprint/spec.md) | Livrée |
| 008 | [Nouveau look : barre latérale et mode sombre](008-style-tailadmin/spec.md) | Livrée |
| 009 | [Modals de taille fixe et listes qui défilent](009-modals-taille-fixe/spec.md) | Livrée |
| 010 | [Tests navigateur indépendants et environnements séparés](010-tests-e2e-independants/spec.md) | Livrée |
| 011 | [Tests de l'API indépendants, au même endroit que les tests navigateur](011-tests-api-playwright/spec.md) | Livrée |
| 012 | [Style neumorphique](012-style-neumorphique/spec.md) | Brouillon |
