# Community Germany fork port plan

Date: 2026-10-07  
Status: In progress; red-side campaigns, editable map waypoints, map-layer controls, enemy AI skill, and DCS assists ported.

## Objective

Port the gameplay additions from Samuelblew's Germany fork into DCC in three independently
reviewable stages: Germany/Fulda Gap, IADS/GCI/escalation, and career/planning features.
Preserve upstream fixes, DCC branding, and the existing release workflow. Evaluate the fork's
global ground-war and logistics rebalance separately before applying it to existing theatres.

## Comparison baseline

- Source: <https://github.com/Samuelblew/DCC-Project-Germany->
- Source snapshot: `4281245eb939b8703e6bee376fb3f9f7471bd81b` (2026-10-04).
- Substantive feature commit: `3e7a5f0`; the other unique commits are an initial placeholder and
  its merge into the fork.
- Upstream snapshot: `0dde59a0f17915f42935967af0ae6835afc1e416` (2026-10-03).
- Shared ancestor: `1fd50eb6da72856f25d9306ff12bd1a6984a234e` (2026-09-27).
- Fork delta: 238 files changed; 102 added, 135 modified, and one deleted. The 97,231 inserted
  lines include approximately 72,400 lines of generated Germany airfield data.
- There are 21 overlapping files with upstream changes. A merge dry run against the feature
  commit produced six conflicting files; it did not modify the working tree.

Refresh the comparison against the target branch before implementation. These counts describe
the snapshots above, not future revisions of either repository.

## Effort estimate

These estimates are cumulative engineering effort for one developer familiar with DCC, using AI
assistance. They include integration and validation, but depend on access to DCS and its Germany
terrain for live checks.

| Completed scope | Estimated effort |
| --- | --- |
| First buildable integration of the full feature commit | 0.5-1 working day |
| Stage 1: Germany theatre, Fulda Gap, factions, and maps | 1-2 working days |
| Stages 1-2: add Germany IADS, GCI, and escalation | 3-5 working days |
| Stages 1-3: all gameplay additions validated for release | 5-10 working days |

Confidence is moderate. The architecture and history remain close, but a combined build and
live DCS missions have not been tested. Reassess after compilation, automated checks, and the
first Germany mission round trip. A buildable integration alone is not a release milestone.

## Integration approach

- Extract coherent feature sets from the substantive commit and adapt shared files to the
  current upstream implementation. Keep each stage buildable and reviewable.
- Preserve upstream Ground Attack waypoint logic, target-flight planning, dependency updates,
  persistence fixes, and Windows/Linux packaging changes.
- Extend existing domain modules described in `CONTEXT.md`: Ground Deployment, Combat
  Viability, IADS Network, Replacement Pool, and mission generation. Avoid introducing parallel
  ownership of persistent units, placement, or recovery rules.
- Keep schemas backward compatible. Optional features must have defaults that allow existing
  campaigns and custom factions to load and continue.
- Separate theatre data, new gameplay, visual changes, and global balance changes so their
  effects can be evaluated independently.

### Known conflicts

| File | Required reconciliation |
| --- | --- |
| `README.md` | Document Germany and new features while retaining current upstream setup instructions. |
| `apps/frontend/src/logic/systems/spawn/manual-flight-group.test.ts` | Combine independently added tests for upstream and fork mission types. |
| `apps/frontend/src/logic/systems/spawn/manual-flight-group.ts` | Preserve Ground Attack behavior while adding career constraints, Fighter Sweep, and Training. |
| `apps/frontend/src/logic/systems/update-supply.test.ts` | Reconcile expected behavior after choosing the intended logistics policy. |
| `apps/frontend/src/stores/active.ts` | Preserve current campaign actions and client synchronization while adding career, escalation, and planning actions. |
| `packages/generate-miz/src/add-flight-groups.ts` | Combine upstream attack generation with aircraft profiles, radios, failures, GCI, and route culling. |

Review automatically merged files as well, particularly campaign ticks, supply updates, map
interaction, mission result import, flight waypoints, and kneeboards. A clean textual merge does
not establish compatible behavior.

## Stage 1: Germany theatre and Fulda Gap

### Work

- [ ] Import Germany theatre registration, airfields, parking data, objectives, targets, authored
  ground deployment sites, weather, and coordinate conversion.
- [ ] Add the Fulda Gap scenario with NATO's Leipzig objective and the Pact's Frankfurt
  objective, initial ownership, authored structures, and briefings.
- [x] Import East/West Germany 1985 and US/Soviet Germany 1955/1967 factions and templates.
  Available through the existing faction picker; German mission countries are registered.
  Keep aircraft rosters and ground templates from the source snapshot, omitting its unsupported
  Training task. Germany terrain and Fulda Gap remain separate work.
- [x] Add supported blue/red player selection and scenario mirroring, preserving scenarios that
  restrict player-side selection.
- [ ] Add Germany map caching, offline renderer support, and kneeboard map lookup. Keep the
  roughly 1 GB PMTiles download outside Git and define its packaging behavior.
- [ ] Integrate the minimal ground-deployment and capture behavior required by Fulda Gap.
  Keep broader global balance changes separate.
- [ ] Extend setup documentation using DCC's current prerequisites and build commands.

### Acceptance

- Germany campaigns can be created on either supported side and saved/reloaded.
- Ownership, briefing, and win/loss objectives match the selected side.
- Map positions and mission spawn positions agree at representative airfields and objectives;
  ground units use legal deployment slots.
- A generated Germany mission opens in DCS, spawns correctly, and imports results into DCC.
- Existing Caucasus, Persian Gulf, Syria, and South Atlantic campaigns still load and generate.
- The app handles absent Germany offline tiles predictably and packaged builds resolve tiles
  when present.

## Stage 2: IADS, GCI, and escalation

### Work

- [ ] Import the authored Germany SAM, EWR, headquarters, AAA, and support-site network.
- [ ] Integrate site ownership, targeting, threat analysis, mission generation, and Skynet
  command centers with existing IADS state.
- [ ] Persist exact Germany SAM losses and define EWR continuity through the IADS Network.
  Mission generation must not recreate destroyed radar sites unintentionally.
- [x] Add native MiG-29 KRU GCI networks, compatible radar linking, and fallback radar rules.
  Ported from `4281245` for supported theatres using owned airfields and separate coalition
  channels. Reserve radars use persistent EWR state and are saved before campaign export;
  destroyed radars remain absent. Native flights receive kneeboard WAVE guidance and skip
  scripted EWR picture calls. Live DCS validation remains pending.
- [ ] Integrate F10 GCI reporting for other aircraft, including unit selection, magnetic
  variation, picture limits, and suppression of repeated messages.
- [ ] Add optional Korea -> Vietnam -> Late Cold War -> Modern escalation, configurable era
  durations, roster/equipment changes, history, and clock progress display.
- [ ] Define how era upgrades interact with destroyed sites and territorial ownership.
  Replacing equipment must be deliberate; unchanged equipment must retain its losses.

### Acceptance

- Both sides receive the intended GCI network; the MiG-29 HUD link and other aircraft's F10
  reporting work in DCS without duplicate picture systems.
- Destroyed SAM units remain absent across generation, result import, and save/reload.
- EWR continuity follows the existing IADS domain rules.
- Era transitions select the correct air/ground/IADS equipment and respect player-side choice.
- Non-escalating campaigns retain their behavior. Era upgrades preserve territory and compatible
  persistent state; player-owned aircraft remain usable when Stage 3 is present.

## Stage 3: Career mode and planning controls

### Work

- [ ] Add classic/career campaign selection, career state, owned aircraft, hired wingmen, money,
  inventory, and transaction history.
- [ ] Import the 12 aircraft profiles and career entries, separating module capabilities from
  economy data; verify declared weapons, stations, radios, failures, and waypoint limits.
  The full-fidelity MiG-29A Fulcrum aircraft definition and eight task loadouts are ported from
  source snapshot `4281245`, registered independently of the Flaming Cliffs MiG-29A, and
  available in the Russia 1984 roster. Mission generation programs the R-862 presets and
  kneeboards use cockpit channel labels 0-3. Career profiles and route limits remain part of
  the pending profile integration.
- [ ] Add aircraft purchases/sales, used condition, hidden defects, repairs, overhauls, delivery
  delays, persistent basing, and Fidelity/Arcade acquisition rules.
- [ ] Add hangar, arsenal, operations, loadout-preset, radio-plan, and career-sidebar interfaces
  using the existing DCC appearance.
- [ ] Integrate sortie constraints and settlement: aircraft/pilot losses, damage, landing
  locations, returned stores, role/task rewards, and replacement-aircraft recovery.
- [ ] Add backward-compatible campaign/task schemas and migration of any imported legacy
  single-aircraft career saves.
- [ ] Implement Fighter Sweep and Training missions and reconcile directed map attacks with
  the existing target-flight workflow.
- [x] Add editable map waypoints: drag, insert, and remove navigation waypoints for player
  flights before takeoff. Ported 2026-10-07 without the Germany coordinate fit (Stage 1).
- [x] Add map-layer controls for airfields, towns/objectives, flights, ground/naval forces,
  structures, SAMs, radars, downed pilots, frontline, and SAM threat ranges. Preserve selected
  routes and briefing objectives, with a reset to current visibility defaults.
- [ ] Add mission footprints and separate ground, aircraft, and long-range SAM loading radii.
- [x] Add configurable enemy AI skill: Default, Average, Good, High, Excellent, and Random.
  Save the override with the campaign; apply it to opposing aircraft, AWACS, ground units,
  SAMs, EWRs, and ships while preserving friendly AI and client aircraft. Existing campaigns
  retain per-unit defaults. Live DCS difficulty checks remain outstanding.
- [x] Add optional DCS assists: unlimited fuel, unlimited ammunition, invulnerability, Mini HUD,
  and unit labels (Off/Dots/Abbreviated/Full). Mini HUD supplies flight cues for Flaming Cliffs
  aircraft. Save per campaign and write generated mission options;
  existing campaigns keep all assists off. Live DCS checks remain outstanding.
- [ ] Add configurable air activity and faster campaign time controls with explicit defaults.
- [ ] Integrate profile-aware radio programming, navigation aids, kneeboard units, mission
  failures, and remaining-ammunition reporting.

### Acceptance

- Purchases, deliveries, sales, repairs, inventory, and ledger balances survive save/reload.
- Career aircraft availability and basing constrain sorties; Arcade aircraft remain on the
  player's coalition without unintentionally expanding the AI faction roster.
- Mission settlement runs once, refunds only reported unused stores, distinguishes post-landing
  despawn from destruction, and records damage and relocation correctly.
- Profiles with different radio/navigation capabilities generate valid missions and kneeboards.
- Existing Ground Attack and target-flight workflows remain functional.
- Culling retains player flights, required targets, nearby relevant threats, and aircraft that
  can enter the mission area; omitted groups are not treated as losses on result import.
- Classic campaigns and older saves continue without career or escalation state.

## Separate balance and platform work

Evaluate the following fork changes before adopting their global defaults:

- Faster ground movement, slower attrition, field engagements, garrison retention, formation
  limits, rear-force consolidation, capture rules, and retreat fallback.
- Hourly supply production/transport, minute-based route repair, higher airfield replenishment,
  and the fork's minimum airfield supply floor.
- Culling changing to opt-in, increased simulation speed, and AI activity limits.

Compare long-running Germany and existing-theatre simulations. Pay particular attention to
Falklands naval operations, exact unit continuity, CASEVAC, troop extraction, local replacement
pools, carrier operations, and mission battle locks. Use scenario/theatre policy where justified
instead of applying Germany-specific tuning everywhere.

Retain DCC branding, textures, icons, and release/update feeds. Adapt useful Windows source
installation helpers to current packaging. The fork's removal of update feeds should apply only
to an explicit local-build path, if adopted. Preserve existing Linux build/release support.

## Validation and completion

- [ ] Run focused tests for each changed domain, including meaningful regression coverage for
  existing saves, Ground Attack, and South Atlantic behavior.
- [ ] Run repository type checks, lint, tests, and production builds using the current toolchain.
- [ ] Check the campaign creation, map, planning, career, and debrief interfaces at supported
  window sizes and in a packaged desktop build.
- [ ] Perform live DCS generation/play/import round trips for both Germany sides, representative
  full-fidelity and Flaming Cliffs profiles, persistent SAM damage, and an era transition.
- [ ] Smoke-test an existing theatre and Falklands with their established campaign behavior.
- [ ] Verify Windows packaging and the existing Linux build path; confirm official update-feed
  behavior and external map availability.
- [ ] Update user documentation, record upstream source attribution, and document intentional
  deviations from the fork.

Completion requires the staged acceptance criteria and validation above. Any live DCS checks
that cannot be performed must be recorded as outstanding, rather than reported as passed.
