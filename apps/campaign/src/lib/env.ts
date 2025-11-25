export const isElectron =
  typeof window !== 'undefined' && window.postMessage && typeof window.electron !== 'undefined'
