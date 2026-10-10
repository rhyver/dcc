# Contributing to DCC

Thanks for helping improve DCC. Bug reports, feature ideas, data fixes and code
changes are all welcome.

## Before You Start

- **Bugs and feature requests:** open an issue using one of the templates.
- **Questions and discussion:** join us on [Discord](https://discord.gg/jZZ3pFpY3e).
- **Security problems:** do not open a public issue. See [SECURITY.md](./SECURITY.md).
- **Code of conduct:** everyone taking part is expected to follow our
  [Code of Conduct](./CODE_OF_CONDUCT.md).
- **Larger changes:** open an issue first so we can agree on the approach before
  you spend time on it.

## Development Setup

You need:

- [Bun](https://bun.sh/) 1.3+ (the repo pins `bun@1.3.13` via `packageManager`)
- [Node.js](https://nodejs.org/) `^20.19` or `>=22.12`, installed for real. ESLint,
  Vitest and electron-vite run on `node`, and Bun's `node` shim is not enough.

```bash
bun install
bun run dev
```

`bun run dev` starts the Electron app and all Vite dev servers. See the
[README](./README.md#getting-started) for optional setup (DCS install path,
offline map tiles) and Linux sandbox notes.

## Project Layout

DCC is a Bun + Turborepo monorepo. The main pieces:

| Path                    | What lives there                                   |
| ----------------------- | -------------------------------------------------- |
| `apps/core`             | Electron main process and ORPC backend APIs        |
| `apps/frontend`         | Main renderer: campaign planning and map workflows |
| `apps/website`          | Public website                                     |
| `packages/campaign`     | Campaign simulation logic                          |
| `packages/contracts`    | Shared ORPC contracts and Zod schemas              |
| `packages/data`         | Static DCS data: aircraft, factions, theatres      |
| `packages/generate-miz` | Mission assembly pipeline for `.miz` output        |
| `packages/lua-table`    | Lua table parser/stringifier                       |

[STRUCTURE.md](./STRUCTURE.md) and [CONTEXT.md](./CONTEXT.md) go into more detail.

## Making Changes

1. Fork the repository and create a branch from `main`.
2. Keep each pull request focused on one change.
3. Run the checks below before opening the pull request.
4. Open a pull request against `main` and fill in the template.

### Checks

```bash
bun run lint     # ESLint across all workspaces
bun run tsc      # type checks
bun run test     # Vitest in @dcc/frontend, @dcc/campaign and @dcc/generate-miz
bun run format   # Prettier
```

Add or update tests when you change campaign simulation or mission generation
logic. If your change affects generated missions, test the `.miz` output in DCS
and say what you tested in the pull request.

### Commit Messages

Write a short, imperative summary line, for example `Add OH-58D Kiowa loadouts`
or `Fix carrier spawn heading`. Add a body when the reason for the change is not
obvious.

### Changelog

Maintainers write [CHANGELOG.md](./CHANGELOG.md) when cutting a release. Describe
user-facing changes in your pull request so they can be picked up there.

## Releases

Releases are cut by the maintainers with `bun run release`, which bumps the
version, builds the Windows and Linux packages, tags and publishes. See
[Releasing](./README.md#releasing) in the README.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](./LICENSE).
