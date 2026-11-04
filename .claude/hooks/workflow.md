## FireScrum: classify this request before acting

- **Functional change**: new page, new business rule, data model or API change,
  **or changing a business rule of a delivered spec, even if the code change is one line**
  → run the `dstory` skill: it holds the whole workflow (spec, plan, code, delivery).
  A decision the user already made in the conversation counts as grilling,
  but the spec is still validated BEFORE any code.
- **Minor tweak**: label, style, a limit (e.g. "limite à 5"), an obvious bug → straight to code.
- **Question or discussion** → answer, change nothing.

If unsure which one it is, ask.
