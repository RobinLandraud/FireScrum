---
name: dspec
description: Drafts the content of spec.md (what and why) in the conversation, from the project template and the decisions settled with the grilling skill. Writes no file. Use when asked to draft or update a spec, including for something already built.
---

# Define spec: draft `spec.md`

Write in French, like the rest of `docs/`. Write no file, no code and no plan:
give the content in the conversation (files are written by the `dwrite` skill).

## 1. Check the decisions are settled

List the decisions the spec needs (behavior, business rules, edge cases, impact on what exists, out of scope).
Take them from the conversation, `docs/` and the code.
If one is still open, do not guess and draft nothing: list the open decisions and stop.

## 2. Draft the spec

Changing an existing spec (e.g. a business rule of a delivered spec): start from that `spec.md`
and give its updated content (behavior, rules, recettes, and the decision with its reason).

New spec: follow `docs/specs/_modele/spec.md`, section by section:
- **Titre**: what the user gets, without technical terms;
- **Contexte**: why the change, in a few lines;
- **Comportement attendu**: what the user sees and does, page by page, empty states included;
- **Règles métier**: what the back rejects, with the expected error;
- **Hors périmètre**, **Questions ouvertes** (only what the user explicitly postponed);
- **Recettes**: validation scenarios "action → résultat attendu", each with its ID in
  `docs/cahier-de-recettes.md` (new or changed);
- **Décisions**: choices made during the interview, each with its reason.

Status "Brouillon" (or "Livrée" when documenting something already built).
