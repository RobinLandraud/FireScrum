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
    export HOST_UID="$(id -u):$(id -g)"  # owner given back to the report and traces
    compose=(docker compose -p firescrum-test -f docker-compose.yml -f docker-compose.test.yml --profile tests)
    # Stops the test stack even if tests fail; --remove-orphans also removes an interrupted `run` container.
    [ "${KEEP:-}" = 1 ] || trap '"${compose[@]}" down --remove-orphans >/dev/null 2>&1' EXIT
    "${compose[@]}" build --quiet
    # `run` starts the stack and waits until the front is healthy (see docker-compose.test.yml).
    "${compose[@]}" run --rm --service-ports tests "$@"
