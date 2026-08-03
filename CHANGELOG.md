# Changelog

## v0.5.0-2026080201 - 2026-08-02

Changes since `v0.5.0-2026062401` (released 2026-06-24).

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
