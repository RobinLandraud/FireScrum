---
name: dwrite
description: From the spec and plan validated in the conversation, gives a ready-to-paste ticket in markdown (functional title, description, recommended approach, validation tests), offers to create it as a GitHub issue, then offers to write docs/specs/NNN-name/spec.md and plan.md. Use after dspec and dplan, or when asked for the ticket of a validated spec.
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

## 2. Offer to create the issue

Ask: « Je crée l'issue sur GitHub ? »

- **Yes**: call `mcp__github__issue_write` with `method: create`, `owner: RobinLandraud`, `repo: FireScrum`,
  `title` = the ticket's Titre (without `# `), `body` = the rest of the ticket, unchanged.
  Claude Code asks the developer for approval; then give the issue's link.
  If the call is refused (`dontAsk` mode never prompts), say so: the developer switches mode, or pastes the ticket by hand.
- **No**: go on.

Never close, reopen, delete or transfer an issue.

## 3. Offer to write the files

Ask: « J'écris la spec et le plan dans `docs/specs/` ? »

- **Yes**:
  - new spec: pick the next number in the table of `docs/specs/README.md` and a short kebab-case name,
    write `docs/specs/NNN-name/spec.md` and `plan.md` with the **full** content of the spec and the plan
    (not the ticket), and add the spec to the table of `docs/specs/README.md`;
  - existing spec: update its `spec.md` in place and write its `plan.md`.
  Then give the links.
- **No**: stop. No file, and no code: coding needs `plan.md` on disk.
