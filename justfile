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

# Tests on the test stack (port 4201): just tests [api bruno e2e]
tests *suites:
    scripts/test.sh "$@"

# e2e suite only, options passed to Playwright: just e2e --grep R49, just e2e --ui
e2e *args:
    scripts/test.sh e2e -- "$@"
