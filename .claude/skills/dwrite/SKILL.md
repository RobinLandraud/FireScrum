---
name: dwrite
description: From the spec and plan validated in the conversation, gives a ready-to-paste ticket in markdown (functional title, description, recommended approach, validation tests), then offers to write docs/specs/NNN-name/spec.md and plan.md. Use after dspec and dplan, or when asked for the ticket of a validated spec.
---

# Define write: the ticket, then the files

Write in French, like the rest of `docs/`.

## 1. The ticket

Fill [ticket.md](ticket.md) from the validated spec and plan, and give it in the conversation
inside a single ```markdown block, ready to copy and paste:
- **Titre**: the spec's title, without technical terms;
- **Description**: Contexte, Comportement attendu and Règles métier of the spec, condensed;
- **Approche recommandée**: the patterns of the plan's Approche (where each applies), with its diagrams;
- **Tests de validation**: the spec's Recettes, unchanged.

## 2. Offer to write the files

Ask: « J'écris la spec et le plan dans `docs/specs/` ? »

- **Yes**:
  - new spec: pick the next number in the table of `docs/specs/README.md` and a short kebab-case name,
    write `docs/specs/NNN-name/spec.md` and `plan.md` with the **full** content of the spec and the plan
    (not the ticket), and add the spec to the table of `docs/specs/README.md`;
  - existing spec: update its `spec.md` in place and write its `plan.md`.
  Then give the links.
- **No**: stop. No file, and no code: coding needs `plan.md` on disk.
