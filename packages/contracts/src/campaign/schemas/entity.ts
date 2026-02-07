import * as z from 'zod'

export const entityTypeSchema = z.enum([
  'AirAssaultFlightGroup',
  'Aircraft',
  'Airdrome',
  'CapFlightGroup',
  'CasFlightGroup',
  'CsarFlightGroup',
  'DownedPilot',
  'DeadFlightGroup',
  'SeadFlightGroup',
  'EscortFlightGroup',
  'Farp',
  'GenericStructure',
  'GroundGroup',
  'GroundUnit',
  'Objective',
  'Package',
  'SAM',
  'StrikeFlightGroup',
  'Structure',
  'TransportFlightGroup',
  'UnitCamp',
  'Building',
  'Flightplan'
])
