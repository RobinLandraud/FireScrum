#!/bin/sh
# Runs Playwright with the given arguments, after translating the project options:
#   --back  → API tests only (project api)
#   --front → browser tests only (project e2e)
#   --ui    → UI mode on http://localhost:9324, until Ctrl+C
for arg; do
  shift
  case "$arg" in
    --back) set -- "$@" --project=api ;;
    --front) set -- "$@" --project=e2e ;;
    --ui)
      echo "Mode UI : http://localhost:9324 (Ctrl+C pour arrêter)"
      set -- "$@" --ui-host=0.0.0.0 --ui-port=9324
      ;;
    *) set -- "$@" "$arg" ;;
  esac
done

npx playwright test "$@"
status=$?
# The container runs as root: give the report and traces back to the host user.
[ -n "$HOST_UID" ] && chown -R "$HOST_UID" report test-results 2>/dev/null
exit $status
