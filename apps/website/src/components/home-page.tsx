import { useState } from 'react'
import { trackDownloadModalOpened, trackSourceClicked } from '../tracking'
import { CopySections } from './copy-sections'
import { GitHubIcon, DlIcon } from './icons'
import { DownloadModal, Footer, Nav } from './site-shell'
import { AppScreenshotPreview, F14Hero } from './visuals'

export function HomePage() {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)
  const openDownloadModal = () => {
    trackDownloadModalOpened()
    setIsDownloadModalOpen(true)
  }

  return (
    <div className="page hero-anim-fade">
      <div className="bg-grid" />
      <div className="bg-horizon" />
      <div className="bg-perspective" />

      <Nav onDownloadClick={openDownloadModal} />

      <section className="hero">
        <F14Hero />
        <div className="bg-sun" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="dot" />
            v0.5.0 Alpha · Public release
          </div>
          <h1 className="wordmark">
            <span className="line1">DIGITAL</span>
            <span className="line2">
              CREW CHIEF
              <span className="glow" aria-hidden="true">
                CREW CHIEF
              </span>
            </span>
          </h1>
          <div className="hero-tagline">
            100% Flying, 0% Configuration
            <span className="caret" />
          </div>
          <p className="hero-pitch">
            A dynamic campaign generator for{' '}
            <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--synthwave-cyan)' }}>
              DCS World
            </code>
            . Spin up a persistent theatre, watch flight groups move in real time, and export a .miz
            you can fly — no config, no scripting.
          </p>
          <div className="hero-cta-row">
            <button className="btn btn-primary" type="button" onClick={openDownloadModal}>
              <DlIcon />
              <span>Download</span>
              <span className="meta">v0.5.0 Alpha · Win</span>
            </button>
            <a
              className="btn btn-outline"
              href="https://github.com/rhyver/dcc"
              target="_blank"
              rel="noreferrer"
              onClick={trackSourceClicked}
            >
              <GitHubIcon />
              View Source Code
            </a>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-value">
                <span>1,400</span>
                <span className="plus">+</span>
              </div>
              <div className="stat-label">Discord Members</div>
              <div className="stat-sub">Active community of pilots</div>
            </div>
            <div className="stat">
              <div className="stat-value">
                <span>8,000</span>
                <span className="plus">+</span>
              </div>
              <div className="stat-label">Downloads</div>
              <div className="stat-sub">Across all releases</div>
            </div>
          </div>
        </div>
      </section>

      <AppScreenshotPreview />

      <CopySections onDownloadClick={openDownloadModal} />

      <Footer />
      <DownloadModal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} />
    </div>
  )
}
