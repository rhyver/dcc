import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { coreClient } from '@/lib/orpc'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

type AiProvider = 'openai' | 'anthropic' | 'openrouter'

const AI_DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: 'gpt-5-mini',
  anthropic: 'claude-sonnet-4-6',
  openrouter: 'anthropic/claude-sonnet-4'
}

const AI_MODEL_OPTIONS: Record<AiProvider, string[]> = {
  openai: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1', 'gpt-4.1-mini'],
  anthropic: ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
  openrouter: [
    'anthropic/claude-sonnet-4',
    'anthropic/claude-haiku-4',
    'openai/gpt-5-mini',
    'openai/gpt-4.1-mini',
    'google/gemini-2.5-flash',
    'meta-llama/llama-4-maverick',
    'minimax/minimax-m2.5',
    'moonshotai/kimi-k2.5'
  ]
}

export function Settings() {
  const navigate = useNavigate()
  const [missionExportPath, setMissionExportPath] = useState<string>('')
  const [dcsInstallPath, setDcsInstallPath] = useState<string>('')
  const [enableDcsPersistence, setEnableDcsPersistence] = useState<boolean>(true)
  const [aiProvider, setAiProvider] = useState<AiProvider>('openai')
  const [aiApiKey, setAiApiKey] = useState<string>('')
  const [aiModel, setAiModel] = useState<string>('')
  const [enableAutoUpdate, setEnableAutoUpdate] = useState<boolean>(true)
  const [appVersion, setAppVersion] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    coreClient.campaign.getSettings().then((settings) => {
      setMissionExportPath(settings.missionExportPath || '')
      setDcsInstallPath(settings.dcsInstallPath || '')
      setEnableDcsPersistence(settings.enableDcsPersistence ?? true)
      setAiProvider(settings.aiProvider ?? 'openai')
      setAiApiKey(settings.aiApiKey ?? '')
      setAiModel(settings.aiModel ?? '')
      setEnableAutoUpdate(!(settings.disableAutoUpdate ?? false))
      setLoading(false)
    })
    window.api?.getAppVersion?.().then((version) => {
      setAppVersion(version)
    })
  }, [])

  const handleBrowseMissionExportPath = async () => {
    const path = await window.api?.selectDirectory()
    if (path) {
      setMissionExportPath(path)
    }
  }

  const handleBrowseDcsInstallPath = async () => {
    const path = await window.api?.selectDirectory()
    if (path) {
      setDcsInstallPath(path)
    }
  }

  const handleSave = async () => {
    await coreClient.campaign.saveSettings({
      missionExportPath,
      dcsInstallPath,
      enableDcsPersistence,
      aiProvider,
      aiApiKey: aiApiKey.trim() || undefined,
      aiModel: aiModel.trim() || undefined,
      disableAutoUpdate: !enableAutoUpdate
    })
    navigate('/new')
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-synthwave-dark text-white">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-cover opacity-20" />
      <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-linear-to-t from-synthwave-pink via-synthwave-purple to-transparent opacity-30" />
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--synthwave-pink) 1px, transparent 1px), linear-gradient(to bottom, var(--synthwave-pink) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 flex h-full w-full items-start justify-center p-4 sm:p-6">
        <div className="flex h-full w-full max-w-2xl flex-col">
          <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-synthwave-pink/30 bg-black/50 p-8 backdrop-blur-sm">
            <div className="mb-6 flex shrink-0 items-center justify-between">
              <h2 className="retro-font text-3xl text-synthwave-cyan">SETTINGS</h2>
              <Button
                variant="ghost"
                onClick={() => navigate('/new')}
                className="text-synthwave-pink hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </div>

            {loading ? (
              <div>Loading...</div>
            ) : (
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-6 pr-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Mission Export Path</label>
                    <div className="flex gap-2">
                      <div className="flex-1 p-2 rounded bg-gray-900 border border-gray-700 font-mono text-sm truncate flex items-center">
                        {missionExportPath || 'Default (Downloads folder)'}
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleBrowseMissionExportPath}
                        className="border-synthwave-purple text-synthwave-cyan hover:bg-synthwave-purple/20"
                      >
                        Browse...
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Select the folder where the mission.miz file should be saved.
                    </p>
                  </div>

                  {/* AI settings are temporarily hidden; keep this block for re-enabling later.
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">AI Provider</label>
                <select
                  value={aiProvider}
                  onChange={(event) => setAiProvider(event.target.value as AiProvider)}
                  className="w-full rounded border border-gray-700 bg-gray-900 p-2 text-sm text-white"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
                <p className="text-xs text-gray-500">
                  Choose the provider used by AI Mission Generator chat and planning.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">AI API Key</label>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(event) => setAiApiKey(event.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 p-2 text-sm text-white"
                  placeholder={
                    aiProvider === 'anthropic'
                      ? 'sk-ant-...'
                      : aiProvider === 'openrouter'
                        ? 'sk-or-...'
                        : 'sk-...'
                  }
                />
                <p className="text-xs text-gray-500">
                  Stored locally in app settings. Required for AI mission generation.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">AI Model (optional)</label>
                <select
                  value={aiModel}
                  onChange={(event) => setAiModel(event.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 p-2 text-sm text-white"
                >
                  <option value="">Default ({AI_DEFAULT_MODELS[aiProvider]})</option>
                  {AI_MODEL_OPTIONS[aiProvider].map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
              */}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">DCS Install Path</label>
                    <div className="flex gap-2">
                      <div className="flex-1 p-2 rounded bg-gray-900 border border-gray-700 font-mono text-sm truncate flex items-center">
                        {dcsInstallPath || 'Auto-detect from default install locations'}
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleBrowseDcsInstallPath}
                        className="border-synthwave-purple text-synthwave-cyan hover:bg-synthwave-purple/20"
                      >
                        Browse...
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Select your DCS World installation folder (the one containing `Scripts`).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">DCS Persistence</label>
                    <label className="flex items-center gap-3 rounded border border-gray-700 bg-gray-900 p-3">
                      <input
                        type="checkbox"
                        checked={enableDcsPersistence}
                        onChange={(event) => setEnableDcsPersistence(event.target.checked)}
                        className="h-4 w-4 accent-cyan-400"
                      />
                      <span className="text-sm text-gray-200">
                        Enable MissionScripting persistence patch while app is running
                      </span>
                    </label>
                    <p className="text-xs text-gray-500">
                      When enabled, `sanitizeModule(&apos;io&apos;)` and
                      `sanitizeModule(&apos;lfs&apos;)` are temporarily disabled as soon as you save
                      these settings and restored on app exit.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Automatic Updates</label>
                    <label className="flex items-center gap-3 rounded border border-gray-700 bg-gray-900 p-3">
                      <input
                        type="checkbox"
                        checked={enableAutoUpdate}
                        onChange={(event) => setEnableAutoUpdate(event.target.checked)}
                        className="h-4 w-4 accent-cyan-400"
                      />
                      <span className="text-sm text-gray-200">Enable automatic update checks</span>
                    </label>
                    <p className="text-xs text-gray-500">
                      When enabled, the app checks the update server on launch. Restart the app to
                      apply.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Version</label>
                    <div className="rounded border border-gray-700 bg-gray-900 p-2 font-mono text-sm text-gray-200">
                      {appVersion || 'unknown'}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="flex shrink-0 justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-synthwave-pink hover:bg-synthwave-pink/80 text-white retro-font"
            >
              SAVE SETTINGS
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
