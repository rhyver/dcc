import { trackSourceClicked } from '../tracking'
import { CodebergIcon, DlIcon } from './icons'
import { ViggenStage } from './visuals'

export function CopySections({ onDownloadClick }: { onDownloadClick?: () => void }) {
  return (
    <section className="copy-wrap" aria-label="Digital Crew Chief details">
      <div className="copy-intro">
        <div className="copy-kicker">
          Built for DCS pilots who want the campaign, not the chores
        </div>
        <h2>Plan the war once. Fly the consequences for hours.</h2>
        <p>
          Digital Crew Chief turns a theatre setup into a living sequence of sorties. It tracks
          airbases, packages, ground pressure, losses, resupply, and mission timing so each exported
          mission feels connected to the one before it.
        </p>
      </div>

      <div className="copy-grid">
        <article className="copy-card">
          <div className="copy-number">01</div>
          <h3>Start from a scenario</h3>
          <p>
            Pick a theatre, factions, aircraft era, and objectives. DCC fills the map with targets,
            airbases, ground groups, and the campaign state needed to keep the front moving.
          </p>
        </article>
        <article className="copy-card">
          <div className="copy-number">02</div>
          <h3>Watch packages develop</h3>
          <p>
            CAP, strike, SEAD, transport, and intercept flights launch with live tasking. You can
            follow the picture, inspect active groups, and decide which sortie is worth flying next.
          </p>
        </article>
        <article className="copy-card">
          <div className="copy-number">03</div>
          <h3>Export and fly</h3>
          <p>
            Generate a DCS mission file with briefing context, weather, targets, routes, and support
            aircraft already wired in. No Lua editing or mission editor busywork required.
          </p>
        </article>
      </div>

      <div className="viggen-feature">
        <ViggenStage />
        <div className="viggen-copy">
          <span className="copy-kicker">Low-level pressure</span>
          <h2>Give helicopter sorties a theatre that fights back.</h2>
          <p>
            DCC is built around the kind of mission flow that makes classic modules shine: short
            turnarounds, exposed ingress routes, scarce support, and targets that matter after the
            debrief. Fly the strike, absorb the losses, then let the next package inherit the mess.
          </p>
        </div>
      </div>

      <div className="copy-band">
        <div>
          <span className="copy-kicker">Persistent pressure</span>
          <h2>Every mission feeds the next decision.</h2>
        </div>
        <p>
          Destroyed structures stay destroyed, captured airfields change the shape of the theatre,
          and depleted resources constrain what each coalition can send. The result is a campaign
          layer that gives solo flights and group nights a reason to exist beyond a single sortie.
        </p>
      </div>

      <div className="copy-cta">
        <div className="copy-cta-row">
          <p className="copy-cta-text">
            Download it here — no account, no config. Just install and spin up a theatre.
          </p>
          <button className="btn btn-primary btn-lg" type="button" onClick={onDownloadClick}>
            <DlIcon />
            <span>Download</span>
            <span className="meta">v0.5.0 Alpha · Win</span>
          </button>
        </div>
        <div className="copy-cta-row">
          <p className="copy-cta-text">
            Help us improve it — DCC is open source (MIT). Fork it, report bugs, or send a patch on
            Codeberg.
          </p>
          <a
            className="btn btn-outline btn-lg"
            href="https://codeberg.org/rhyver/dcc"
            target="_blank"
            rel="noreferrer"
            onClick={trackSourceClicked}
          >
            <CodebergIcon />
            View repository
          </a>
        </div>
      </div>
    </section>
  )
}
