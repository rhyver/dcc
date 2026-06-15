export type PageMeta = {
  title: string
  description: string
}

const HOME_META: PageMeta = {
  title: 'Digital Crew Chief - Dynamic campaigns for DCS World',
  description:
    'A dynamic campaign generator for DCS World. Spin up a persistent theatre, watch flight groups move in real time, and export a .miz you can fly - no config, no scripting.'
}

const PRIVACY_META: PageMeta = {
  title: 'Privacy Policy - Digital Crew Chief',
  description: 'Privacy policy for this open-source project website.'
}

export function normalizePathname(pathname = '/') {
  return pathname.replace(/\/+$/, '') || '/'
}

export function getPageMeta(pathname = '/'): PageMeta {
  return normalizePathname(pathname) === '/privacy' ? PRIVACY_META : HOME_META
}
