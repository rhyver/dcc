# Changelog

## Unreleased

Changes since `v0.5.0-2026062401` (released 2026-06-24).

### New

- A redesigned campaign setup flow for scenario and era selection, player and opponent faction
  customization, and aircraft roster previews before campaign creation.
- Additional preset factions from the classic DCC set: France 1982, Israel 1967, Sweden 1970,
  Russia 1984, US Navy 1964, and US Navy 1987, plus a France Modern ground template.
- F-14B(U) aircraft support for eligible US Navy 1987 missions, contributed by virhed.
- CSAR campaign missions for eligible pilots down behind enemy lines, including automatic rescue
  packages, map markers, one-hour pilot persistence, FARP support, kneeboard guidance, and F10
  pilot status, smoke, and pickup commands. Aircraft lost in flown missions or simulated CAP,
  SEAD, and DEAD combat now have a 25% pilot-survival chance when within CSAR range.

### Improved

- Friendly FARPs can launch automatic and manual helicopter CAS missions. Mission-start aircraft
  changes move CAS flights to the nearest reachable compatible FARP or airbase; fixed-wing CAS
  remains restricted to airbases.
- Generated FARPs now use native helipad parking for up to four helicopters, place overflow
  aircraft safely around the pad, retain active FARP home bases during mission culling, and emit
  the complete deployable FARP template.
- Mission-state persistence now batches event-driven saves for losses, landings, ejections, cargo
  deliveries, and CSAR pickups while retaining periodic autosaves as a fallback.
- AV-8B N/A aircraft now have a dedicated DEAD loadout with Sidearm and Maverick weapons.

### Fixed

- Fixed client helicopters returning to the spectator camera when spawning on generated FARP
  helipads, including the required CH-47F multicrew defaults, and linked returning AI helicopters
  to FARP landing control so they no longer land directly on occupied player positions.
- Corrected DCS north/east bearing calculations in kneeboards and F10 navigation vectors.
- Corrected campaign date generation so Late Cold War covers 1979–1991 and Modern begins in 1992.

## v0.5.0-2026062401 - 2026-06-24

Changes since `v0.5.0-2026061401` (released 2026-06-14).

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
