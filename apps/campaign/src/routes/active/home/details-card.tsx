import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction
} from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { X, User } from 'lucide-react'
import { useSelector } from '@xstate/store/react'
import { activeStore } from '@/stores/active'
import { calculateResourceGainPerLogicTick } from '@/logic/systems/update-resources'
import { type SelectedItem } from './map'

function formatInGameClock(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).format(date)
}

export function DetailsCard({
  selectedItem,
  onClose,
  onSelectObjective
}: {
  selectedItem: SelectedItem
  onClose: () => void
  onSelectObjective?: (objectiveName: string) => void
}) {
  const campaign = useSelector(activeStore, (state) => state.context)

  if (!selectedItem) return null

  const objectiveName =
    'objectiveId' in selectedItem && typeof selectedItem.objectiveId === 'string'
      ? selectedItem.objectiveId
      : 'target' in selectedItem &&
          selectedItem.target != null &&
          typeof selectedItem.target.objectiveId === 'string'
        ? selectedItem.target.objectiveId
        : null

  const defaultTitle =
    'callsign' in selectedItem
      ? selectedItem.callsign
      : 'name' in selectedItem
        ? selectedItem.name
        : `Ground Group ${selectedItem.id.slice(0, 8)}`
  const defaultSubtitle = `${'coalition' in selectedItem ? selectedItem.coalition : 'player'} ${
    'type' in selectedItem
      ? String(selectedItem.type)
      : 'callsign' in selectedItem
        ? 'Flight Group'
        : 'Objective'
  }`
  const isObjectiveLinkedItem =
    'type' in selectedItem &&
    (selectedItem.type === 'Structure' ||
      selectedItem.type === 'SAM' ||
      selectedItem.type === 'Ground Group')
  const headerTitle = isObjectiveLinkedItem && objectiveName != null ? objectiveName : defaultTitle
  const headerSubtitle = isObjectiveLinkedItem
    ? selectedItem.type === 'Ground Group'
      ? selectedItem.groundGroupType
      : selectedItem.name
    : defaultSubtitle
  const resourceAmount =
    'resources' in selectedItem && selectedItem.resources != null
      ? Math.floor(selectedItem.resources as number)
      : null
  const spawnCostAmount =
    'spawnCost' in selectedItem && selectedItem.spawnCost != null
      ? Math.floor(selectedItem.spawnCost as number)
      : null
  const hasSpawnProgress = resourceAmount != null && spawnCostAmount != null && spawnCostAmount > 0
  const spawnProgressPercent = hasSpawnProgress
    ? Math.min(100, Math.max(0, (resourceAmount / spawnCostAmount) * 100))
    : 0
  const remainingToSpawn = hasSpawnProgress ? Math.max(0, spawnCostAmount - resourceAmount) : null

  const selectedGroundGroup = (() => {
    const id = selectedItem.id
    return (
      campaign.coalitions.player.groundGroups.find((g) => g.id === id) ??
      campaign.coalitions.opponent.groundGroups.find((g) => g.id === id) ??
      null
    )
  })()

  const selectedStructure =
    'type' in selectedItem && selectedItem.type === 'Structure'
      ? campaign.coalitions[selectedItem.coalition].structures.find(
          (structure) => structure.id === selectedItem.id
        ) ?? null
      : null
  const selectedStructureCoalition =
    'type' in selectedItem && selectedItem.type === 'Structure' ? selectedItem.coalition : null

  const gainPerInGameSecond =
    selectedStructure != null && selectedStructureCoalition != null
      ? calculateResourceGainPerLogicTick(
          selectedStructure,
          campaign.coalitions[selectedStructureCoalition].structures,
          1
        )
      : 0

  const estimatedSpawnInGameSeconds =
    remainingToSpawn != null && remainingToSpawn > 0 && gainPerInGameSecond > 0
      ? remainingToSpawn / gainPerInGameSecond
      : null

  const spawnEtaLabel =
    remainingToSpawn == null
      ? null
      : remainingToSpawn <= 0
        ? formatInGameClock(new Date(campaign.time))
        : estimatedSpawnInGameSeconds == null
          ? '--:--'
          : formatInGameClock(
              new Date(new Date(campaign.time).getTime() + estimatedSpawnInGameSeconds * 1000)
            )

  return (
    <div className="absolute top-4 right-4 w-80 z-[1100]">
      <Card className="backdrop-blur-md bg-synthwave-dark/80 border-synthwave-pink/30 text-synthwave-light shadow-[0_0_15px_rgba(255,0,170,0.3)]">
        <CardHeader>
          <CardTitle className="text-synthwave-cyan retro-font">{headerTitle}</CardTitle>
          <CardDescription className="text-secondary">{headerSubtitle}</CardDescription>
          <CardAction>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-synthwave-pink hover:bg-synthwave-pink/20 hover:text-synthwave-pink"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {'structureType' in selectedItem && (
              <>
                <div className="text-secondary/70">Structure Type</div>
                <div>{String(selectedItem.structureType)}</div>
              </>
            )}
            {'resources' in selectedItem && selectedItem.resources != null && (
              <>
                <div className="text-secondary/70">Resources</div>
                <div>{resourceAmount}</div>
              </>
            )}
            {'spawnCost' in selectedItem && selectedItem.spawnCost != null && (
              <>
                <div className="text-secondary/70">Needed to Spawn</div>
                <div>{spawnCostAmount}</div>
              </>
            )}
            {hasSpawnProgress && (
              <div className="col-span-2 mt-1">
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-secondary/70">
                  <span>Spawn Progress</span>
                  <span>{Math.round(spawnProgressPercent)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-synthwave-pink/15 ring-1 ring-synthwave-pink/20">
                  <div
                    className="h-full bg-linear-to-r from-synthwave-cyan to-synthwave-pink transition-[width] duration-300"
                    style={{ width: `${spawnProgressPercent}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-secondary/70">
                  <span>Est. Spawn Time</span>
                  <span>{spawnEtaLabel}</span>
                </div>
              </div>
            )}
            {objectiveName != null && (
              <>
                <div className="text-secondary/70">Objective</div>
                <div
                  className="cursor-pointer hover:text-synthwave-cyan transition-colors"
                  onClick={() => onSelectObjective?.(objectiveName)}
                >
                  {objectiveName}
                </div>
              </>
            )}
            {selectedGroundGroup && (
              <>
                <div className="text-secondary/70">Status</div>
                <div
                  className={
                    selectedGroundGroup.state === 'combat'
                      ? 'text-red-400'
                      : selectedGroundGroup.state === 'moving'
                        ? 'text-yellow-400'
                        : 'text-green-400'
                  }
                >
                  {selectedGroundGroup.state.charAt(0).toUpperCase() +
                    selectedGroundGroup.state.slice(1)}
                </div>
                {selectedGroundGroup.targetObjectiveId && (
                  <>
                    <div className="text-secondary/70">Target</div>
                    <div
                      className="cursor-pointer hover:text-synthwave-cyan transition-colors"
                      onClick={() => onSelectObjective?.(selectedGroundGroup.targetObjectiveId!)}
                    >
                      {selectedGroundGroup.targetObjectiveId}
                    </div>
                  </>
                )}
                <div className="col-span-2 mt-2">
                  <div className="text-secondary/70 text-xs uppercase tracking-wide mb-1">
                    Units ({selectedGroundGroup.units.reduce((sum, u) => sum + u.count, 0)})
                  </div>
                  <div className="space-y-1">
                    {selectedGroundGroup.units.map((unit) => (
                      <div
                        key={unit.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="truncate mr-2">{unit.name}</span>
                        <span className="text-secondary/70 shrink-0">x{unit.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            {'flightplan' in selectedItem && (
              <>
                <div className="text-secondary/70">Task</div>
                <div>{(selectedItem as { task: string }).task}</div>
                <div className="text-secondary/70">Waypoints</div>
                <div>{selectedItem.flightplan.waypoints.length}</div>
                {'aircrafts' in selectedItem && (
                  <>
                    <div className="text-secondary/70 flex items-center gap-2">
                      Clients
                      <User className="h-3 w-3" />
                    </div>
                    <div>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        value={selectedItem.aircrafts.filter((a) => a.client).length.toString()}
                        onValueChange={(val) => {
                          if (!val) return
                          activeStore.send({
                            type: 'setFlightGroupClientCount',
                            flightGroupId: selectedItem.id,
                            count: parseInt(val)
                          })
                        }}
                      >
                        {Array.from({ length: selectedItem.aircrafts.length + 1 }).map((_, i) => (
                          <ToggleGroupItem
                            key={i}
                            value={i.toString()}
                            className="h-6 w-6 p-0 text-xs"
                          >
                            {i}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                  </>
                )}
              </>
            )}
            {'range' in selectedItem && typeof selectedItem.range === 'number' && (
              <>
                <div className="text-secondary/70">Range</div>
                <div>{(selectedItem.range / 1000).toFixed(1)} km</div>
                <div className="text-secondary/70">Status</div>
                <div
                  className={
                    (selectedItem as unknown as { active: boolean }).active
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                >
                  {(selectedItem as unknown as { active: boolean }).active ? 'Active' : 'Inactive'}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
