import { Footer, Nav } from './site-shell'

const unreleasedChanges = [
  {
    title: 'Redesigned campaign setup',
    body: 'Campaign creation now guides players through scenario and era selection, player and opponent faction customization, and aircraft roster previews.'
  },
  {
    title: 'Additional classic factions',
    body: 'France 1982, Israel 1967, Sweden 1970, Russia 1984, US Navy 1964, and US Navy 1987 are now available, together with a France Modern ground template.'
  },
  {
    title: 'CSAR campaign operations',
    body: 'Downed pilots behind enemy lines can generate rescue packages, persist on the campaign map for one hour, and be recovered with kneeboard guidance and F10 status, smoke, and pickup commands.'
  },
  {
    title: 'Crash survivors',
    body: 'Aircraft lost in flown missions or simulated CAP, SEAD, and DEAD combat have a 25% pilot-survival chance when the crash is within CSAR range.'
  },
  {
    title: 'F-14BU support',
    body: 'The F-14B Upgrade is available for eligible US Navy 1987 missions, contributed by virhed.'
  },
  {
    title: 'Expanded FARP operations',
    body: 'Friendly FARPs can launch helicopter CAS and CSAR flights, use native helipad parking with safe overflow positions, remain available during mission culling, and emit the complete deployable template.'
  },
  {
    title: 'Reliable FARP helicopter spawns',
    body: 'Generated FARPs now register their helipads correctly with DCS, preventing client helicopters from returning to the spectator camera when spawning and routing returning AI helicopters through FARP landing control instead of occupied player positions.'
  },
  {
    title: 'More responsive mission-state saving',
    body: 'Losses, landings, ejections, cargo deliveries, and CSAR pickups now trigger batched state saves, with periodic autosaves retained as a fallback.'
  },
  {
    title: 'AV-8B N/A DEAD loadout',
    body: 'AV-8B N/A DEAD missions now use a dedicated Sidearm and Maverick weapon loadout.'
  },
  {
    title: 'Navigation and campaign-date corrections',
    body: 'DCS bearings now use the correct north/east axes, Late Cold War campaigns cover 1979–1991, and the Modern era begins in 1992.'
  }
]

const latestReleaseChanges = [
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
              <span>Next alpha</span>
              <span>In development</span>
            </div>
            <h2>Unreleased</h2>
            <div className="change-list">
              {unreleasedChanges.map((change) => (
                <div className="change-item" key={change.title}>
                  <h3>{change.title}</h3>
                  <p>{change.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="release-block">
            <div className="release-meta">
              <span>Current release</span>
              <span>24 June 2026</span>
            </div>
            <h2>v0.5.0-2026062401</h2>
            <div className="change-list">
              {latestReleaseChanges.map((change) => (
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
              <span>Codeberg</span>
            </div>
            <h2>Full release history</h2>
            <p>
              For installer assets, older builds, and exact tags, visit the project releases on{' '}
              <a href="https://codeberg.org/rhyver/dcc/releases" target="_blank" rel="noreferrer">
                Codeberg
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
