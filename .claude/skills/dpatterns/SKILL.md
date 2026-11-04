---
name: dpatterns
description: Before planning the code of a validated spec, checks the change against the design-pattern catalogue (mechanisms, SOLID, GoF patterns) and grills the user on the relevant ones only, in rounds of numbered questions with a recommended answer, with mermaid diagrams when they help. Use when asked which patterns or design to use for a change.
---

Interview the user relentlessly, in French, until every pattern choice for the change is settled. Map this as a **design tree**: every pattern choice branches into the choices that hang off it (e.g. an interface opens strategy, abstract factory, decorator, proxy).

Go through every entry of [catalogue.md](catalogue.md) yourself, so none is forgotten, but ask only the **relevant** ones: a pattern the change could really use, or several patterns competing for the same need. Don't ask the obvious "no".
If no entry is relevant (e.g. a change with no logic: style, wording), ask nothing: say so in one line and stop.

Before the first round, read the validated `spec.md` and the code it touches.

Work the tree in **rounds**. The **frontier** is every entry whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Format a round like so:

```
❓ **Q1** - **<pattern name>**: <where it could apply in this change (route, component, table), the options and their trade-offs, might be multiple paragraphs, and a mermaid diagram when it makes the choice easier to check>

➡️ <your recommended answer: use it or not, where, and why>

---

❓ **Q2** - **<pattern name>**: <question body>

➡️ <your recommended answer>
```

Word each question so "yes" accepts your recommended answer.

If the code already has a pattern or a mechanism (engine) for this same need, used or planned, recommend reusing it. Otherwise, recommend the cleanest design for the need, not the most familiar one.

Draw a mermaid diagram only when it makes a choice easier to check: `sequenceDiagram` for a flow (front, API, transaction, database), `stateDiagram-v2` for a life cycle, `classDiagram` or `flowchart` for structure.

Each round the user answers reshapes the tree: settled choices push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the code, dispatch a sub-agent with a fresh context window to find it; don't ask the user for anything you could look up yourself. Don't block on it: only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _choices_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every relevant entry asked and answered, nothing left silently assumed. Then give the list of chosen patterns (where each applies) and the final diagrams, for the "Approche" section of `plan.md`. Write nothing to the repo: files are written by the `dwrite` skill. Do not act on it until the user confirms you have reached a shared understanding.
