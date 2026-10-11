# DCC - DCS Campaign Creator

DCC is an Electron desktop app for building and managing DCS World campaigns.
It combines a campaign planning UI, map-based operations tooling, shared DCS
data packages, and mission generation logic in one TypeScript monorepo.

## What It Does

- Build and manage campaign state in a desktop app
- Visualize campaign data in a React-based map interface
- Generate DCS mission content from shared contracts and domain data
- Package mission data into `.miz`-compatible output
- Optionally use AI-assisted mission planning inside the app settings

## Stack

- Electron for the desktop shell and main process
- React 19 and Vite for the renderer apps
- TypeScript across apps and shared packages
- ORPC and Zod for typed client/server contracts
- Tailwind CSS for renderer styling
- TanStack Query and XState Store for frontend state flows
- MapLibre GL and Turf.js for map rendering and spatial logic
- Turborepo for workspace task orchestration
- Vitest for unit tests
- Bun as the package manager (Node.js runs the tooling)

## Workspace Layout

```text
apps/
  core/         Electron main process, window lifecycle, ORPC backend APIs
  frontend/     Main renderer: campaign planning and map workflows
  document/     Document/reference renderer (packaged with the desktop app)
  website/      Public marketing site (prerendered static build)

packages/
  campaign/     Campaign simulation logic (IADS, ground deployment, carrier ops, scenarios)
  contracts/    Shared ORPC contracts and Zod schemas
  data/         Static DCS data such as aircraft, factions, theatres, scenarios
  generate-miz/ Mission assembly pipeline for `.miz` output
  lua-table/    Lua table parser/stringifier utilities
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1.3+ (the repo pins `bun@1.3.13` via `packageManager`)
- [Node.js](https://nodejs.org/) `^20.19` or `>=22.12` (required by Vite 8 and
  electron-vite). It must be a real Node install: ESLint, Vitest and
  electron-vite run on `node`, and Bun's `node` shim is not enough.

### Install

```bash
bun install
```

Electron downloads its binary the first time it starts, so the first
`bun run dev` takes longer.

### Run In Development

This starts the Electron app plus all Vite dev servers through Turborepo.

```bash
bun run dev
```

The Electron window loads the frontend from `http://localhost:5173`. The
`website` and `document` dev servers also start; both are configured for port
`5174`, so whichever starts second moves to `5175`. Check the terminal output
for the actual URLs.

To work on a single app, filter the task, for example
`bunx turbo run dev --filter=@dcc/website`.

#### Optional setup

- **DCS install path:** set it in the app settings, or export
  `DCS_INSTALL_PATH`, so DCC can find `Scripts/MissionScripting.lua`.
  Without it the app runs, but it logs a warning and skips DCS persistence
  setup.
- **Offline map tiles:** Caucasus, Persian Gulf and Syria tiles are committed
  under `apps/frontend/public/maps`. The South Atlantic tiles are not committed;
  generate them (and refresh the others) with `bun run cache:map`. Until then,
  kneeboard route maps for that theatre omit terrain features.

### Running On Linux

Lint, type checks, tests and `bun run dev` all work on Linux. The one common
problem is Electron's Chromium sandbox. On distributions that restrict
unprivileged user namespaces (for example Ubuntu 23.10+), `bun run dev` can
abort right after `starting electron app...` with:

```text
The SUID sandbox helper binary was found, but is not configured correctly ...
chrome-sandbox is owned by root and has mode 4755.
```

Fix it in either of two ways:

```bash
# Option A (keeps the sandbox): make the helper setuid root.
# Repeat this after every reinstall of Electron.
sudo chown root:root node_modules/.bun/electron@*/node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/.bun/electron@*/node_modules/electron/dist/chrome-sandbox

# Option B (development only): run Electron without the sandbox.
# Start the frontend dev server in one terminal...
cd apps/frontend && bun run dev
# ...and Electron in another:
cd apps/core && FRONTEND_URL=http://localhost:5173 bunx electron-vite dev -- --no-sandbox
```

`ELECTRON_DISABLE_SANDBOX=1` does not get around this error. Pass
`--no-sandbox` instead.

### Build

Build all apps and packages:

```bash
bun run build
```

Package desktop builds:

```bash
# Windows
bun run build:win

# macOS
bun run build:mac

# Linux
bun run build:linux

# Linux x64 AppImage + Debian package via Docker (also works on Windows)
bun run build:linux:docker

# Unpacked directory only
bun run build:unpack
```

## Quality Checks

```bash
bun run lint
bun run lint:fix
bun run tsc
bun run test
bun run format   # prettier --write .
```

Tests run with Vitest in `@dcc/frontend`, `@dcc/campaign` and
`@dcc/generate-miz`.

## Releasing

`bun run release` bumps the version (`<base>-YYYYMMDDNN`), commits, tags, and pushes to
`main`. The tag starts the [Release workflow](.github/workflows/release.yml), which builds
the Windows installer and the Linux x64 AppImage and Debian packages from the tag, verifies
them, and uploads them with both update manifests to a draft GitHub release. Install the
GitHub CLI and run `gh auth login` first. Releases are cut from `main`, which must match
`origin/main`. Keep the existing `0.5.0-YYYYMMDDNN` version format and write release notes
in `docs/releases/v<version>.md` before starting a release.

After checking the draft, publish it with `bun run release --publish`. To rebuild a failed
release, run the Release workflow manually with the existing tag.

```bash
bun run release                         # auto version, commit, tag, push; CI builds the draft
bun run release 0.5.0-2026101101        # explicit version
bun run release --publish               # publish the checked draft as the latest release
```

To verify packaging locally without releasing, run `bun run build:win` or, with Docker
Desktop running Linux containers, `bun run build:linux:docker` (output in `dist/linux`).

Windows automatic updates read a generic feed from the latest GitHub release
(`releases/latest/download`), preserving compatibility with date-based versions. Versioned
releases are published as regular (non-prerelease) releases and marked latest only after all
artifacts are uploaded. Linux updates remain manual.
See [the migration checklist](docs/plans/github-release-migration.md) for Codeberg users.

## Mission Generator Notes

The core app supports AI-backed mission planning. API keys are configured inside
the application settings rather than through required repo-level environment
variables. The current code supports OpenAI, Anthropic, and OpenRouter-backed
models via the Vercel AI SDK.

## Architecture

1. The `frontend` renderer collects user input and drives campaign workflows.
2. Shared contracts from `@dcc/contracts` define the typed request/response boundary.
3. The Electron `core` app handles orchestration and backend operations.
4. Campaign simulation from `@dcc/campaign`, domain data from `@dcc/data` and
   generation logic from `@dcc/generate-miz` are used to assemble mission output.
5. Lua-oriented serialization helpers from `@dcc/lua-table` support DCS file generation.

## License

MIT. See [LICENSE](./LICENSE).
