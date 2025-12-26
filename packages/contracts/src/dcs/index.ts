import { aircraft } from './aircraft'
import { aircraftName } from './aircraft-name'
import { coalition } from './coalition'
import { l10n } from './l10n'
import { loadout } from './loadout'
import * as mission from './mission'
import { options } from './options'
import { warehouses, warehouseState } from './warehouses'

export const dcs = {
  aircraft,
  aircraftName,
  loadout,
  ...mission,
  options,
  warehouses,
  warehouseState,
  l10n,
  coalition
}
