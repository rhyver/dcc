import { BookOpen, FolderOpen, LogOut, Settings } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

export function StartMenu() {
  const navigate = useNavigate()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-synthwave-dark">
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

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-start px-8">
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

        <motion.div
          className="absolute bottom-0 right-0 h-[450px] w-[360px]"
          style={{
            filter: 'drop-shadow(0 0 10px var(--synthwave-pink))'
          }}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 0.6 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
    </div>
  )
}
