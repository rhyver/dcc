import { Analytics } from '@vercel/analytics/react'
import { useEffect } from 'react'
import { ChangelogPage } from './components/changelog-page'
import { DocsPage } from './components/docs-page'
import { HomePage } from './components/home-page'
import { PrivacyPage } from './components/privacy-page'
import { getPageMeta, normalizePathname } from './meta'

export { getPageMeta } from './meta'

export function App({ pathname = globalThis.location?.pathname ?? '/' }: { pathname?: string }) {
  useEffect(() => {
    document.documentElement.dataset.density = 'default'
    const i = 1
    document.documentElement.style.setProperty('--bg-grid-opacity', (0.1 * i).toFixed(3))
    document.documentElement.style.setProperty('--bg-horizon-opacity', (0.7 * i).toFixed(3))
    document.documentElement.style.setProperty('--bg-sun-opacity', (0.9 * i).toFixed(3))
    document.documentElement.style.setProperty('--bg-persp-opacity', (0.35 * i).toFixed(3))
  }, [])

  useEffect(() => {
    const meta = getPageMeta(pathname)
    document.title = meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', meta.title)
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute('content', meta.description)
  }, [pathname])

  const normalizedPathname = normalizePathname(pathname)

  return (
    <>
      {normalizedPathname === '/privacy' ? (
        <PrivacyPage />
      ) : normalizedPathname === '/docs' ? (
        <DocsPage />
      ) : normalizedPathname === '/changelog' ? (
        <ChangelogPage />
      ) : (
        <HomePage />
      )}
      <Analytics />
    </>
  )
}
