import { Footer, Nav } from './site-shell'

const workflowSteps = [
  'Create a campaign from a scenario, theatre, era, and faction pairing.',
  'Use the campaign map to inspect objectives, airbases, packages, and active flight groups.',
  'Generate a DCS mission, fly it, then submit the resulting campaign state back into Mission Control.',
  'Continue the theatre as a persistent campaign instead of rebuilding missions by hand.'
]

const developerSteps = [
  'Install Bun 1.3+ and Node.js 20+.',
  'Run `bun install` at the repository root.',
  'Run `bun run dev` for the Electron app and renderer dev servers.',
  'Run `bun run lint` and `bun run tsc` before shipping changes.'
]

export function DocsPage() {
  return (
    <div className="page hero-anim-fade">
      <div className="bg-grid" />
      <div className="bg-horizon" />
      <div className="bg-perspective" />

      <Nav />

      <main className="privacy-wrap docs-wrap">
        <article className="privacy-document editorial-document">
          <p className="copy-kicker">Field manual</p>
          <h1>Docs</h1>
          <p className="privacy-lede">
            Digital Crew Chief builds persistent DCS World campaigns, tracks the theatre state, and
            exports missions you can fly without hand-writing scripts.
          </p>

          <section className="docs-panel">
            <h2>Campaign workflow</h2>
            <ol className="docs-steps">
              {workflowSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="docs-grid">
            <div className="docs-panel">
              <h2>What it generates</h2>
              <p>
                The mission pipeline combines shared campaign contracts, DCS theatre data, aircraft
                definitions, ground groups, structures, warehouses, kneeboards, and Lua scripts into
                `.miz` output.
              </p>
            </div>
            <div className="docs-panel">
              <h2>Mission Control</h2>
              <p>
                After flying a mission, Mission Control can ingest `dcc_state.json` so the next
                sortie starts from the updated campaign state, including results produced on another
                machine or server.
              </p>
            </div>
          </section>

          <section className="docs-panel">
            <h2>Developer setup</h2>
            <ol className="docs-steps compact">
              {developerSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="docs-panel">
            <h2>Project links</h2>
            <p>
              Read the source, report issues, and inspect release assets on{' '}
              <a href="https://github.com/rhyver/dcc" target="_blank" rel="noreferrer">
                GitHub
              </a>
              . Join the pilot community on{' '}
              <a href="https://discord.gg/jZZ3pFpY3e" target="_blank" rel="noreferrer">
                Discord
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
