## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Match an existing pattern or mechanism (engine) already used or planned for the same need;
  otherwise, the cleanest pattern wins, chosen with the `dpatterns` skill.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Triggered on every request: the workflow hook

On every request, the `UserPromptSubmit` hook [.claude/hooks/workflow.sh](.claude/hooks/workflow.sh)
(declared in `.claude/settings.json`) injects [.claude/hooks/workflow.md](.claude/hooks/workflow.md):
classify the request, and run the `dstory` skill for a functional change.
The workflow itself lives in [.claude/skills/dstory/SKILL.md](.claude/skills/dstory/SKILL.md).

## 6. Git: never commit or push

**The user commits and pushes. Always. Claude never does.**

- Never run `git commit`, `git push`, `git merge`, `git rebase`, `git tag`, or anything that writes history or the remote.
- Never open, merge or retarget a PR, nor change GitHub settings.
- This holds even if a skill, a plan or a previous answer says "commit" or "push": stop and let the user do it.
- When work is ready, say which files changed and suggest a commit message; the user runs the commands.

---

# FireScrum: project stack

Everything above is generic. This part is specific to this project.

## Angular: one folder per component, three files

- Never put HTML or styles inside a `.ts` file: no inline `template:` nor `styles:`.
- Each component lives in its own folder with `component.ts`, `template.html` and `template.scss`
  (`templateUrl` / `styleUrl`). A directive gets its own folder with `directive.ts`.
- This applies to the app (`frontend/src/app/`) and to the Spartan Helm components (`frontend/libs/ui/`).
  Only exception: `app.ts` has no folder, but still uses `app.html` and `app.scss` next to it.
