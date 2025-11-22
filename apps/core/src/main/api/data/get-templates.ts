import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { templates } from '@dcc/data'

export function getTemplates(): z.infer<typeof schemas.template>[] {
  return templates
}
