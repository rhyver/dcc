import { schemas } from '@dcc/contracts'
import * as z from 'zod'

type Connection = z.infer<typeof schemas.objectiveConnection>

function road(from: string, to: string, waypoints: Connection['waypoints'] = []): Connection {
  return { from, to, mode: 'road', bidirectional: true, waypoints }
}

function sea(from: string, to: string, waypoints: Connection['waypoints'] = []): Connection {
  return { from, to, mode: 'sea', bidirectional: true, waypoints }
}

export const connections: Connection[] = [
  road('San Carlos', 'Ajax Bay'),
  road('Ajax Bay', 'Port San Carlos', [{ x: 101_115, y: 13_007 }]),
  road('Port San Carlos', 'Douglas Settlement', [{ x: 110_271, y: 22_657 }]),
  road('Port San Carlos', 'Little Creek'),
  road('Little Creek', 'Cape Dolphin'),
  road('Douglas Settlement', 'Evelyn Station Farm', [{ x: 110_094, y: 38_479 }]),
  road('Douglas Settlement', 'Port Louis'),
  road('Port Louis', "Johnson's Harbour"),
  road("Johnson's Harbour", 'Volunteer Point'),
  road('Evelyn Station Farm', 'Port Louis'),
  road('Douglas Settlement', 'Mount Usborne'),
  road('Mount Usborne', 'Darwin'),
  road('San Carlos', 'Darwin', [
    { x: 91_783, y: 10_276 },
    { x: 83_690, y: 12_422 }
  ]),
  road('Darwin', 'Goose Green', [{ x: 74_854, y: 11_725 }]),
  road('Goose Green', "L'Antioja", [
    { x: 73_963, y: 22_692 },
    { x: 72_483, y: 31_985 }
  ]),
  road("L'Antioja", 'Swan Inlet'),
  road('Swan Inlet', 'Fitzroy', [{ x: 73_614, y: 53_622 }]),
  road('Goose Green', 'North Arm'),
  road('North Arm', 'Bull Point'),
  road('Fitzroy', 'Bluff Cove', [{ x: 79_272, y: 64_495 }]),
  road('Bluff Cove', 'Mount Challenger', [{ x: 83_518, y: 69_095 }]),
  road('Mount Challenger', 'Mount Kent'),
  road('Evelyn Station Farm', 'Estancia House', [
    { x: 105_425, y: 44_566 },
    { x: 99_062, y: 53_479 },
    { x: 92_755, y: 61_554 }
  ]),
  road('Estancia House', 'Mount Kent'),
  road('Mount Kent', 'Two Sisters', [{ x: 89_026, y: 71_428 }]),
  road('Mount Kent', 'Mount Longdon', [{ x: 91_586, y: 70_854 }]),
  road('Two Sisters', 'Mount Tumbledown', [
    { x: 87_117, y: 73_307 },
    { x: 85_669, y: 75_643 }
  ]),
  road('Two Sisters', 'Mount Harriet'),
  road('Mount Harriet', 'Port Harriet'),
  road('Port Harriet', 'Port Stanley'),
  road('Mount Harriet', 'Sapper Hill'),
  road('Mount Tumbledown', 'Sapper Hill'),
  road('Sapper Hill', 'Port Stanley'),
  road('Mount Longdon', 'Wireless Ridge', [
    { x: 90_305, y: 73_445 },
    { x: 89_779, y: 77_901 }
  ]),
  road('Wireless Ridge', 'Murrell Farm'),
  road('Murrell Farm', 'Moody Brook'),
  road('Moody Brook', 'Port Stanley'),
  road('Port Stanley', 'Stanley Airport', [{ x: 87_836, y: 90_519 }]),
  road('Fox Bay', 'Chartres'),
  road('Fox Bay', 'Port Edgar'),
  road('Port Edgar', 'Port Stephens'),
  road('Chartres', 'Port Howard'),
  road('Fox Bay', 'Port Howard', [
    { x: 63_643, y: -57_785 },
    { x: 72_443, y: -56_817 },
    { x: 89_949, y: -53_292 },
    { x: 101_986, y: -38_205 }
  ]),
  road('Port Howard', 'Warrah River'),
  road('Warrah River', 'Shallow Bay'),
  road('Shallow Bay', 'Hill Cove'),
  road('Hill Cove', 'Roy Cove'),
  road('Roy Cove', 'Port Stephens'),
  sea('Warrah River', 'Pebble Island'),
  sea('Port Howard', 'San Carlos', [
    { x: 95_964, y: -18_911 },
    { x: 97_207, y: -10_284 },
    { x: 98_450, y: -1_657 }
  ])
]
