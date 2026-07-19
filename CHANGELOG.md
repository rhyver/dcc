# Changelog

## Unreleased

### New

- Campaign creation can customize player and opponent factions after era selection.
- Additional preset factions from the classic DCC set: France 1982, Israel 1967, Sweden 1970,
  Russia 1984, US Navy 1964, and US Navy 1987, plus a France Modern ground template.
- CSAR campaign missions for eligible pilots down behind enemy lines, including automatic rescue
  packages, map markers, one-hour pilot persistence, FARP support, kneeboard guidance, and F10
  pilot status, smoke, and pickup commands.

### Improved

- Friendly FARPs can launch automatic and manual helicopter CAS missions. Mission-start aircraft
  changes move CAS flights to the nearest reachable compatible FARP or airbase; fixed-wing CAS
  remains restricted to airbases.

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
