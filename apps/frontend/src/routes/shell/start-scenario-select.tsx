import { ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { scenarios } from '@dcc/data'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { coreClient } from '@/lib/orpc'

import { CampaignStep } from './start-campaign-step'
import {
  factionIdsByEra,
  type CampaignEra,
  type ScenarioStep as ScenarioStepName
} from './start-campaign-options'
import { ScenarioStep } from './start-scenario-step'

export function ScenarioSelect() {
  const navigate = useNavigate()
  const availableScenarios = scenarios.filter((scenario) => scenario.available)
  const firstAvailableScenario = availableScenarios[0] ?? scenarios[0]
  const [selectedScenarioId, setSelectedScenarioId] = useState(firstAvailableScenario?.id ?? '')
  const [selectedEra, setSelectedEra] = useState<CampaignEra>('Modern')
  const defaultFactions = factionIdsByEra.Modern
  const [selectedPlayerFactionId, setSelectedPlayerFactionId] = useState(defaultFactions.player)
  const [selectedOpponentFactionId, setSelectedOpponentFactionId] = useState(
    defaultFactions.opponent
  )
  const [step, setStep] = useState<ScenarioStepName>('scenario')
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false)
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? firstAvailableScenario

  const selectEra = (era: CampaignEra) => {
    setSelectedEra(era)
    const defaults = factionIdsByEra[era]
    setSelectedPlayerFactionId(defaults.player)
    setSelectedOpponentFactionId(defaults.opponent)
  }

  const createCampaign = async () => {
    const factionsDiffer = selectedPlayerFactionId !== selectedOpponentFactionId
    if (
      selectedScenario == null ||
      !selectedScenario.available ||
      isCreatingCampaign ||
      !factionsDiffer
    ) {
      return
    }

    setIsCreatingCampaign(true)
    try {
      await coreClient.campaign.createCampaign({
        scenarioId: selectedScenario.id,
        era: selectedEra,
        playerFactionId: selectedPlayerFactionId,
        opponentFactionId: selectedOpponentFactionId
      })
      navigate('/', { state: { showWelcomeDialog: true } })
    } finally {
      setIsCreatingCampaign(false)
    }
  }

  const stepTitle = step === 'era' ? 'ERA' : step === 'factions' ? 'FACTIONS' : 'SCENARIO'
  const stepSubtitle =
    step === 'era'
      ? 'ERA SELECT'
      : step === 'factions'
        ? 'CUSTOMIZE FACTIONS'
        : `${availableScenarios.length} SCENARIOS`

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
              if (step === 'factions') {
                setStep('era')
              } else if (step === 'era') {
                setStep('scenario')
              } else {
                navigate('/new')
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 'factions' ? 'ERA' : step === 'era' ? 'SCENARIO' : 'BACK'}
          </Button>
          <div className="retro-font text-sm text-synthwave-cyan/75">{stepSubtitle}</div>
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
              {stepTitle}
            </span>
          </h1>
        </motion.div>

        {step === 'scenario' ? (
          <ScenarioStep
            selectedScenario={selectedScenario}
            isCreatingCampaign={isCreatingCampaign}
            onSelectScenario={setSelectedScenarioId}
            onContinue={() => setStep('era')}
          />
        ) : selectedScenario ? (
          <CampaignStep
            scenario={selectedScenario}
            step={step}
            selectedEra={selectedEra}
            selectedPlayerFactionId={selectedPlayerFactionId}
            selectedOpponentFactionId={selectedOpponentFactionId}
            isCreatingCampaign={isCreatingCampaign}
            onSelectEra={selectEra}
            onSelectPlayerFaction={setSelectedPlayerFactionId}
            onSelectOpponentFaction={setSelectedOpponentFactionId}
            onCustomizeFactions={() => setStep('factions')}
            onCreateCampaign={() => void createCampaign()}
          />
        ) : null}
      </div>
    </div>
  )
}
