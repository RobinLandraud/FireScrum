# Project entry point. `just --list` shows the recipes.
# Ports and credentials come from .env (template: .env.template), specific to each machine.

# Recipe arguments are passed through as is ("$@"), spaces included.
set positional-arguments

# Working stack: front, plus database and backend open on 127.0.0.1
dev:
    docker compose -p firescrum -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Production stack: only the front is published
prod:
    docker compose -p firescrum -f docker-compose.yml up -d --build

# Stops the working or production stack
down:
    docker compose -p firescrum down

# Runs on the test stack (port 4201, throwaway database), then stops it; KEEP=1 leaves it running.
# API and browser tests: just tests [--back | --front] [--ui] [Playwright options, e.g. --grep R49]
tests *args:
    #!/usr/bin/env bash
    set -euo pipefail
    # Own front port: the test stack runs next to the working one. HOST_UID: owner of the report.
    export FRONTEND_PORT=4201 HOST_UID="$(id -u):$(id -g)"
    compose=(docker compose -p firescrum-test -f docker-compose.yml -f docker-compose.test.yml)
    # --profile tests --remove-orphans: also removes a leftover tests container (one-off `run`, e.g. UI mode interrupted).
    [ "${KEEP:-}" = 1 ] || trap '"${compose[@]}" --profile tests down --remove-orphans >/dev/null 2>&1' EXIT
    echo "Construction et lancement de la stack de test…"
    "${compose[@]}" up -d --build >/dev/null
    for _ in $(seq 60); do curl -sf "http://localhost:$FRONTEND_PORT/api/project" >/dev/null && break; sleep 1; done
    curl -sf "http://localhost:$FRONTEND_PORT/api/project" >/dev/null \
      || { echo "La stack de test ne répond pas sur le port $FRONTEND_PORT" >&2; exit 1; }
    "${compose[@]}" run --rm --build --service-ports tests "$@"
