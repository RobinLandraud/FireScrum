#!/usr/bin/env bash
# Starts the test stack (in-memory database, port 4201), runs the tests, then stops it.
# The working stack (port 4200) and its database are never touched.
#   scripts/test.sh            → api + bruno + e2e
#   scripts/test.sh api e2e    → only the listed suites
#   scripts/test.sh e2e -- …   → options passed to Playwright (e.g. --grep R49)
#   KEEP=1 scripts/test.sh     → leaves the test stack running at the end
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE=(docker compose -p firescrum-test -f docker-compose.yml -f docker-compose.test.yml)
# Database credentials, also needed by the e2e tests to empty the database.
set -a; . ./.env; set +a
# Test stack ports, distinct from the .env ones: it runs next to the working stack.
export FRONTEND_PORT=4201 DB_PORT=5443
URL=http://localhost:$FRONTEND_PORT
SUITES=()
while [ $# -gt 0 ] && [ "$1" != -- ]; do SUITES+=("$1"); shift; done
[ $# -gt 0 ] && shift
E2E_ARGS=("$@")
[ ${#SUITES[@]} -gt 0 ] || SUITES=(api bruno e2e)

[ "${KEEP:-}" = 1 ] || trap '"${COMPOSE[@]}" down >/dev/null 2>&1' EXIT

wait_api() {
  for _ in $(seq 1 60); do curl -sf "$URL/api/project" >/dev/null && return; sleep 1; done
  echo "La stack de test ne répond pas sur $URL" >&2
  exit 1
}

# Empty database before each suite: the in-memory database is lost when the container restarts.
reset_db() {
  "${COMPOSE[@]}" restart db >/dev/null
  "${COMPOSE[@]}" up -d --wait db >/dev/null
  "${COMPOSE[@]}" restart backend >/dev/null
  wait_api
}

echo "Construction et lancement de la stack de test…"
"${COMPOSE[@]}" up -d --build >/dev/null
wait_api

status=0
for suite in "${SUITES[@]}"; do
  echo "===== $suite"
  reset_db
  case "$suite" in
    api) API="$URL/api" bash tests/api.sh || status=1 ;;
    bruno) (cd bruno && npx -y @usebruno/cli run -r --env test) || status=1 ;;
    e2e)
      # node_modules lives in an anonymous volume: the local one (IDE types) is neither used nor touched.
      # Report and traces land in tests/e2e/report and tests/e2e/test-results.
      docker run --rm --network host -e BASE="$URL" -e DB_PORT \
        -e POSTGRES_USER -e POSTGRES_PASSWORD -e POSTGRES_DB \
        -v "$PWD/tests/e2e:/e2e" -v /e2e/node_modules -w /e2e \
        mcr.microsoft.com/playwright:v1.64.1-noble \
        sh -c 'npm ci --silent >/dev/null 2>&1; npx playwright test "$@"; s=$?; \
          chown -R '"$(id -u):$(id -g)"' report test-results 2>/dev/null; exit $s' sh "${E2E_ARGS[@]}" || status=1
      ;;
    e2e-legacy)
      # Old chained script, kept until every check is ported (spec 010).
      docker run --rm --network host -e BASE="$URL" -e SHOTS=/e2e/screenshots/ -v "$PWD/tests/e2e:/e2e" \
        mcr.microsoft.com/playwright:v1.64.1-noble \
        sh -c "mkdir -p /w /e2e/screenshots && cp /e2e/*.mjs /w/ && cd /w \
          && npm i --silent --no-save playwright@1.64.1 >/dev/null 2>&1; node pages.mjs; s=\$?; \
          chown -R $(id -u):$(id -g) /e2e/screenshots; exit \$s" || status=1
      ;;
    *)
      echo "Suite inconnue : $suite (api, bruno, e2e, e2e-legacy)" >&2
      status=1
      ;;
  esac
done
exit $status
