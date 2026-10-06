#!/usr/bin/env bash
set -euo pipefail

# Install Linux dependencies in a separate filesystem, including native sharp binaries.
# The host checkout and its Windows node_modules stay untouched.
mkdir -p /project
tar -C /source --exclude=.git --exclude=node_modules --exclude=.turbo \
  --exclude=dist --exclude=out --exclude=artifacts --exclude='.env*' \
  --exclude=.aws --exclude=.codex --exclude=.claude \
  --exclude=apps/frontend/public/maps -cf - . | tar -C /project -xf -
ln -s /source/apps/frontend/public/maps /project/apps/frontend/public/maps
cd /project
bun install --frozen-lockfile
# Electron 42 has no postinstall, so bun install does not download the binary.
node node_modules/electron/install.js
bun run build
mkdir -p /output
cd apps/core
bun x electron-builder --projectDir ../.. -c apps/core/electron-builder.yml \
  --linux AppImage deb --x64 --publish never -c.directories.output=/output
