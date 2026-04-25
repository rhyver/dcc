# DCC Alpha Readiness Review

_Date: 2026-04-25 — Project version: 0.5.0_

This document reviews the DCC (DCS Campaign Creator) project for a first
alpha/testing release and lists missing features grouped by priority.

## Strengths — already ready

- **Core loop works end-to-end**: new campaign → simulate → autosave → export `.miz`.
  Flight/ground/SAM systems tick, packages/spawning logic, airport capture, and
  transport/CTLD are all wired.
- **AI Mission Generator** with provider switching (OpenAI / Anthropic / OpenRouter)
  and a saved-briefings library.
- **Settings** with DCS install auto-detect and `MissionScripting.lua` patching
  (with backup/restore on exit).
- **Persistence** to `userData` with multi-campaign support and 5-second autosave.
- **Build pipeline** (electron-builder for win/mac/linux) is configured and
  produces installers.

## Blockers — must fix before tagging alpha

1. **Placeholder publish URL.** `electron-builder.yml` ships
   `https://example.com/auto-updates`, and the app does not call
   `autoUpdater.checkForUpdatesAndNotify()`. Either point at a real
   generic/GitHub-Releases endpoint and wire the updater in
   `apps/core/src/main/index.ts`, or remove the publish stanza so update checks
   don't fire against `example.com`.
2. **Default `appId`.** `appId: com.electron.app` is the Electron template
   default — change to something like `at.digitalcrewchief.dcc` before any
   installer ships. Changing later breaks update channels.
3. **High-frequency `console.log` in the simulation loop.**
   `apps/campaign/src/logic/index.ts` ("fast tick" / "logic tick") plus ~45
   other call sites will hammer the renderer console. Gate behind a `DEBUG`
   flag.
4. **No global error boundary.** The router only handles `INVALID_APP_STATE`;
   everything else white-screens. A top-level boundary with "report / restart
   campaign" actions is a quick win.
5. **No campaign schema versioning / migration.** Add a `version` field on the
   campaign JSON now; otherwise the first schema change after alpha breaks
   everyone's saves.
6. **API key stored plaintext** in `state.json`. Use Electron's
   `safeStorage.encryptString` before writing — trivial to add and prevents
   casual leakage via logs or screenshots.

## Strongly recommended for alpha

7. **Crash-safe autosave.** Autosave runs every 5 s but only while `time > 0`;
   one crash mid-tick can corrupt the file. Write to `{id}.tmp` then rename,
   and keep one rotating `{id}.bak`.
8. **Mission-plan validator** between AI output and `generate-miz`. Currently
   nothing checks that aircraft exist in the chosen faction or that
   airdromes/objectives belong to the theatre — invalid plans error deep in
   the pipeline. A Zod `refine` pass that surfaces a friendly "AI suggested
   a unit not in this faction, retrying" would prevent the worst alpha-tester
   confusion.
9. **In-app "Known limitations" first-run notice** stating: Caucasus + Red
   Bullet only, USA-2004 vs Russia-1996, AI-only mission generation,
   weather/ATC not modeled. Sets expectations for alpha testers.
10. **Update channel hygiene.** Ship alpha as `0.5.0-alpha.1` (semver
    pre-release) so users on stable later don't get rolled back.
11. **One-page user docs**: how to install, where saves live, how to export
    to `.miz`, where to file bugs.

## Nice-to-have but defer

- Code signing / notarization. Alpha can ship unsigned with a SmartScreen
  warning if you communicate it up front.
- Telemetry / Sentry — useful, but adding it post-alpha is fine if you have a
  public bug tracker.
- Localization, weather simulation, ATC, loadout editor, more
  theatres/factions/scenarios — all roadmap, not blockers.
- Test coverage is thin (2 vitest files). Not a blocker for alpha, but add
  tests around campaign save/load round-trip and `.miz` ZIP structure before
  1.0.

## Current data scope

| Category   | Count | Notes |
|------------|-------|-------|
| Scenarios  | 1     | Red Bullet (Caucasus 2004) |
| Theatres   | 1     | Caucasus |
| Factions   | 2     | USA 2004, Russia 1996 |
| Aircraft   | ~85   | Modern + Cold-War mix |
| SAM types  | 6     | SA-2/3/5/6/10, Hawk |
| Ground units | 18  | Basic — should grow ≥ 50 long-term |
| Structures | 8     | HQ, depots, bunkers |
| Airdromes  | ~25   | Caucasus only |

This scope is fine for alpha **if the README states "Red Bullet scenario
only"**. Expanding to other theatres is significant data-entry work but
leverages existing structures.

## Mission generation gaps

Implemented today: structures, ground groups, flight groups, AWACS, transport
cargo triggers, MIST/State/CTLD Lua injection, ZIP assembly.

Missing for a richer experience (defer past alpha unless trivial):

- Dynamic weather (wind, rain, visibility variation)
- ATC ground units / radio chatter
- Trigger rules beyond cargo: capture, victory, time-based events,
  damage thresholds
- Kneeboard images and briefing text written into the mission file
- Friendly/enemy ROE & difficulty knobs
- Explicit parking-slot assignment (currently DCS auto-assigns)

## Suggested minimum path to alpha (~2–4 days)

1. Fix `appId`, set/remove publish URL, wire (or disable) auto-updater.
2. Gate simulation `console.log` behind a `DEBUG` env var.
3. Add a top-level React error boundary + safe-write for autosave.
4. Stamp `version` on campaign JSON; encrypt API key with `safeStorage`.
5. Add the AI mission-plan validator + first-run "alpha limitations" dialog.
6. Bump to `0.5.0-alpha.1`, build all three OSes, smoke-test the
   export-to-`.miz` golden path in DCS.

## Post-alpha roadmap

1. **Data expansion** — more scenarios, theatres, factions; richer ground-unit
   and structure libraries.
2. **Resilience** — crash reporting (Sentry or similar), user-facing error
   surfaces, log aggregation.
3. **Feature depth** — weather, ATC, briefing images, loadout editor,
   kneeboard generation.
4. **Distribution** — code signing, notarization, signed Linux releases,
   delta updates.
5. **Quality** — broader vitest coverage, CI pipeline, schema-migration tests.
