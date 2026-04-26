import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export function dictionary(): z.infer<typeof schemas.dcs.l10n>['dictionary'] {
  return {
    DictKey_descriptionNeutralsTask_4: '',
    DictKey_sortie_5: '',
    DictKey_descriptionText_1: '',
    DictKey_descriptionBlueTask_3: '',
    DictKey_descriptionRedTask_2: '',
    DictKey_ActionText_6: 'Cargo delivered.'
  }
}

export function mapResource(): z.infer<typeof schemas.dcs.l10n>['mapResource'] {
  return {
    mist: 'mist.lua',
    state: 'state.lua',
    ctld: 'ctld.lua',
    splash_damage: 'splash_damage.lua'
  }
}
