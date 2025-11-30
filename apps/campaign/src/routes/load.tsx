import { ArrowLeft, Calendar, FolderOpen } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { coreClient, orpc } from '@/lib/orpc'
import { useNavigate } from 'react-router'

export function Load() {
  const navigate = useNavigate()
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)

  const campaignsQuery = useQuery(orpc.campaign.listCampaigns.queryOptions({}))

  const campaigns = campaignsQuery.data ?? []

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-synthwave-dark">
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
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/new')}
            className="border-synthwave-purple bg-synthwave-dark/80 text-synthwave-cyan hover:border-synthwave-pink hover:bg-synthwave-purple/10 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Button>
        </motion.div>

        {/* Title */}
        <motion.div
          className="mb-8 flex flex-col"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="retro-font text-5xl font-bold tracking-tighter text-white md:text-6xl lg:text-7xl">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-synthwave-pink to-synthwave-cyan">
              LOAD
            </span>
            <span className="ml-3 relative">
              CAMPAIGN
              <span className="absolute inset-0 blur-[10px] text-synthwave-pink opacity-70">
                CAMPAIGN
              </span>
            </span>
          </h1>
          <h2 className="pixel-font text-lg text-synthwave-cyan md:text-xl">
            CHOOSE YOUR MISSION
            <span className="ml-2 inline-block h-5 w-2 animate-pulse bg-synthwave-cyan"></span>
          </h2>
        </motion.div>

        {/* Campaign list */}
        <div className="flex w-full max-w-2xl flex-col space-y-3">
          {campaignsQuery.isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-synthwave-cyan pixel-font"
            >
              Loading campaigns...
            </motion.div>
          ) : campaigns.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <p className="text-synthwave-cyan pixel-font mb-4">No saved campaigns found</p>
              <Button
                variant="outline"
                onClick={() => navigate('/new')}
                className="border-synthwave-pink bg-synthwave-dark/80 text-synthwave-cyan hover:border-synthwave-pink hover:bg-synthwave-purple/10 hover:text-white"
              >
                Create New Campaign
              </Button>
            </motion.div>
          ) : (
            campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <Button
                  variant={selectedCampaignId === campaign.id ? 'default' : 'outline'}
                  className={cn(
                    'group relative flex w-full flex-col items-start gap-2 border-l-4 px-6 py-6 text-left transition-all h-auto',
                    selectedCampaignId === campaign.id
                      ? 'border-synthwave-pink bg-synthwave-pink/10 text-white hover:bg-synthwave-pink/20'
                      : 'border-synthwave-purple bg-synthwave-dark/80 text-synthwave-cyan hover:border-synthwave-pink hover:bg-synthwave-purple/10 hover:text-white'
                  )}
                  onClick={() => {
                    setSelectedCampaignId(campaign.id)
                    window.setTimeout(async () => {
                      await coreClient.campaign.openCampaign({ id: campaign.id })
                      navigate('/')
                    }, 200)
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FolderOpen
                        className={cn(
                          'h-5 w-5 transition-colors',
                          selectedCampaignId === campaign.id
                            ? 'text-synthwave-pink'
                            : 'text-synthwave-cyan group-hover:text-synthwave-pink'
                        )}
                      />
                      <span className="retro-font text-xl">{campaign.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm opacity-70 pl-8">
                    <Calendar className="h-4 w-4" />
                    <span className="pixel-font">
                      {new Date(campaign.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {selectedCampaignId === campaign.id && (
                    <span className="absolute inset-0 blur-[20px] bg-synthwave-pink/20 opacity-70"></span>
                  )}
                </Button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
