---
name: dplan
description: Drafts the content of plan.md (how a validated spec is built, split into short tasks) in the conversation, from the project template and the pattern choices settled with the dpatterns skill. Writes no file. Use when asked to draft or update the plan of a spec.
---

# Define plan: draft `plan.md`

Write in French, like the rest of `docs/`. Write no file and no code:
give the content in the conversation (files are written by the `dwrite` skill).

1. Read the validated spec, the code it touches, and the pattern choices settled in the conversation.
2. Follow `docs/specs/_modele/plan.md`, section by section:
   - **Approche**: technical choices (the patterns chosen with the `dpatterns` skill, and its diagrams)
     and the alternatives ruled out, each with its reason;
   - **Impacts**: database, API, contracts (ts-rs), front;
   - **Tâches**: the work split into short tasks `T1`, `T2`…, in the order they will be coded.
     Each task:
     - is small enough to be reviewed in a few minutes: one layer or one behavior, a handful of files;
     - leaves the project building and its tests passing;
     - has its verification ("→ vérif : tests API", "→ vérif : lint + build + parcours navigateur");
     - says what the human should look at ("→ à regarder : …": a route to call, a screen to open, a file to read).
     Tests and docs are tasks too, not a last catch-all step.
