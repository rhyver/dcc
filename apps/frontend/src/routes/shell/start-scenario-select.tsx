import { ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { schemas } from '@dcc/contracts'
import { factions as builtInFactions, scenarios } from '@dcc/data'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { coreClient } from '@/lib/orpc'

import { CampaignStep } from './start-campaign-step'
import { FactionEditor } from './start-faction-editor'
import {
  factionIdsByEra,
  type CampaignEra,
  type Faction,
  type ScenarioStep as ScenarioStepName
} from './start-campaign-options'
import { ScenarioStep } from './start-scenario-step'

const CUSTOM_FACTIONS_STORAGE_KEY = 'dcc.custom-factions'

function loadCustomFactions(): Faction[] {
  try {
    const stored = localStorage.getItem(CUSTOM_FACTIONS_STORAGE_KEY)
    if (!stored) return []
    const parsed = schemas.faction.array().safeParse(JSON.parse(stored))
    return parsed.success ? parsed.data.filter((faction) => faction.id.startsWith('custom-')) : []
  } catch {
    return []
  }
}

type FactionEditorState = {
  role: 'player' | 'opponent'
  mode: 'create' | 'customize'
  seedFaction: Faction
}

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
  const [customFactions, setCustomFactions] = useState<Faction[]>(loadCustomFactions)
  const [factionEditor, setFactionEditor] = useState<FactionEditorState | null>(null)
  const [step, setStep] = useState<ScenarioStepName>('scenario')
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false)
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? firstAvailableScenario
  const availableFactions = useMemo(() => [...builtInFactions, ...customFactions], [customFactions])
  const selectedPlayerFaction = availableFactions.find(
    (faction) => faction.id === selectedPlayerFactionId
  )
  const selectedOpponentFaction = availableFactions.find(
    (faction) => faction.id === selectedOpponentFactionId
  )

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
      selectedPlayerFaction == null ||
      selectedOpponentFaction == null ||
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
        opponentFactionId: selectedOpponentFactionId,
        playerFaction: selectedPlayerFaction,
        opponentFaction: selectedOpponentFaction
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

  const openFactionEditor = (role: 'player' | 'opponent', mode: FactionEditorState['mode']) => {
    const faction = role === 'player' ? selectedPlayerFaction : selectedOpponentFaction
    if (!faction) return
    setFactionEditor({ role, mode, seedFaction: faction })
  }

  const saveFaction = (faction: Faction) => {
    if (!factionEditor) return
    const existingIndex = customFactions.findIndex((entry) => entry.id === faction.id)
    const nextCustomFactions =
      existingIndex === -1
        ? [...customFactions, faction]
        : customFactions.map((entry) => (entry.id === faction.id ? faction : entry))
    setCustomFactions(nextCustomFactions)
    localStorage.setItem(CUSTOM_FACTIONS_STORAGE_KEY, JSON.stringify(nextCustomFactions))
    if (factionEditor.role === 'player') {
      setSelectedPlayerFactionId(faction.id)
    } else {
      setSelectedOpponentFactionId(faction.id)
    }
    setFactionEditor(null)
  }

  return (
    <>
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
              factions={availableFactions}
              selectedPlayerFactionId={selectedPlayerFactionId}
              selectedOpponentFactionId={selectedOpponentFactionId}
              isCreatingCampaign={isCreatingCampaign}
              onSelectEra={selectEra}
              onSelectPlayerFaction={setSelectedPlayerFactionId}
              onSelectOpponentFaction={setSelectedOpponentFactionId}
              onCustomizeFaction={(role) => openFactionEditor(role, 'customize')}
              onCreateFaction={(role) => openFactionEditor(role, 'create')}
              onCustomizeFactions={() => setStep('factions')}
              onCreateCampaign={() => void createCampaign()}
            />
          ) : null}
        </div>
      </div>
      {factionEditor ? (
        <FactionEditor
          key={`${factionEditor.mode}-${factionEditor.seedFaction.id}`}
          mode={factionEditor.mode}
          seedFaction={factionEditor.seedFaction}
          onCancel={() => setFactionEditor(null)}
          onSave={saveFaction}
        />
      ) : null}
    </>
  )
}
