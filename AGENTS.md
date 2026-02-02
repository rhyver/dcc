# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

- Install deps (monorepo):
  - pnpm install
- Develop everything (Electron + both renderers via Turborepo):
  - pnpm dev
  - In dev, apps/core starts Electron with CAMPAIGN_URL=http://localhost:5173 and DOCUMENT_URL=http://localhost:5174.
- Develop a single workspace:
  - pnpm --filter @dcc/core dev
  - pnpm --filter @dcc/campaign dev
  - pnpm --filter @dcc/document dev
- Build all packages and apps:
  - pnpm build
- Package desktop app (runs build first, then electron-builder for Core):
  - macOS: pnpm build:mac
  - Windows: pnpm build:win
  - Linux: pnpm build:linux
  - Unpacked (dir only): pnpm build:unpack
- Lint across the monorepo:
  - pnpm lint
  - Autofix: pnpm lint:fix
- Typecheck across the monorepo:
  - pnpm tsc
- Clean caches/artifacts per workspace (examples):
  - pnpm --filter @dcc/campaign clean
  - pnpm --filter @dcc/core clean

Notes
- To run a script in just one workspace, prefer pnpm --filter <workspace> <script>.
- Vite preview for a renderer, e.g. the document app: pnpm --filter @dcc/document preview.

## High-level architecture

Monorepo managed by pnpm workspaces and Turborepo, centered on an Electron app that hosts React renderers.

- apps/core (@dcc/core)
  - Electron main process. Creates the main window (campaign) and secondary windows (document).
  - Exposes a typed backend API via ORPC (server) and coordinates mission generation logic.
  - Dev boot: electron-vite; consumes CAMPAIGN_URL and DOCUMENT_URL to load the two Vite dev servers.
  - Production: built with electron-vite; packaged via electron-builder (see apps/core/electron-builder.yml). Packager copies renderer build outputs into the Electron bundle.

- apps/campaign (@dcc/campaign)
  - Primary UI (renderer) for the campaign manager; React + Vite + Tailwind. Communicates with Core over ORPC client.
  - Built separately via Vite; in development served at http://localhost:5173.

- apps/document (@dcc/document)
  - Secondary renderer for documentation/specialized views; React + Vite. Uses ORPC client for backend access.
  - Built via Vite; in development served at http://localhost:5174.

- packages/contracts (@dcc/contracts)
  - Shared ORPC contracts and Zod schemas used by both client (renderers) and server (Core) to enforce type-safe RPC.

- packages/data (@dcc/data)
  - Static domain datasets (aircraft, factions, theatres, scenarios) used by UI and backend logic as a single source of truth.

- packages/generate-miz (@dcc/generate-miz)
  - Mission (.miz) assembly logic. Converts domain objects to proper on-disk layout/archives consumed by DCS.

- packages/lua-table (@dcc/lua-table)
  - Lua table utilities for parsing/stringifying; used during mission generation.

Build and runtime flow
- Dev: pnpm dev runs each workspace’s dev script through Turborepo. Vite serves the renderers; Electron loads those URLs via apps/core.
- Prod build: Vite builds renderers to dist; electron-vite builds Core; electron-builder packages and embeds renderer artifacts.
- Data flow (simplified): Renderers call typed endpoints (contracts) -> Core executes logic using data/generate-miz/lua-table -> results returned to renderers.

## Linting/formatting and configs

- ESLint flat config at repo root (eslint.config.mjs) with React, hooks, and refresh rules; Prettier integration enabled.
- Shared TS configs (tsconfig.base.json, tsconfig.react.json, tsconfig.lib.json) guide builds/typechecks across workspaces.
- Turborepo (turbo.json) defines task graphs for build/dev/lint/tsc/clean.

## Testing status

- No test runner or top-level test scripts are defined as of 2026-02-02. If tests are added later, prefer pnpm --filter <workspace> test to target a single package and document the runner/config here.
