---
name: dstory
description: The FireScrum workflow for a functional change — runs grilling, dspec, dpatterns, dplan and dwrite in order (ticket and spec files), then, if the user wants, codes the plan task by task and delivers. Use for every functional change, or when asked to specify a feature or turn an idea into a ticket.
---

# Define story: from idea to delivery

Run these steps in order, with every STOP.

1. `grilling` (questions in French), until every decision is made
   (new spec, or the existing spec when changing a delivered one).
2. `dspec`. → STOP: the user validates the spec.
3. `dpatterns`, until every pattern choice is settled.
4. `dplan`. → STOP: the user validates the plan.
5. `dwrite`: the ticket in the conversation, then the offer to write the files.
   If the files are not written, stop here.
6. → STOP: ask « On passe au code ? ». If not, stop here.
7. **Code**: one task of `plan.md` at a time, in order. For each task:
   - code it, run its verification, tick it in `plan.md`;
   - → STOP: show what was done (files, verification result, what to look at) and the progress (`T3/8`),
     then wait for the user before the next task. "enchaîne" means: go on without stopping until the end.
8. **Delivery**:
   - move the decisions worth keeping from `plan.md` to the "Décisions" section of `spec.md`;
   - update `docs/api.md`, `docs/cahier-de-recettes.md`, `docs/idee-projet.md` if needed;
   - set the spec status to "Livrée" and delete `plan.md` (the code is the source of truth for the how).
