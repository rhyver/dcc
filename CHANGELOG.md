# Changelog

## Unreleased

Changes since `v0.5.0-2026061401` (released 2026-06-14).

### New

- Strategic Strike tasking for mission generation and ATO package planning.
- IADS campaign option with generated DCS mission support using Skynet IADS integration.
- ATO package planner with package spacing, coordinated strike planning, CAP package updates,
  and expanded tests.
- Campaign operation profiles and ground battle lock configuration during campaign creation.
- Campaign home logistics overview and ATO package board.
- Title bar toggles for showing or hiding the campaign ATO package board and logistics overview.
- Website documentation and changelog pages with improved navigation and download modal.
- Player navigation aids for F10 target vectors, generated target TACAN, and landing airport
  vectors with optional landing TACAN details.
- Mission start welcome message summarizing enabled F10 menu features.

### Improved

- Supply management now models airbase logistics, capture behavior, and supply state updates in
  more detail.
- Mission scripts now persist DCS state more reliably and report state handling errors more
  clearly.
- Strategic bombers and strike flights receive updated tasking, loadout, and availability data.
- Kneeboard output now includes strike, navigation, TACAN, and landing vector notes where
  relevant.
- Mission generation now includes TACAN and navigation script setup for eligible client flights.
- Navigation F10 menus now expose only the commands supported by the selected navigation aid,
  including landing airport vector requests.
- Airport metadata now includes TACAN details for supported Caucasus, Persian Gulf, and Syria
  airfields.
