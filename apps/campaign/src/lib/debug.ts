import { featureFlags } from './feature-flags'

export function debugLog(...data: unknown[]) {
  if (featureFlags.debugLogging) {
    console.log(...data)
  }
}
