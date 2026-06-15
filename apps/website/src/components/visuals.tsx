export function AppScreenshotPreview() {
  return (
    <section className="app-screenshot-preview" id="preview" aria-label="Digital Crew Chief app">
      <img
        src="/assets/campaign-preview.jpg"
        width="2029"
        height="1203"
        loading="lazy"
        decoding="async"
        alt="Digital Crew Chief campaign map showing flight groups, package controls, and mission details."
      />
    </section>
  )
}

export function ViggenStage() {
  return (
    <div className="viggen-stage" aria-hidden="true">
      <div className="viggen-photo-wrap">
        <img className="viggen-photo" src="/assets/dcs-apache-flight-web.jpg" alt="" />
        <div className="viggen-photo-tint" />
        <div className="viggen-photo-scan" />
      </div>
    </div>
  )
}

export function F14Hero() {
  return (
    <div className="f14-stage" aria-hidden="true">
      <div className="f14-grid" />
      <div className="f14-contrail t1" />
      <div className="f14-contrail t2" />
      <div className="f14-photo-wrap">
        <img className="f14-photo" src="/assets/dcs-f16-mountains-web.jpg" alt="" />
        <div className="f14-photo-tint" />
        <div className="f14-photo-scan" />
      </div>
    </div>
  )
}
