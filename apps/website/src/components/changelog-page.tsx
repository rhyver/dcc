import { Footer, Nav } from './site-shell'

const changes = [
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
            Digital Crew Chief is still in alpha. This page tracks the current public release and
            the changes included in it.
          </p>

          <section className="release-block current">
            <div className="release-meta">
              <span>Current alpha</span>
              <span>14 June 2026</span>
            </div>
            <h2>v0.5.0-2026061401</h2>
            <p>
              Public Windows alpha release for building persistent DCS World campaigns and exporting
              playable `.miz` missions.
            </p>
            <div className="change-list">
              {changes.map((change) => (
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
            <p>
              First public 0.5 alpha release, introducing the rewritten application, updated user
              experience, and the new campaign map foundation.
            </p>
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
