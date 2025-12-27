import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { coreClient } from '@/lib/orpc'
import { Button } from '@/components/ui/button'

export function Settings() {
  const navigate = useNavigate()
  const [missionExportPath, setMissionExportPath] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    coreClient.campaign.getSettings().then((settings) => {
      setMissionExportPath(settings.missionExportPath || '')
      setLoading(false)
    })
  }, [])

  const handleBrowse = async () => {
    const path = await window.api?.selectDirectory()
    if (path) {
      setMissionExportPath(path)
    }
  }

  const handleSave = async () => {
    await coreClient.campaign.saveSettings({ missionExportPath })
    navigate('/new')
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-synthwave-dark text-white">
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

      <div className="relative z-10 flex w-full max-w-2xl flex-col p-8 bg-black/50 border border-synthwave-pink/30 rounded-lg backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
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
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Mission Export Path</label>
              <div className="flex gap-2">
                <div className="flex-1 p-2 rounded bg-gray-900 border border-gray-700 font-mono text-sm truncate flex items-center">
                  {missionExportPath || 'Default (Downloads folder)'}
                </div>
                <Button
                  variant="outline"
                  onClick={handleBrowse}
                  className="border-synthwave-purple text-synthwave-cyan hover:bg-synthwave-purple/20"
                >
                  Browse...
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Select the folder where the mission.miz file should be saved.
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={handleSave}
                className="bg-synthwave-pink hover:bg-synthwave-pink/80 text-white retro-font"
              >
                SAVE SETTINGS
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

