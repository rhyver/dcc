# DCC Alpha Readiness Review

_Date: 2026-05-03 - Project version: 0.5.0-2026050302_

This document reviews the DCC (DCS Campaign Creator) project for a first
alpha/testing release and lists missing features grouped by priority.

## Strengths - already ready

- **Core loop works end-to-end**: new campaign -> simulate -> autosave -> export `.miz`.
  Flight/ground/SAM systems tick, packages/spawning logic, airport capture, and
  transport/CTLD are all wired.
- **AI Mission Generator** with provider switching (OpenAI / Anthropic / OpenRouter),
  mission-plan fallback/coercion, and a saved-briefings library.
- **Settings** with DCS install auto-detect and `MissionScripting.lua` patching
  (with backup/restore on exit).
- **Persistence** to `userData` with multi-campaign support, schema versioning,
  and crash-safe atomic writes with rotating `.bak` files.
- **Build pipeline** (electron-builder for win/mac/linux) is configured and
  produces installers.
- **Auto-updater wiring** exists for production Windows builds, with a configured
  release endpoint and an in-app disable setting.
- **Builder app id** is aligned across the root and core electron-builder
  configs.
- **Global route error boundary** catches unexpected route/render/load failures
  and offers recovery actions.

## Blockers - must fix before tagging alpha

1. **API key stored plaintext** in `state.json`. Use Electron's
   `safeStorage.encryptString` before writing. This prevents casual leakage via
   logs, screenshots, or debug bundles.

## Strongly recommended for alpha

1. **Mission-plan validator user feedback.** Mission-plan shape validation and
   fallback/coercion exist, but invalid data can still be silently substituted.
   Add an explicit validation/reporting pass so alpha testers see friendly
   feedback when AI output names an unavailable aircraft, faction, airdrome, or
   objective.
2. **In-app "Known limitations" first-run notice** stating: Caucasus + Red
   Bullet only, USA-2004 vs Russia-1996, AI-only mission generation,
   weather/ATC not modeled. Sets expectations for alpha testers.
3. **Update channel hygiene.** Ship alpha as `0.5.0-alpha.1` (semver
   pre-release) so users on stable later don't get rolled back.
4. **One-page user docs**: how to install, where saves live, how to export
   to `.miz`, where to file bugs.

## Nice-to-have but defer

- Code signing / notarization. Alpha can ship unsigned with a SmartScreen
  warning if you communicate it up front.
- Telemetry / Sentry - useful, but adding it post-alpha is fine if you have a
  public bug tracker.
- Localization, weather simulation, ATC, loadout editor, more
  theatres/factions/scenarios - all roadmap, not blockers.
- Test coverage is still thin for persistence and export smoke paths. Not a
  blocker for alpha, but add tests around campaign save/load round-trip and
  `.miz` ZIP structure before 1.0.

## Current data scope

| Category     | Count | Notes |
|--------------|-------|-------|
| Scenarios    | 1     | Red Bullet (Caucasus 2004) |
| Theatres     | 1     | Caucasus |
| Factions     | 2     | USA 2004, Russia 1996 |
| Aircraft     | ~85   | Modern + Cold-War mix |
| SAM types    | 6     | SA-2/3/5/6/10, Hawk |
| Ground units | 18    | Basic - should grow to 50+ long-term |
| Structures   | 8     | HQ, depots, bunkers |
| Airdromes    | ~25   | Caucasus only |

This scope is fine for alpha **if the README states "Red Bullet scenario
only"**. Expanding to other theatres is significant data-entry work but
leverages existing structures.

## Mission generation gaps

Implemented today: structures, ground groups, flight groups, AWACS, transport
cargo triggers, MIST/State/CTLD Lua injection, ZIP assembly, and explicit
parking-slot assignment.

Missing for a richer experience (defer past alpha unless trivial):

- Dynamic weather (wind, rain, visibility variation)
- ATC ground units / radio chatter
- Trigger rules beyond cargo: capture, victory, time-based events,
  damage thresholds
- Kneeboard images and briefing text written into the mission file
- Friendly/enemy ROE & difficulty knobs

## Suggested minimum path to alpha (~2-4 days)

1. Encrypt API key storage with Electron `safeStorage`.
2. Add explicit AI mission-plan validation feedback + first-run "alpha
   limitations" dialog.
3. Write the one-page alpha user docs.
4. Bump to `0.5.0-alpha.1`, build all three OSes, smoke-test the
   export-to-`.miz` golden path in DCS.

## Post-alpha roadmap

1. **Data expansion** - more scenarios, theatres, factions; richer ground-unit
   and structure libraries.
2. **Resilience** - crash reporting (Sentry or similar), user-facing error
   surfaces, log aggregation.
3. **Feature depth** - weather, ATC, briefing images, loadout editor,
   kneeboard generation.
4. **Distribution** - code signing, notarization, signed Linux releases,
   delta updates.
5. **Quality** - broader vitest coverage, CI pipeline, schema-migration tests.
