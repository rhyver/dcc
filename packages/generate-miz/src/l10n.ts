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
    splash_damage: 'splash_damage.lua',
    cas: 'cas.lua',
    ewr: 'ewr.lua',
    ResKey_Action_7: 'splash_damage.lua',
    ResKey_Action_8: 'state.lua',
    ResKey_Action_10: 'mist.lua',
    ResKey_Action_16: 'cas.lua',
    ResKey_Action_17: 'ctld.lua',
    ResKey_Action_18: 'ewr.lua'
  }
}
