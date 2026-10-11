import { Footer, Nav } from './site-shell'

const october11ReleaseChanges = [
  {
    title: 'GitHub downloads and updates',
    body: 'Downloads and new Windows automatic updates move to GitHub. Existing installations can migrate by installing this release.'
  },
  {
    title: 'Red-side campaigns',
    body: 'Choose either supported coalition, with matching map colors, factions, briefings, and campaign goals.'
  },
  {
    title: 'Editable flight routes',
    body: 'Move, insert, and remove navigation waypoints for player flights before takeoff.'
  },
  {
    title: 'Map visibility controls',
    body: 'Toggle campaign map layers and SAM threat ranges, or reset their visibility.'
  },
  {
    title: 'Mission difficulty and assists',
    body: 'Choose enemy AI skill, randomize it per unit, or enable optional fuel, ammunition, invulnerability, Mini HUD, and unit-label assists.'
  },
  {
    title: 'Cold War factions',
    body: 'Add East/West Germany 1985, USAFE 1955/1967, and GSFG 1955/1967. Germany terrain and Fulda Gap are not included.'
  },
  {
    title: 'Campaign map fixes',
    body: 'Selecting a package no longer crashes the campaign map, and zooming behaves normally again.'
  },
  {
    title: 'Correct EWR bearings',
    body: "EWR bearing calls use each theatre's magnetic variation instead of a fixed 7 degrees."
  }
]

const october6ReleaseChanges = [
  {
    title: 'Linux packages',
    body: 'The release workflow now includes Linux x64 AppImage and Debian .deb packages. Linux updates require manually downloading and installing a newer release.'
  },
  {
    title: 'OH-58D Kiowa Warrior support',
    body: 'The Kiowa is available for CSAR, CAS, and Ground Attack missions in the modern USA faction, with Hellfire loadouts for CAS and Ground Attack.'
  },
  {
    title: 'Plan flights from map targets',
    body: 'Create attack flights directly from selected targets on the campaign map, or view flights already assigned to them.'
  },
  {
    title: 'Aircraft roster override',
    body: 'Aircraft selection includes a "Show all compatible aircraft" option to choose aircraft outside the player faction roster while retaining mission-role compatibility.'
  },
  {
    title: 'More client slots',
    body: 'Client flights can expand beyond their planned size to accommodate up to four player slots. Aircraft added for those slots are removed when the slots are cleared.'
  },
  {
    title: 'Improved attack routes',
    body: 'Ground Attack, Pinpoint Strike, and Strategic Strike routes include an attack waypoint before the target, with attack tasks assigned at the appropriate point in generated missions.'
  },
  {
    title: 'AV-8B CAP loadout',
    body: 'The AV-8B now has a dedicated CAP loadout.'
  },
  {
    title: 'Corrected mission and kneeboard timing',
    body: 'Generated waypoint ETAs and kneeboard timings account for the ten-minute startup allowance, including flights whose scheduled start time has already passed.'
  },
  {
    title: 'San Carlos FARP recovery',
    body: 'The San Carlos FARP becomes available during the Falklands landing phase and is restored at a validated recovery site when loading affected saves.'
  },
  {
    title: 'Murrell Farm deployment correction',
    body: 'Corrected a ground-unit deployment position at Murrell Farm on the South Atlantic map.'
  }
]

const august16PatchReleaseChanges = [
  {
    title: 'Campaign welcome layout',
    body: 'Improved the campaign welcome dialog layout on smaller screens.'
  },
  {
    title: 'Naval patrol timing correction',
    body: 'Corrected the initial waypoint timing lock for naval patrol routes in generated missions.'
  }
]

const august16ReleaseChanges = [
  {
    title: 'Operation Corporate — Falklands 1982',
    body: 'A new South Atlantic campaign follows the British task force from sea control through the San Carlos landing and the advance on Stanley, with dedicated British and Argentine factions, persistent naval groups, and anti-ship missions.'
  },
  {
    title: 'CASEVAC and troop extraction',
    body: 'Helicopter missions can recover wounded personnel and extract withdrawing infantry, with persistent pickup requests, recovery destinations, and local replacement pools.'
  },
  {
    title: 'Campaign operations overview',
    body: 'The campaign screen now tracks phase objectives, naval capability, and formations that are withdrawing, awaiting extraction, trapped, or waiting for a valid deployment site.'
  },
  {
    title: 'Persistent EWR networks',
    body: 'Early-warning radar sites now persist between missions, appear on the campaign map, and can be suppressed by SEAD or permanently destroyed by DEAD flights.'
  },
  {
    title: 'Visible CSAR pilots',
    body: 'CSAR missions now place a standing pilot at the reported location and remove the pilot object after a successful pickup.'
  },
  {
    title: 'Out-of-bounds map protection',
    body: "Campaign maps and mission debriefs now skip positions outside a theatre's supported coordinate grid instead of crashing, including affected Syria campaigns."
  },
  {
    title: 'Custom factions and GPS controls',
    body: 'Campaign setup can create or edit factions, shows whether GPS is available on the selected date, and can move historically earlier campaigns to a GPS-enabled date.'
  },
  {
    title: 'Deeper ground and naval persistence',
    body: 'Ground formations retain individual units and curated deployment slots, while carrier, escort, transport, patrol, warehouse, AWACS, and recovery-window state is represented in generated missions.'
  },
  {
    title: 'Improved mission planning',
    body: 'Flight planning handles base and target preferences more reliably, while SEAD and DEAD consider both SAM and EWR emitters.'
  },
  {
    title: 'Expanded anti-ship aircraft support',
    body: 'Anti-ship tasking and mission loadouts are now available for eligible AJS 37, AV-8B, F-4E, F-5E, F/A-18C, JF-17, and Su-22M4 aircraft.'
  },
  {
    title: 'F-5E mission loadouts',
    body: 'The F-5E now has dedicated CAS and pinpoint-strike loadouts and is available for those roles in eligible Argentine and US factions.'
  },
  {
    title: 'AV-8B pinpoint-strike loadout',
    body: 'The AV-8B now has a dedicated pinpoint-strike loadout using GBU-54 laser JDAMs.'
  }
]

const august2ReleaseChanges = [
  {
    title: 'Redesigned campaign setup',
    body: 'Campaign creation now guides players through scenario and era selection, player and opponent faction customization, and aircraft roster previews.'
  },
  {
    title: 'Additional classic factions',
    body: 'Additional preset factions and campaign options from the classic DCC set are now available.'
  },
  {
    title: 'CSAR campaign operations',
    body: 'Downed pilots behind enemy lines can generate rescue packages, persist on the campaign map for one hour, and be recovered with kneeboard guidance and F10 status, smoke, and pickup commands.'
  },
  {
    title: 'F-14BU support',
    body: 'The F-14B Upgrade is available for eligible US Navy 1987 missions, contributed by virhed.'
  },
  {
    title: 'Expanded FARP operations',
    body: 'Friendly FARPs can launch helicopter CAS and CSAR flights.'
  },
  {
    title: 'More responsive mission-state saving',
    body: 'Losses, landings, ejections, cargo deliveries, and CSAR pickups now trigger batched state saves, with periodic autosaves retained as a fallback.'
  },
  {
    title: 'Navigation and campaign-date corrections',
    body: 'DCS bearings now use the correct north/east axes, Late Cold War campaigns cover 1979–1991, and the Modern era begins in 1992.'
  }
]

const june24ReleaseChanges = [
  {
    title: 'IADS campaign options',
    body: 'Campaigns can now include integrated air defense systems, with generated DCS mission support through Skynet IADS integration.'
  },
  {
    title: 'Air Tasking Order and logistics planning',
    body: 'ATO planning coordinates flight packages with package spacing and airbase supply status.'
  },
  {
    title: 'Player navigation aids',
    body: 'F10 menus can now provide target vectors, generated target TACAN, and landing airport vectors.'
  },
  {
    title: 'Mission start welcome message',
    body: 'New missions now summarize the enabled F10 menu features when the mission begins.'
  },
  {
    title: 'More detailed supply simulation',
    body: 'Supply management now models airbase logistics, capture behavior, and supply state updates in more detail.'
  },
  {
    title: 'More reliable mission state',
    body: 'Mission scripts now persist DCS state more reliably and report state handling errors more clearly.'
  },
  {
    title: 'Richer kneeboard and mission output',
    body: 'Kneeboards and generated missions now include relevant strike, navigation, TACAN, and landing vector details for eligible client flights.'
  }
]

const currentReleaseChanges = [
  {
    title: 'New campaign setup flow',
    body: 'Scenario and era selection now guide campaign creation.'
  },
  {
    title: 'New playable scenarios',
    body: 'Operation Northern Shield on Syria and Eagle Down on Persian Gulf.'
  },
  {
    title: 'New era options',
    body: 'Korea, Vietnam, and Late Cold War are now available as era options.'
  },
  {
    title: 'New aircraft support',
    body: 'F-100D aircraft support has been added.'
  },
  {
    title: 'Separate radio frequencies',
    body: 'Flight groups now receive separate radio frequencies.'
  },
  {
    title: 'Cleaner kneeboard waypoints',
    body: 'Kneeboard waypoint numbering now skips takeoff points.'
  }
]

const previousReleaseNew = [
  {
    title: 'Complete application rewrite',
    body: 'The 0.5 line rebuilt the application foundation instead of extending the older 0.4 codebase.'
  },
  {
    title: 'Brand-new interface and design',
    body: 'A redesigned user interface introduced the new visual language and workflow structure.'
  },
  {
    title: 'New website',
    body: 'The project shipped with a dedicated website alongside the rewritten application.'
  },
  {
    title: 'Flight group selection system',
    body: 'Flight groups can now be selected through a new purpose-built selection flow.'
  },
  {
    title: 'Aircraft changes before takeoff',
    body: 'Aircraft type can now be changed before takeoff during mission preparation.'
  },
  {
    title: 'EWR script added',
    body: 'An EWR script was added to extend mission behavior and battlefield awareness.'
  },
  {
    title: 'Campaign map with English labels',
    body: 'The new campaign map launched with English labels for clearer map reading.'
  },
  {
    title: 'Offline map support',
    body: 'Map data can now be used offline instead of depending on a live connection.'
  },
  {
    title: 'Map ruler tool',
    body: 'A ruler tool was added to make map distance checks easier during planning.'
  },
  {
    title: 'Automatic updates',
    body: 'The application gained an automatic update system for future releases.'
  }
]

const previousReleaseImproved = [
  {
    title: 'Reworked kneeboard',
    body: 'The kneeboard experience was reworked as part of the first alpha release.'
  },
  {
    title: 'Reworked waypoint logic',
    body: 'Waypoint behavior and route handling were updated in the new mission flow.'
  },
  {
    title: 'Reworked spawn logic',
    body: 'Spawn logic was reworked to support the rewritten application structure.'
  }
]

export function ChangelogPage() {
  return (
    <div className="page hero-anim-fade">
      <div className="bg-grid" />
      <div className="bg-horizon" />
      <div className="bg-perspective" />

      <Nav />

      <main className="privacy-wrap">
        <article className="privacy-document editorial-document">
          <p className="copy-kicker">Release notes</p>
          <h1>Changelog</h1>
          <p className="privacy-lede">
            Digital Crew Chief is still in alpha. This page tracks current releases and the older
            alpha history.
          </p>

          <section className="release-block current">
            <div className="release-meta">
              <span>Current release</span>
              <span>11 October 2026</span>
            </div>
            <h2>v0.5.0-2026101101</h2>
            <p>
              The new campaign features are ported from{' '}
              <a href="https://github.com/Samuelblew/DCC-Project-Germany-">DCC-Project-Germany</a>{' '}
              by Samuel_Bléw. Thank you!
            </p>
            <div className="change-list">
              {october11ReleaseChanges.map((change) => (
                <div className="change-item" key={change.title}>
                  <h3>{change.title}</h3>
                  <p>{change.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="release-block">
            <div className="release-meta">
              <span />
              <span>6 October 2026</span>
            </div>
            <h2>v0.5.0-2026100601</h2>
            <div className="change-list">
              {october6ReleaseChanges.map((change) => (
                <div className="change-item" key={change.title}>
                  <h3>{change.title}</h3>
                  <p>{change.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="release-block">
            <div className="release-meta">
              <span />
              <span>16 August 2026</span>
            </div>
            <h2>v0.5.0-2026081602</h2>
            <div className="change-list">
              {august16PatchReleaseChanges.map((change) => (
                <div className="change-item" key={change.title}>
                  <h3>{change.title}</h3>
                  <p>{change.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="release-block">
            <div className="release-meta">
              <span />
              <span>16 August 2026</span>
            </div>
            <h2>v0.5.0-2026081601</h2>
            <div className="change-list">
              {august16ReleaseChanges.map((change) => (
                <div className="change-item" key={change.title}>
                  <h3>{change.title}</h3>
                  <p>{change.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="release-block">
            <div className="release-meta">
              <span />
              <span>2 August 2026</span>
            </div>
            <h2>v0.5.0-2026080201</h2>
            <div className="change-list">
              {august2ReleaseChanges.map((change) => (
                <div className="change-item" key={change.title}>
                  <h3>{change.title}</h3>
                  <p>{change.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="release-block">
            <div className="release-meta">
              <span />
              <span>24 June 2026</span>
            </div>
            <h2>v0.5.0-2026062401</h2>
            <div className="change-list">
              {june24ReleaseChanges.map((change) => (
                <div className="change-item" key={change.title}>
                  <h3>{change.title}</h3>
                  <p>{change.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="release-block">
            <div className="release-meta">
              <span />
              <span>14 June 2026</span>
            </div>
            <h2>v0.5.0-2026061401</h2>
            <div className="change-list">
              {currentReleaseChanges.map((change) => (
                <div className="change-item" key={change.title}>
                  <h3>{change.title}</h3>
                  <p>{change.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="release-block">
            <div className="release-meta">
              <span>First alpha</span>
              <span>11 June 2026</span>
            </div>
            <h2>v0.5.0-2026060901</h2>
            <div className="release-group">
              <div className="change-list">
                {previousReleaseNew.map((change) => (
                  <div className="change-item" key={change.title}>
                    <h3>{change.title}</h3>
                    <p>{change.body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="release-group">
              <div className="change-list">
                {previousReleaseImproved.map((change) => (
                  <div className="change-item" key={change.title}>
                    <h3>{change.title}</h3>
                    <p>{change.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="release-block">
            <div className="release-meta">
              <span>Source of truth</span>
              <span>GitHub</span>
            </div>
            <h2>Full release history</h2>
            <p>
              For installer assets, older builds, and exact tags, visit the project releases on{' '}
              <a href="https://github.com/rhyver/dcc/releases" target="_blank" rel="noreferrer">
                GitHub
              </a>
              .
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  )
}
