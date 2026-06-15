import { Footer, Nav } from './site-shell'

export function PrivacyPage() {
  return (
    <div className="page hero-anim-fade">
      <div className="bg-grid" />
      <div className="bg-horizon" />
      <div className="bg-perspective" />

      <Nav />

      <main className="privacy-wrap">
        <article className="privacy-document">
          <p className="copy-kicker">Last updated: 15 June 2026</p>
          <h1>Privacy Policy</h1>
          <p className="privacy-lede">
            This website is an open-source project page operated by digitalcrewchief.at for Digital
            Crew Chief. Privacy-related questions can be raised through the public project
            repository at{' '}
            <a href="https://codeberg.org/rhyver/dcc" target="_blank" rel="noreferrer">
              codeberg.org/rhyver/dcc
            </a>
            .
          </p>

          <section>
            <h2>Who Runs This Site</h2>
            <p>
              The site is maintained for the Digital Crew Chief open-source project. The project
              source code, issue tracker, and release history are available on Codeberg.
            </p>
          </section>

          <section>
            <h2>What Data Is Processed</h2>
            <p>
              When you visit this website, basic technical data may be processed to deliver the site
              securely and reliably. This can include information such as your IP address, browser
              type, device information, requested URL, referrer, and timestamps.
            </p>
          </section>

          <section>
            <h2>Hosting</h2>
            <p>
              This site is hosted on Vercel. Vercel may process technical request data and server
              logs to provide hosting, security, performance, and reliability for this website.
              Provider-side retention is governed by Vercel's own service terms and privacy
              documentation.
            </p>
          </section>

          <section>
            <h2>Analytics</h2>
            <p>
              This site uses Vercel Web Analytics to understand basic usage of the project page.
              Vercel Web Analytics does not use cookies and provides aggregated, anonymized
              statistics. We use simple pageview analytics and anonymous interaction events for
              actions such as opening the download notice, starting a download, visiting the source
              repository, or opening the community link. We do not use this analytics data to
              identify individual visitors.
            </p>
          </section>

          <section>
            <h2>Cookies</h2>
            <p>
              This website does not set tracking cookies for analytics. If this changes, this policy
              will be updated.
            </p>
          </section>

          <section>
            <h2>Open-Source Repository And External Links</h2>
            <p>
              This website links to external services such as Codeberg, Discord, and documentation
              pages. When you follow external links, the privacy policies of those services apply.
            </p>
          </section>

          <section>
            <h2>Your Rights</h2>
            <p>
              Depending on your location, you may have rights to request access, correction,
              deletion, restriction, or objection regarding personal data processed about you.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              For privacy-related questions, use the public project repository at{' '}
              <a href="https://codeberg.org/rhyver/dcc" target="_blank" rel="noreferrer">
                codeberg.org/rhyver/dcc
              </a>
              .
            </p>
          </section>

          <section>
            <h2>Changes To This Policy</h2>
            <p>
              This privacy policy may be updated when the website or its data processing changes.
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  )
}
