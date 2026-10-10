# Changelog

## v0.5.0-2026101001 - 2026-10-10

- Move downloads, source links, and new Windows automatic updates to GitHub.
- Update ZIP handling, image processing, and map rendering dependencies.
- Add supported red-side campaigns with matching factions, goals, briefings, and map colors.
- Edit navigation waypoints for player flights before takeoff.
- Toggle campaign map layers and SAM threat ranges.
- Configure enemy AI skill with visual steps and an independent Random switch.
- Save optional DCS assists per campaign: unlimited fuel/ammunition, invulnerability,
  Mini HUD for Flaming Cliffs aircraft, and stepped unit labels. Defaults remain off.
- Add East/West Germany 1985, USAFE 1955/1967, and GSFG 1955/1967 factions and templates.
  Germany terrain and Fulda Gap remain pending.

## v0.5.0-2026100601 - 2026-10-06

### New

- Linux x64 AppImage and Debian `.deb` packages are now included in the release workflow.
  Linux updates require manually downloading and installing a newer release.
- OH-58D Kiowa Warrior support for CSAR, CAS, and Ground Attack missions in the modern USA
  faction, with Hellfire loadouts for CAS and Ground Attack.
- Create attack flights directly from selected targets on the campaign map, or view flights
  already assigned to them.
- Aircraft selection now includes a "Show all compatible aircraft" option to choose aircraft
  outside the player faction's roster while retaining mission-role compatibility.
- Client flights can now expand beyond their planned size to accommodate up to four player slots;
  aircraft added for those slots are removed when the slots are cleared.

### Improved

- Ground Attack, Pinpoint Strike, and Strategic Strike routes now include an attack waypoint
  before the target, with attack tasks assigned at the appropriate point in generated missions.
- The AV-8B now has a dedicated CAP loadout.

### Fixed

- Generated mission waypoint ETAs and kneeboard timings now account for the ten-minute startup
  allowance, including flights whose scheduled start time has already passed.
- The San Carlos FARP now becomes available during the Falklands landing phase and is restored
  at a validated recovery site when loading affected saves.
- Corrected a ground-unit deployment position at Murrell Farm on the South Atlantic map.

## v0.5.0-2026081602 - 2026-08-16

### Improved

- Improved the campaign welcome dialog layout on smaller screens.

### Fixed

- Corrected the initial waypoint timing lock for naval patrol routes in generated missions.

## v0.5.0-2026081601 - 2026-08-16

### New

- Operation Corporate — Falklands 1982 on the South Atlantic map, with dedicated British and
  Argentine factions, persistent naval task groups, anti-ship missions, and a campaign that
  progresses from sea control through the San Carlos landing to the advance on Stanley.
- CASEVAC and troop-extraction helicopter missions for wounded personnel and withdrawing infantry,
  including persistent pickup requests, recovery destinations, and local replacement pools.
- A campaign operations overview showing phase objectives, naval-group capability, and formations
  that are withdrawing, awaiting extraction, trapped, or waiting for a valid deployment site.
- Persistent early-warning radar networks that appear on the campaign map, retain their status
  between missions, and can be suppressed by SEAD or permanently destroyed by DEAD flights.
- Campaign setup tools for creating and editing factions, plus a GPS availability indicator and an
  option to use a GPS-enabled mission date for historically earlier campaigns.

### Improved

- Ground formations now keep stable individual units and curated deployment slots, withdraw toward
  reachable recovery nodes when depleted, and preserve losses and recoveries between missions.
- Carrier groups now spawn facing into the surface wind, and generated missions include persistent
  carrier, escort, transport, patrol, warehouse, AWACS, and recovery-window support where eligible.
- Scenario-specific faction defaults, required structures, defensive garrisons, and deferred
  objectives are now applied consistently during campaign creation.
- Flight planning now handles nearest and furthest base/target preferences more reliably, and SEAD
  and DEAD planning considers both SAM and EWR emitters.
- Anti-ship tasking and mission loadouts are now available for eligible AJS 37, AV-8B, F-4E, F-5E,
  F/A-18C, JF-17, and Su-22M4 aircraft.
- The F-5E now has dedicated CAS and pinpoint-strike loadouts and is available for those roles in
  eligible Argentine and US factions.
- The AV-8B now has a dedicated pinpoint-strike loadout using GBU-54 laser JDAMs.

### Fixed

- CSAR missions now place a visible standing pilot at the reported location and remove the pilot
  object after a successful pickup.
- Campaign maps and mission debriefs now skip positions outside a theatre's supported coordinate
  grid instead of crashing with an out-of-bounds conversion error, including affected Syria
  campaigns.
- User-created factions and custom client aircraft now receive valid DCS country assignments
  without treating unrelated AI aircraft as custom selections.
- Existing Falklands saves migrate to the current naval starts, San Carlos landing layout, ground
  formation model, and persistent EWR network.

## v0.5.0-2026080201 - 2026-08-02

### New

- A redesigned campaign setup flow for scenario and era selection, player and opponent faction
  customization, and aircraft roster previews before campaign creation.
- Additional preset factions and campaign options from the classic DCC set.
- F-14B(U) aircraft support for eligible US Navy 1987 missions, contributed by virhed.
- CSAR campaign missions for eligible pilots down behind enemy lines, including automatic rescue
  packages, map markers, one-hour pilot persistence, FARP support, kneeboard guidance, and F10
  pilot status, smoke, and pickup commands.

### Improved

- Friendly FARPs can launch helicopter CAS and CSAR missions.
- Mission-state persistence now batches event-driven saves for losses, landings, ejections, cargo
  deliveries, and CSAR pickups while retaining periodic autosaves as a fallback.

### Fixed

- Corrected DCS north/east bearing calculations in kneeboards and F10 navigation vectors.
- Corrected campaign date generation so Late Cold War covers 1979–1991 and Modern begins in 1992.

## v0.5.0-2026062401 - 2026-06-24

### New

- IADS campaign options, including generated DCS mission support with Skynet
  IADS integration.
- Air Tasking Order (ATO) and logistics planning, coordinating flight packages with package spacing
  and airbase supply status.
- Player navigation aids for F10 target vectors, generated target TACAN, and landing airport
  vectors.
- Mission start welcome message summarizing enabled F10 menu features.

### Improved

- Supply management now models airbase logistics, capture behavior, and supply state updates in
  more detail.
- Mission scripts now persist DCS state more reliably and report state handling errors more
  clearly.
- Kneeboards and generated missions now include relevant strike, navigation, TACAN, and landing
  vector details for eligible client flights.
