#!/usr/bin/env bash
# Régénère contracts/*.ts depuis les types Rust (#[derive(TS)]) du back.
# À lancer après avoir modifié un controller.rs ou un statut. Rust tourne dans Docker.
set -euo pipefail
cd "$(dirname "$0")/.."

docker run --rm \
  -v "$PWD:/work" -w /work/backend \
  -v firescrum-cargo-registry:/usr/local/cargo/registry \
  -v firescrum-cargo-target:/target -e CARGO_TARGET_DIR=/target \
  rust:1-bookworm \
  sh -c "rm -rf /work/contracts && cargo test --quiet export_bindings && chown -R $(id -u):$(id -g) /work/contracts"

echo "Contrats générés dans contracts/ :"
ls contracts
