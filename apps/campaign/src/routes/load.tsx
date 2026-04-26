import { ArrowLeft, Calendar, FolderOpen, Trash2, X, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { coreClient, orpc } from '@/lib/orpc'
import { useNavigate } from 'react-router'

export function Load() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [campaignsToDelete, setCampaignsToDelete] = useState<Set<string>>(new Set())

  const campaignsQuery = useQuery(orpc.campaign.listCampaigns.queryOptions({}))

  const deleteCampaign = useMutation({
    mutationFn: (id: string) => coreClient.campaign.deleteCampaign({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.campaign.listCampaigns.key() })
    }
  })

  const handleDeleteSelected = async () => {
    if (window.confirm(`Are you sure you want to delete ${campaignsToDelete.size} campaign(s)?`)) {
      await Promise.all(Array.from(campaignsToDelete).map((id) => deleteCampaign.mutateAsync(id)))
      setCampaignsToDelete(new Set())
      setIsDeleteMode(false)
    }
  }

  const toggleCampaignSelection = (id: string) => {
    const newSelection = new Set(campaignsToDelete)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setCampaignsToDelete(newSelection)
  }

  const campaigns = campaignsQuery.data ?? []

  return (
    <div className="relative flex min-h-full w-full bg-synthwave-dark">
      {/* Grid background */}
      <div className="fixed inset-0 z-0 bg-cover opacity-20" />

      {/* Synthwave sun/horizon effect */}
      <div className="fixed bottom-0 left-0 right-0 h-[40vh] bg-linear-to-t from-synthwave-pink via-synthwave-purple to-transparent opacity-30" />

      {/* Animated grid lines */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--synthwave-pink) 1px, transparent 1px), linear-gradient(to bottom, var(--synthwave-pink) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Content container */}
      <div className="relative z-10 m-auto flex w-full max-w-6xl flex-col items-start px-8 py-10">
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

        {/* Title and Actions */}
        <motion.div
          className="mb-8 flex w-full items-end justify-between"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col">
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
          </div>

          <div className="flex items-center gap-4">
            {isDeleteMode ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteMode(false)
                    setCampaignsToDelete(new Set())
                  }}
                  className="border-synthwave-purple bg-synthwave-dark/80 text-synthwave-cyan hover:border-synthwave-pink"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                {campaignsToDelete.size > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    className="bg-red-500/80 hover:bg-red-600 text-white border border-red-500"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({campaignsToDelete.size})
                  </Button>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsDeleteMode(true)}
                className="border-synthwave-purple bg-synthwave-dark/80 text-synthwave-cyan hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Mode
              </Button>
            )}
          </div>
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
            <AnimatePresence>
              {campaigns.map((campaign, index) => {
                const isSelectedForDeletion = campaignsToDelete.has(campaign.id)

                return (
                  <motion.div
                    key={campaign.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ height: 0, opacity: 0, margin: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <div
                      className={cn(
                        'group relative flex w-full flex-col items-start gap-2 border-l-4 px-6 py-6 text-left transition-all cursor-pointer',
                        // Base styles for unselected state (both normal and delete mode)
                        !isSelectedForDeletion &&
                          selectedCampaignId !== campaign.id &&
                          'border-synthwave-purple bg-synthwave-dark/80 text-synthwave-cyan hover:border-synthwave-pink hover:bg-synthwave-purple/10 hover:text-white',

                        // Active campaign selection
                        selectedCampaignId === campaign.id &&
                          !isDeleteMode &&
                          'border-synthwave-pink bg-synthwave-pink/10 text-white hover:bg-synthwave-pink/20',

                        // Delete mode selected state
                        isDeleteMode &&
                          isSelectedForDeletion &&
                          'border-red-500 bg-red-500/10 text-white'
                      )}
                      onClick={() => {
                        if (isDeleteMode) {
                          toggleCampaignSelection(campaign.id)
                        } else {
                          setSelectedCampaignId(campaign.id)
                          window.setTimeout(async () => {
                            try {
                              await coreClient.campaign.openCampaign({ id: campaign.id })
                              navigate('/')
                            } catch (error) {
                              console.error('Failed to open campaign:', error)
                              alert('Failed to open campaign. Please try again.')
                              setSelectedCampaignId(null)
                            }
                          }, 200)
                        }
                      }}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isDeleteMode ? (
                            <div
                              className={cn(
                                'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                                isSelectedForDeletion
                                  ? 'border-red-500 bg-red-500 text-white'
                                  : 'border-synthwave-cyan bg-transparent'
                              )}
                            >
                              {isSelectedForDeletion && <CheckCircle2 className="h-4 w-4" />}
                            </div>
                          ) : (
                            <FolderOpen
                              className={cn(
                                'h-5 w-5 transition-colors',
                                selectedCampaignId === campaign.id
                                  ? 'text-synthwave-pink'
                                  : 'text-synthwave-cyan group-hover:text-synthwave-pink'
                              )}
                            />
                          )}
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
                            minute: '2-digit',
                            timeZone: 'UTC'
                          })}
                        </span>
                      </div>
                      {selectedCampaignId === campaign.id && !isDeleteMode && (
                        <span className="absolute inset-0 blur-[20px] bg-synthwave-pink/20 opacity-70 pointer-events-none"></span>
                      )}
                      {isDeleteMode && isSelectedForDeletion && (
                        <span className="absolute inset-0 blur-[20px] bg-red-500/20 opacity-70 pointer-events-none"></span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
