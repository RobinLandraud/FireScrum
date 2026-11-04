#!/usr/bin/env bash
# Lance la stack de test (base en mémoire, port 4201), joue les tests, puis l'arrête.
# La stack de travail (port 4200) et sa base ne sont jamais touchées.
#   scripts/test.sh            → api + bruno + e2e
#   scripts/test.sh api e2e    → seulement les suites citées
#   KEEP=1 scripts/test.sh     → laisse la stack de test lancée à la fin
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE=(docker compose -p firescrum-test -f docker-compose.yml -f docker-compose.test.yml)
URL=http://localhost:4201
if [ $# -gt 0 ]; then SUITES=("$@"); else SUITES=(api bruno e2e); fi

[ "${KEEP:-}" = 1 ] || trap '"${COMPOSE[@]}" down >/dev/null 2>&1' EXIT

wait_api() {
  for _ in $(seq 1 60); do curl -sf "$URL/api/project" >/dev/null && return; sleep 1; done
  echo "La stack de test ne répond pas sur $URL" >&2
  exit 1
}

# Base vide avant chaque suite : la base en mémoire est perdue au redémarrage du conteneur.
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
      # Playwright est installé dans le conteneur (/w) : rien n'est écrit dans tests/e2e, sauf les captures.
      docker run --rm --network host -e BASE="$URL" -e SHOTS=/e2e/screenshots/ -v "$PWD/tests/e2e:/e2e" \
        mcr.microsoft.com/playwright:v1.64.1-noble \
        sh -c "mkdir -p /w /e2e/screenshots && cp /e2e/*.mjs /w/ && cd /w \
          && npm i --silent --no-save playwright@1.64.1 >/dev/null 2>&1; node pages.mjs; s=\$?; \
          chown -R $(id -u):$(id -g) /e2e/screenshots; exit \$s" || status=1
      ;;
    *)
      echo "Suite inconnue : $suite (api, bruno, e2e)" >&2
      status=1
      ;;
  esac
done
exit $status
