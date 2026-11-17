#!/usr/bin/env bash
# Regenerates contracts/*.ts from the backend's Rust types (#[derive(TS)]).
# Run after changing a controller.rs or a status. Rust runs in Docker.
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
