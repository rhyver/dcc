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

const DOCS_META: PageMeta = {
  title: 'Docs - Digital Crew Chief',
  description:
    'Documentation for Digital Crew Chief campaign workflows, mission generation, and developer setup.'
}

const CHANGELOG_META: PageMeta = {
  title: 'Changelog - Digital Crew Chief',
  description: 'Release notes and alpha changelog for Digital Crew Chief.'
}

export function normalizePathname(pathname = '/') {
  return pathname.replace(/\/+$/, '') || '/'
}

export function getPageMeta(pathname = '/'): PageMeta {
  switch (normalizePathname(pathname)) {
    case '/privacy':
      return PRIVACY_META
    case '/docs':
      return DOCS_META
    case '/changelog':
      return CHANGELOG_META
    default:
      return HOME_META
  }
}
