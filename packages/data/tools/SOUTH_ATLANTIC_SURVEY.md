# South Atlantic deployment survey

1. Create a development mission on `SouthAtlantic` and add bounded trigger zones named
   `DCC_SURVEY_<objective-id>` around each objective. Multiple objectives can be surveyed in one run.
2. Run `south-atlantic-site-survey.lua` once at mission start. It evaluates terrain in small batches;
   wait for the `DCC South Atlantic site survey complete` message before leaving the mission.
3. Review `DCC_SITE_SURVEY` and `DCC_SITE_SLOT` records in `Saved Games/DCS/Logs/dcs.log` inside
   the Mission Editor. Rejected records include their terrain, slope, scenery, and road reasons.
4. Curate acceptable candidates into `src/theatres/south-atlantic/deployment-sites.ts`; only then
   change their `validationStatus` to `approved` and enter reviewed ingress/egress routes.
5. Run `bun run validate:deployment:release`. Do not enable `falklands-1982` until the release
   validator passes and the generated mission has been visually inspected in DCS.

## Airfields

Run `south-atlantic-airfield-survey.lua` once at mission start to extract the real DCS airbase IDs,
runway records, and parking stands for Stanley Airport, Rio Grande, Rio Gallegos, and San Julian.
Wait for the completion message, then import the `DCC_AIRBASE` records from `dcs.log` before enabling
the scenario.
