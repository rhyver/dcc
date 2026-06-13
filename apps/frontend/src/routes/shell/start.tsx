import { ArrowLeft, BookOpen, Clock3, FolderOpen, Globe2, LogOut, Settings } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { scenarios } from '@dcc/data'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { coreClient } from '@/lib/orpc'
import { useNavigate } from 'react-router'

type MenuOption = {
  id: string
  label: string
  icon: typeof BookOpen
  disabled?: boolean
}

const menuOptions: MenuOption[] = [
  { id: 'campaign', label: 'NEW CAMPAIGN', icon: BookOpen },
  { id: 'loadCampaign', label: 'LOAD CAMPAIGN', icon: FolderOpen },
  { id: 'settings', label: 'SETTINGS', icon: Settings },
  { id: 'exit', label: 'EXIT', icon: LogOut }
]

type CampaignEra = 'Early CW' | 'Late CW' | 'Modern'
type ScenarioStep = 'scenario' | 'era'

const eraOptions: Array<{
  id: CampaignEra
  label: string
  callsign: string
  description: string
}> = [
  {
    id: 'Early CW',
    label: 'Early Cold War',
    callsign: 'ANALOG AGE',
    description: '1950s and early 1960s aircraft with sparse electronics and close-range fights.'
  },
  {
    id: 'Late CW',
    label: 'Late Cold War',
    callsign: 'MISSILE AGE',
    description: '1970s-era aircraft and weapons with early BVR tactics and heavier SAM coverage.'
  },
  {
    id: 'Modern',
    label: 'Modern',
    callsign: 'DIGITAL AGE',
    description: 'Contemporary aircraft, advanced weapons, and high-tempo operations.'
  }
]

export function ScenarioSelect() {
  const navigate = useNavigate()
  const availableScenarios = scenarios.filter((scenario) => scenario.available)
  const firstAvailableScenario = availableScenarios[0] ?? scenarios[0]
  const [selectedScenarioId, setSelectedScenarioId] = useState(firstAvailableScenario?.id ?? '')
  const [selectedEra, setSelectedEra] = useState<CampaignEra>('Modern')
  const [step, setStep] = useState<ScenarioStep>('scenario')
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false)
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? firstAvailableScenario
  const selectedEraOption = eraOptions.find((era) => era.id === selectedEra) ?? eraOptions[0]

  const createCampaign = async () => {
    if (selectedScenario == null || !selectedScenario.available || isCreatingCampaign) {
      return
    }

    setIsCreatingCampaign(true)
    try {
      await coreClient.campaign.createCampaign({ scenarioId: selectedScenario.id, era: selectedEra })
      navigate('/', { state: { showWelcomeDialog: true } })
    } finally {
      setIsCreatingCampaign(false)
    }
  }

  return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-synthwave-dark">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--synthwave-cyan) 1px, transparent 1px), linear-gradient(to bottom, var(--synthwave-purple) 1px, transparent 1px)',
            backgroundSize: '44px 44px'
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-[42vh] bg-linear-to-t from-synthwave-purple via-synthwave-pink/35 to-transparent opacity-35" />

        <div className="relative z-10 flex h-full w-full max-w-6xl flex-col px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              className="border-synthwave-purple bg-synthwave-dark/80 text-synthwave-cyan hover:border-synthwave-pink hover:bg-synthwave-purple/10 hover:text-white"
              onClick={() => {
                if (step === 'era') {
                  setStep('scenario')
                } else {
                  navigate('/new')
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 'era' ? 'SCENARIO' : 'BACK'}
            </Button>
            <div className="retro-font text-sm text-synthwave-cyan/75">
              {step === 'era' ? 'ERA SELECT' : `${availableScenarios.length} SCENARIOS`}
            </div>
          </div>

          <motion.div
            className="mb-6"
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <h1 className="retro-font text-4xl font-bold tracking-tighter text-white md:text-5xl">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-synthwave-cyan to-synthwave-pink">
                SELECT
              </span>
              <span className="ml-3 text-white drop-shadow-[0_0_14px_rgba(255,0,170,0.45)]">
                {step === 'era' ? 'ERA' : 'SCENARIO'}
              </span>
            </h1>
          </motion.div>

          {step === 'scenario' ? (
          <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-h-0 overflow-auto pr-2">
              <div className="grid gap-3">
                {scenarios.map((scenario) => {
                  const isSelected = scenario.id === selectedScenario?.id
                  const briefingPreview =
                    scenario.briefing.split(/\n{2,}/)[0]?.replace(/\s+/g, ' ').trim() ?? ''

                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      className={cn(
                        'group min-h-48 rounded-md border p-4 text-left transition-all',
                        'bg-synthwave-dark/78 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur',
                        isSelected
                          ? 'border-synthwave-pink text-white shadow-[0_0_32px_rgba(255,0,170,0.24)]'
                          : 'border-synthwave-purple/45 text-synthwave-light hover:border-synthwave-cyan hover:bg-synthwave-purple/10',
                        !scenario.available && 'cursor-not-allowed opacity-45'
                      )}
                      onClick={() => {
                        if (scenario.available) {
                          setSelectedScenarioId(scenario.id)
                        }
                      }}
                      disabled={!scenario.available}
                    >
                      <div className="mb-4">
                        <div>
                          <div className="retro-font text-xl tracking-wide">{scenario.name}</div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-synthwave-cyan/75">
                            <span className="inline-flex items-center gap-1">
                              <Globe2 className="h-3.5 w-3.5" />
                              {scenario.theatreName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="line-clamp-4 text-sm leading-6 text-synthwave-light/68">
                        {briefingPreview}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <aside
              className="flex min-h-0 flex-col rounded-md border border-synthwave-pink/35 bg-black/30 p-5 shadow-[0_0_44px_rgba(255,0,170,0.14)] backdrop-blur"
            >
              {selectedScenario ? (
                <>
                  <div className="retro-font text-2xl text-white">{selectedScenario.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-synthwave-cyan/80">
                    <span>{selectedScenario.theatreName}</span>
                  </div>
                  <div className="mt-5 min-h-0 flex-1 overflow-auto border-y border-synthwave-purple/30 py-4">
                    {selectedScenario.briefing
                      .split(/\n{2,}/)
                      .filter((paragraph) => paragraph.trim().length > 0)
                      .map((paragraph) => (
                        <p
                          key={paragraph}
                          className="mb-4 text-sm leading-6 text-synthwave-light/72 last:mb-0"
                        >
                          {paragraph}
                        </p>
                      ))}
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-synthwave-light/55">PLAYER</span>
                      <span className="truncate text-right text-white">
                        {selectedScenario.start.player.airdromeNames.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-synthwave-light/55">OBJECTIVE</span>
                      <span className="truncate text-right text-synthwave-pink">
                        {selectedScenario.goal?.objectiveIds.join(', ') ?? 'Campaign advance'}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="mt-5 h-11 bg-synthwave-pink text-white hover:bg-synthwave-pink/85"
                    onClick={() => setStep('era')}
                    disabled={isCreatingCampaign || !selectedScenario.available}
                  >
                    <BookOpen className="h-4 w-4" />
                    SELECT ERA
                  </Button>
                </>
              ) : null}
            </aside>
          </div>
          ) : (
            <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid content-start gap-3">
                {eraOptions.map((era) => {
                  const isSelected = era.id === selectedEra

                  return (
                    <button
                      key={era.id}
                      type="button"
                      className={cn(
                        'group min-h-48 rounded-md border p-5 text-left transition-all',
                        'bg-synthwave-dark/78 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur',
                        isSelected
                          ? 'border-synthwave-pink text-white shadow-[0_0_32px_rgba(255,0,170,0.24)]'
                          : 'border-synthwave-purple/45 text-synthwave-light hover:border-synthwave-cyan hover:bg-synthwave-purple/10'
                      )}
                      onClick={() => setSelectedEra(era.id)}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="retro-font text-2xl tracking-wide">{era.label}</div>
                          <div className="mt-1 flex items-center gap-1 text-xs text-synthwave-cyan/75">
                            <Clock3 className="h-3.5 w-3.5" />
                            {era.callsign}
                          </div>
                        </div>
                        <span
                          className={cn(
                            'rounded border px-2 py-1 text-xs',
                            isSelected
                              ? 'border-synthwave-pink/70 text-synthwave-pink'
                              : 'border-synthwave-purple/50 text-synthwave-light/55'
                          )}
                        >
                          {isSelected ? 'SELECTED' : 'AVAILABLE'}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-synthwave-light/68">{era.description}</p>
                    </button>
                  )
                })}
              </div>

              <aside
                className="flex min-h-0 flex-col rounded-md border border-synthwave-pink/35 bg-black/30 p-5 shadow-[0_0_44px_rgba(255,0,170,0.14)] backdrop-blur"
              >
                {selectedScenario ? (
                  <>
                    <div className="retro-font text-2xl text-white">{selectedScenario.name}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-synthwave-cyan/80">
                      <span>{selectedScenario.theatreName}</span>
                      <span>{selectedEraOption.label}</span>
                    </div>
                    <div className="mt-5 border-y border-synthwave-purple/30 py-4">
                      <div className="text-xs text-synthwave-light/55">SELECTED ERA</div>
                      <div className="mt-2 retro-font text-xl text-synthwave-pink">
                        {selectedEraOption.label}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-synthwave-light/72">
                        {selectedEraOption.description}
                      </p>
                    </div>
                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-synthwave-light/55">PLAYER</span>
                        <span className="truncate text-right text-white">
                          {selectedScenario.start.player.airdromeNames.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-synthwave-light/55">OBJECTIVE</span>
                        <span className="truncate text-right text-synthwave-pink">
                          {selectedScenario.goal?.objectiveIds.join(', ') ?? 'Campaign advance'}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      className="mt-auto h-11 bg-synthwave-pink text-white hover:bg-synthwave-pink/85"
                      onClick={() => void createCampaign()}
                      disabled={isCreatingCampaign || !selectedScenario.available}
                    >
                      <BookOpen className="h-4 w-4" />
                      {isCreatingCampaign ? 'CREATING' : 'CREATE CAMPAIGN'}
                    </Button>
                  </>
                ) : null}
              </aside>
            </div>
          )}
        </div>
      </div>
    )
}

export function StartMenu() {
  const navigate = useNavigate()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-synthwave-dark">
      {/* Grid background */}
      <div className="absolute inset-0 z-0 bg-cover opacity-20" />

      {/* Synthwave sun/horizon effect */}
      <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-linear-to-t from-synthwave-pink via-synthwave-purple to-transparent opacity-30" />

      {/* Animated grid lines */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--synthwave-pink) 1px, transparent 1px), linear-gradient(to bottom, var(--synthwave-pink) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Content container */}
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-start px-8">
        {/* Game title with neon effect */}
        <motion.div
          className="mb-12 flex flex-col"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="retro-font text-6xl font-bold tracking-tighter text-white md:text-7xl lg:text-8xl">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-synthwave-pink to-synthwave-cyan">
              DIGITAL
            </span>
            <span className="ml-3 relative">
              CREW CHIEF
              <span className="absolute inset-0 blur-[10px] text-synthwave-pink opacity-70">
                CREW CHIEF
              </span>
            </span>
          </h1>
          <h2 className="pixel-font text-lg text-synthwave-cyan md:text-xl">
            100% FLYING, 0% CONFIGURATION.
            <span className="ml-2 inline-block h-5 w-2 animate-pulse bg-synthwave-cyan"></span>
          </h2>
        </motion.div>

        {/* Menu options with neon glow */}
        <div className="flex w-full max-w-md flex-col space-y-3">
          {menuOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
              <Button
                variant={selectedOption === option.id ? 'default' : 'outline'}
                className={cn(
                  'group relative flex w-full justify-start gap-3 border-l-4 px-4 py-6 text-left retro-font text-xl transition-all',
                  selectedOption === option.id
                    ? 'border-synthwave-pink bg-synthwave-pink/10 text-white hover:bg-synthwave-pink/20'
                    : 'border-synthwave-purple bg-synthwave-dark/80 text-synthwave-cyan hover:border-synthwave-pink hover:bg-synthwave-purple/10 hover:text-white',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => {
                  if (option.disabled) return
                  setSelectedOption(option.id)
                  window.setTimeout(async () => {
                    if (option.id === 'campaign') {
                      setSelectedOption(null)
                      navigate('/new/scenario')
                    } else if (option.id === 'loadCampaign') {
                      navigate('/load')
                    } else if (option.id === 'settings') {
                      navigate('/settings')
                    } else if (option.id === 'exit') {
                      window.close()
                    }
                  }, 200)
                }}
                disabled={option.disabled}
              >
                <option.icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    selectedOption === option.id
                      ? 'text-synthwave-pink'
                      : 'text-synthwave-cyan group-hover:text-synthwave-pink'
                  )}
                />
                {option.label}
                {selectedOption === option.id && (
                  <span className="absolute inset-0 blur-[20px] bg-synthwave-pink/20 opacity-70"></span>
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Retro aircraft silhouette with neon outline */}
        <motion.div
          className="absolute bottom-0 right-0 h-[450px] w-[360px]"
          style={{
            filter: 'drop-shadow(0 0 10px var(--synthwave-pink))'
          }}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 0.6 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {/* <img src={f14} alt="F-14 Tomcat" className="w-full h-full object-center object-cover" /> */}
        </motion.div>
      </div>
    </div>
  )
  /*  return (
		<div className="p-2 flex flex-col gap-2 items-center justify-center w-full flex-1">
			<h1 className='text-2xl font-bold'>Digital Crew Chief</h1>
				{appList.map((app) => (
					<button key={app.id} className={cn('w-96 bg-gray-800 rounded-lg p-4', {
						"opacity-50": !app.available
					})} onClick={() => {
						if (!app.available) return;
						void rpc.misc.loadApp(app.id as "campaign");
					}}>
						<h2>{app.name}</h2>
						<p className='text-sm opacity-60'>{app.description}</p>
					</button>
				))}
			</div>
			) */
}
