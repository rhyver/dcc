# DCC — DCS Campaign Creator

A desktop application for creating and managing DCS World campaigns. Built with Electron, React, and TypeScript in a pnpm monorepo.

## Tech Stack

- **Runtime:** Electron (main process) + Node.js
- **Frontend:** React 19, Vite, Tailwind CSS v4
- **Language:** TypeScript
- **RPC:** ORPC with Zod schemas for type-safe frontend ↔ backend communication
- **State:** TanStack Query, XState Store
- **Maps:** MapLibre GL, react-map-gl, Turf.js
- **Monorepo:** pnpm workspaces + Turborepo
- **Packaging:** electron-builder

## Workspace Layout

```
apps/
  core/       — Electron main process; ORPC server, window management, mission generation
  campaign/   — Primary renderer; campaign manager UI with interactive map
  document/   — Secondary renderer; document/reference views
packages/
  contracts/  — Shared ORPC contracts and Zod schemas
  data/       — Static DCS domain data (aircraft, factions, theatres, scenarios)
  generate-miz/ — .miz file assembly (TypeScript → Lua → ZIP)
  lua-table/  — Lua table parser/stringifier
```

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+

### Install

```bash
pnpm install
```

## Development

Run everything (Electron + both Vite dev servers) via Turborepo:

```bash
pnpm dev
```

The renderers are served at:
- Campaign UI → `http://localhost:5173`
- Document UI → `http://localhost:5174`

To run a single workspace:

```bash
pnpm --filter @dcc/core dev
pnpm --filter @dcc/campaign dev
pnpm --filter @dcc/document dev
```

## Build

Build all packages and apps:

```bash
pnpm build
```

Package the desktop app (runs build first, then electron-builder):

```bash
# Windows
pnpm build:win

# macOS
pnpm build:mac

# Linux
pnpm build:linux

# Unpacked directory only
pnpm build:unpack
```

## Code Quality

```bash
# Lint all workspaces
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Type-check all workspaces
pnpm tsc
```

## Data Flow

1. **Campaign UI** — user triggers an action (e.g. generate a mission)
2. **ORPC client** — request is typed via shared `@dcc/contracts`
3. **Core (main process)** — receives the request over ORPC
4. **Logic** — uses `@dcc/data` for game assets, `@dcc/generate-miz` + `@dcc/lua-table` to compile the `.miz` file
5. **Response** — result returned to the renderer
