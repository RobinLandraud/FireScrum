# AI usage charter · FireScrum team

We use AI to move faster, without exposing our data, our code or our users.
Each rule below states how we check that it is followed.

## Data
| Rule | Checked by | Owner |
|---|---|---|
| No agent reads `.env`, `.config/` or the `data/` folder | Deny rules `Read(./.env)`, `Read(./.config/**)` and `Read(./data/**)` in `.claude/settings.json` | Lead dev |
| Never real data in a prompt or a test | Throwaway test database (`docker-compose.test.yml`), fake data in `tests/fixtures.ts` | Each dev |
| No hand-written SQL: everything goes through SeaORM | PR review: no `format!` building SQL in `backend/` | Back-end dev |

## Tools
| Rule | Checked by | Owner |
|---|---|---|
| Only allowed agent: Claude Code, organization account, training on our data disabled | Privacy settings of the Anthropic organization | Lead dev |
| MCP servers from a known source, pinned version | Review of `.mcp.json` (`@angular/cli@22`, `@spartan-ng/mcp@1.9`, `@playwright/mcp@0.0.84`), `github/github-mcp-server` v2.1.0 image pinned by digest) | Lead dev |
| The GitHub MCP server reaches FireScrum issues only, as `firescrumbot[bot]` | GitHub App `firescrumbot`: *Issues: Read and write* only, installed on FireScrum only; private key in `.config/github-app.pem` (git-ignored, read denied), one key per dev, revoked on leave; `issues` toolset without comment and sub-issue tools (`.mcp.json`) | Lead dev |

## Agents
| Rule | Checked by | Owner |
|---|---|---|
| No auto-approval outside the allowlist | `defaultMode: dontAsk` and `allow` list in `.claude/settings.json`, which the agent cannot edit (deny rule) | Lead dev |
| The agent adds no npm dependency | Deny rule `Edit(./**/package.json)`, `npm install` not in the allowlist | Lead dev |
| CLAUDE.md has a security section (OpenSSF guide) | File reviewed in PR | Lead dev |
| The agent never commits or pushes | CLAUDE.md §6, `git commit`/`git push` not in the allowlist | Each dev |
| The agent creates or edits a GitHub issue only with the developer's approval, and never closes one | Ask rule `mcp__github__issue_write` in `.claude/settings.json` (prompts even in auto mode, denied in `dontAsk`): the developer refuses a call with `state: closed` | Each dev |

## Code
| Rule | Checked by | Owner |
|---|---|---|
| No secret is committed | gitleaks (image pinned by digest): hook `.github/hooks/pre-commit` refuses the commit, CI `.github/workflows/gitleaks.yml` fails on push | Each dev |
| Tests pass before any PR | `just tests` green, output pasted in the PR | PR author |
| Every PR to `dev` is reviewed by a human | Branch protection on `dev` on GitHub, required review (to enable within 30 days) | Lead dev |

## Traces
| Rule | Checked by | Owner |
|---|---|---|
| AI-assisted commits carry a `Co-Authored-By` trailer | Review of `git log` in PR | Each dev |
| Every functional change has its spec in `docs/specs/NNN-name/` | `UserPromptSubmit` hook (`dstory` workflow), PR review | Each dev |

## In case of incident
- Data or a secret was sent to a tool: stop, revoke the secret, report it the same day.
- Personal data breach: the DPO notifies the CNIL within 72 h (GDPR, art. 33).
- Who to notify: [CISO], [DPO]. Channel: [channel].

## Recommendations
- Review generated code like human code; ask the agent to critique, then fix, its own answer.
- Check that a suggested dependency exists and is maintained before adding it (hallucinated packages, *slopsquatting*).
- Give the agent the minimum context it needs.

## Review
Next review: February 17, 2027. Frequency: every three months. Owner: Lead dev.
