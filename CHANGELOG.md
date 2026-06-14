# Changelog

## Unreleased

Changes since `v0.5.0-2026060901` (released 2026-06-09).

### New

- New campaign setup flow with scenario and era selection.
- New playable scenarios:
  - `Operation Northern Shield` on Syria.
  - `Eagle Down` on Persian Gulf.
- New Syria and Persian Gulf theatres.
- New Vietnam era option.
- New Korea, Vietnam, and Late Cold War faction presets.
- New F-100D aircraft support.
- Mission Control can optionally submit a manually selected `dcc_state.json` file, useful when
  missions are flown on another machine or server.

### Improved

- Generated missions now use the selected theatre instead of always using Caucasus.
- Larger missions should run better by including only relevant nearby ground units and
  structures.
- Flight groups now receive separate radio frequencies.
- Kneeboard waypoint numbering now skips takeoff points.
- Updated aircraft availability and loadouts across several eras.
