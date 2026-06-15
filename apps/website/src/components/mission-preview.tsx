import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { BaseIcon, PauseIcon, PlaneIcon, PlayIcon } from './icons'

type Side = 'friendly' | 'hostile'

type Airbase = { id: string; x: number; y: number; name: string; side: Side }
type Objective = { id: string; x: number; y: number; label: string }
type Flight = {
  id: string
  side: Side
  task: string
  plane: string
  status: string
  points: [number, number][]
  speed: number
}

const AIRBASES: Airbase[] = [
  { id: 'kob', x: 16, y: 58, name: 'KOBULETI', side: 'friendly' },
  { id: 'vaz', x: 24, y: 32, name: 'VAZIANI', side: 'friendly' },
  { id: 'snr', x: 78, y: 30, name: 'MOZDOK', side: 'hostile' },
  { id: 'krd', x: 70, y: 72, name: 'KRYMSK', side: 'hostile' }
]

const OBJECTIVES: Objective[] = [
  { id: 'obj1', x: 64, y: 36, label: 'TGT-01 SAM SITE' },
  { id: 'obj2', x: 52, y: 64, label: 'TGT-02 CONVOY' }
]

const FLIGHTS: Flight[] = [
  {
    id: 'viper-1',
    side: 'friendly',
    task: 'CAS — Convoy Strike',
    plane: 'F-16C',
    status: 'Combat',
    points: [
      [16, 58],
      [28, 55],
      [40, 60],
      [50, 64],
      [52, 64],
      [44, 58],
      [30, 56],
      [16, 58]
    ],
    speed: 0.00018
  },
  {
    id: 'magic-1',
    side: 'friendly',
    task: 'AWACS — Orbit',
    plane: 'E-3A',
    status: 'Idle',
    points: [
      [24, 46],
      [34, 42],
      [34, 52],
      [24, 52],
      [24, 46]
    ],
    speed: 0.00009
  },
  {
    id: 'eagle-2',
    side: 'friendly',
    task: 'CAP — Sector A',
    plane: 'F-15C',
    status: 'Moving',
    points: [
      [24, 32],
      [40, 30],
      [54, 34],
      [54, 46],
      [40, 44],
      [26, 40],
      [24, 32]
    ],
    speed: 0.00014
  },
  {
    id: 'mig-3',
    side: 'hostile',
    task: 'Intercept',
    plane: 'MiG-29',
    status: 'Combat',
    points: [
      [78, 30],
      [68, 34],
      [60, 40],
      [58, 46],
      [64, 38],
      [72, 32],
      [78, 30]
    ],
    speed: 0.00016
  },
  {
    id: 'frog-1',
    side: 'hostile',
    task: 'Strike',
    plane: 'Su-25',
    status: 'Moving',
    points: [
      [70, 72],
      [60, 68],
      [54, 64],
      [52, 64],
      [58, 68],
      [66, 72],
      [70, 72]
    ],
    speed: 0.00013
  }
]

type LogTemplate = { who: 'f' | 'h'; whoLabel: string; msg: string }
type LogEntry = LogTemplate & { id: number; time: string }

const LOG_TEMPLATES: LogTemplate[] = [
  { who: 'f', whoLabel: 'VIPER-1', msg: 'Engaging hostile convoy at TGT-02.' },
  { who: 'f', whoLabel: 'EAGLE-2', msg: 'Contact bandit, 080 for 24, angels 22.' },
  { who: 'f', whoLabel: 'MAGIC-1', msg: 'Picture clean, declare friendly.' },
  { who: 'h', whoLabel: 'MIG-3', msg: 'Hostile committing west, vector 270.' },
  { who: 'f', whoLabel: 'VIPER-1', msg: 'Mavericks away. Splash on TGT-02.' },
  { who: 'f', whoLabel: 'EAGLE-2', msg: 'Fox-3 on lead bandit.' },
  { who: 'h', whoLabel: 'FROG-1', msg: 'Strike package egressing east.' },
  { who: 'f', whoLabel: 'VIPER-1', msg: 'RTB Kobuleti, bingo fuel.' },
  { who: 'f', whoLabel: 'MAGIC-1', msg: 'New picture: 2 groups, bullseye 045/40.' }
]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function getFlightPos(points: [number, number][], t: number) {
  const total = points.length - 1
  const f = (t * total) % total
  const i = Math.floor(f)
  const frac = f - i
  const a = points[i]!
  const b = points[i + 1]!
  return {
    x: lerp(a[0], b[0], frac),
    y: lerp(a[1], b[1], frac),
    rot: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
  }
}

export function MissionPreview() {
  const [now, setNow] = useState(0)
  const [selected, setSelected] = useState('viper-1')
  const [speed, setSpeed] = useState(1)
  const [paused, setPaused] = useState(false)
  const [log, setLog] = useState<LogEntry[]>(() => seedLog())
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (ts: number) => {
      if (!paused) {
        const dt = ts - last
        startRef.current = (startRef.current ?? ts) + dt * speed
        setNow(startRef.current)
      }
      last = ts
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [speed, paused])

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setLog((prev) => {
        const tpl = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)]!
        const t = formatClock(Date.now() / 1000 + Math.random() * 3600)
        const next: LogEntry[] = [{ id: Math.random(), time: t, ...tpl }, ...prev].slice(0, 8)
        return next
      })
    }, 3500 / speed)
    return () => clearInterval(id)
  }, [speed, paused])

  const sel = FLIGHTS.find((f) => f.id === selected) ?? FLIGHTS[0]!
  const time = now
  const clock = formatMissionClock(time / 1000)

  return (
    <div className="preview-wrap" id="preview">
      <div className="preview-eyebrow">
        <div className="left">▌ Live Preview · Active Campaign</div>
        <div className="right">CAUCASUS · 1987 SCENARIO</div>
      </div>
      <div className="preview">
        <div className="preview-titlebar">
          <div className="titlebar-dots">
            <span className="titlebar-dot r" />
            <span className="titlebar-dot y" />
            <span className="titlebar-dot g" />
          </div>
          <div className="titlebar-title">DCC — Operation Black Sea Hammer</div>
          <div className="titlebar-meta">CAUCASUS · COALITION: BLUE</div>
        </div>

        <div className="preview-body">
          <aside className="preview-side">
            <div className="panel-title">
              <span>Flight Groups</span>
              <span className="count">{FLIGHTS.length} active</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
              {FLIGHTS.map((f) => (
                <div
                  key={f.id}
                  className={`flight-row ${selected === f.id ? 'selected' : ''}`}
                  onClick={() => setSelected(f.id)}
                >
                  <div className={`flight-icon ${f.side}`}>
                    <PlaneIcon />
                  </div>
                  <div className="flight-meta">
                    <div className="flight-name">{f.id.toUpperCase()}</div>
                    <div className="flight-task">{f.task}</div>
                  </div>
                  <div className={`flight-status s-${statusClass(f.status)}`}>{f.status}</div>
                </div>
              ))}
            </div>

            <div className="panel-title" style={{ marginTop: 6 }}>
              <span>Action Log</span>
              <span className="count">live</span>
            </div>
            <div className="log">
              <div className="log-list">
                {log.map((e) => (
                  <div className="log-entry" key={e.id}>
                    <span className="log-time">{e.time}</span>
                    <span className={`log-who ${e.who}`}>{e.whoLabel}</span>
                    <span className="log-msg">{e.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="preview-map">
            <div className="map-grid" />
            <div className="map-grid-bold" />
            <div className="radar-sweep" />
            <MapCoastline />

            <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              {FLIGHTS.map((f) => (
                <polyline
                  key={f.id}
                  className={`trail-path ${f.side}`}
                  points={f.points.map((p) => p.join(',')).join(' ')}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {AIRBASES.map((a) => (
              <div
                key={a.id}
                className={`airbase ${a.side === 'hostile' ? 'hostile' : ''}`}
                style={{ left: `${a.x}%`, top: `${a.y}%` }}
              >
                <BaseIcon />
                <div className="label">{a.name}</div>
              </div>
            ))}

            {OBJECTIVES.map((o) => (
              <div key={o.id} className="objective" style={{ left: `${o.x}%`, top: `${o.y}%` }}>
                <div className="label">{o.label}</div>
              </div>
            ))}

            {FLIGHTS.map((f) => {
              const tNorm = (((time * f.speed) % 1) + 1) % 1
              const p = getFlightPos(f.points, tNorm)
              const isSel = selected === f.id
              return (
                <div
                  key={f.id}
                  className={`aircraft ${f.side}`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  <div
                    className="glyph"
                    style={
                      {
                        '--rot': `${p.rot + 90}deg`,
                        transform: isSel ? 'scale(1.25)' : 'scale(1)'
                      } as CSSProperties
                    }
                  >
                    <PlaneIcon />
                  </div>
                  <div className="label">{f.id.toUpperCase()}</div>
                </div>
              )
            })}

            <div className="map-overlay-tl">
              <div>
                <span className="label">LAT</span> <span className="val">42°06&apos;N</span>
              </div>
              <div>
                <span className="label">LON</span> <span className="val">042°51&apos;E</span>
              </div>
            </div>
            <div className="map-overlay-tr">
              <div>
                <span className="label">WIND</span> <span className="val">270 / 12 KT</span>
              </div>
              <div>
                <span className="label">QNH</span> <span className="val">29.92&quot;</span>
              </div>
            </div>
            <div className="map-overlay-bl">
              <div>
                <span className="label">SCALE</span> <span className="val">1 : 500K</span>
              </div>
            </div>
            <div className="map-overlay-br">
              <div>
                <span className="label">THEATRE</span> <span className="val">CAUCASUS</span>
              </div>
            </div>
          </div>

          <aside className="preview-info">
            <div className="panel-title">
              <span>{sel.id.toUpperCase()}</span>
              <span className="count">{sel.plane}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="info-row">
                <span className="l">Task</span>
                <span className="v">{sel.task}</span>
              </div>
              <div className="info-row">
                <span className="l">Status</span>
                <span className="v">{sel.status}</span>
              </div>
              <div className="info-row">
                <span className="l">Side</span>
                <span className="v">{sel.side === 'friendly' ? 'BLUE' : 'RED'}</span>
              </div>
              <div className="info-row">
                <span className="l">Fuel</span>
                <span className="v">{(78 - ((time / 1000) % 50)).toFixed(0)}%</span>
              </div>
              <div className="info-row">
                <span className="l">Bullseye</span>
                <span className="v">045 / 28</span>
              </div>
            </div>

            <div className="panel-title" style={{ marginTop: 6 }}>
              <span>Mission Briefing</span>
              <span className="count">02 / 06</span>
            </div>
            <p className="briefing">
              <strong>Operation Black Sea Hammer.</strong> Cripple enemy air power before their
              offensive launches. Strike package hits <strong>TGT-01 SAM site</strong> and{' '}
              <strong>TGT-02 convoy</strong> under CAP cover from EAGLE-2. MAGIC-1 provides AWACS
              picture from the eastern orbit.
            </p>

            <div className="panel-title" style={{ marginTop: 6 }}>
              <span>Weather</span>
              <span className="count">06 APR · 14:30Z</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="info-row">
                <span className="l">Cloud</span>
                <span className="v">SCT 8,000 FT</span>
              </div>
              <div className="info-row">
                <span className="l">Vis</span>
                <span className="v">12 SM</span>
              </div>
              <div className="info-row">
                <span className="l">Temp</span>
                <span className="v">+9°C</span>
              </div>
            </div>
          </aside>
        </div>

        <div className="time-bar">
          <span className="time-pill">MISSION T+</span>
          <span className="time-clock">{clock}</span>
          <span className="time-spacer" />
          <div className="time-controls">
            <button
              className={`time-btn ${paused ? 'active' : ''}`}
              onClick={() => setPaused((p) => !p)}
              title={paused ? 'Play' : 'Pause'}
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
            </button>
            <button
              className={`time-btn ${speed === 1 ? 'active' : ''}`}
              onClick={() => setSpeed(1)}
            >
              1×
            </button>
            <button
              className={`time-btn ${speed === 4 ? 'active' : ''}`}
              onClick={() => setSpeed(4)}
            >
              4×
            </button>
            <button
              className={`time-btn ${speed === 16 ? 'active' : ''}`}
              onClick={() => setSpeed(16)}
            >
              16×
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function statusClass(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '')
}

function seedLog(): LogEntry[] {
  return [
    { id: 0, time: '14:30', ...LOG_TEMPLATES[0]! },
    { id: 1, time: '14:26', ...LOG_TEMPLATES[1]! },
    { id: 2, time: '14:22', ...LOG_TEMPLATES[2]! }
  ]
}

function formatClock(s: number): string {
  const d = new Date(s * 1000)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatMissionClock(s: number): string {
  const total = Math.floor(s)
  const hh = String(Math.floor(total / 3600) % 24).padStart(2, '0')
  const mm = String(Math.floor(total / 60) % 60).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function MapCoastline() {
  return (
    <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 1 }}>
      <defs>
        <linearGradient id="seaGrad" x1="0" x2="1">
          <stop offset="0" stopColor="rgba(0,221,255,0.08)" />
          <stop offset="1" stopColor="rgba(0,221,255,0)" />
        </linearGradient>
      </defs>
      <path
        d="M0,0 L0,100 L18,100 Q18,80 14,68 Q10,55 16,42 Q22,30 18,18 Q15,8 12,0 Z"
        fill="url(#seaGrad)"
        stroke="rgba(0,221,255,0.35)"
        strokeWidth="0.2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M30,55 Q40,52 50,56 Q60,60 70,54 Q80,48 92,52"
        fill="none"
        stroke="rgba(255,0,170,0.25)"
        strokeWidth="0.25"
        strokeDasharray="1 2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M40,18 Q44,30 50,38 Q56,46 56,58 Q56,72 60,86 L60,100"
        fill="none"
        stroke="rgba(255,0,170,0.45)"
        strokeWidth="0.4"
        strokeDasharray="2 2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
