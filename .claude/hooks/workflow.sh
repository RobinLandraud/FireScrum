#!/usr/bin/env bash
# UserPromptSubmit hook: injects the project workflow (workflow.md) into Claude's context on every request.
cat "$(dirname "$0")/workflow.md"
