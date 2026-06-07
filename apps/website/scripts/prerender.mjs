import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const templatePath = resolve(root, 'dist/index.html')
const serverEntryPath = resolve(root, 'dist/server/entry-server.js')

const template = await readFile(templatePath, 'utf8')
const { getPageMeta, render } = await import(pathToFileURL(serverEntryPath).href)

const routes = [
  { pathname: '/', outputPath: templatePath },
  { pathname: '/privacy', outputPath: resolve(root, 'dist/privacy/index.html') }
]

for (const route of routes) {
  const meta = getPageMeta(route.pathname)
  const appHtml = render(route.pathname)
  const html = template
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
    .replace(
      /<title>.*?<\/title>/,
      `<title>${escapeHtml(meta.title)}</title>`
    )
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escapeHtml(meta.description)}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${escapeHtml(meta.title)}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${escapeHtml(meta.description)}" />`
    )

  await mkdir(dirname(route.outputPath), { recursive: true })
  await writeFile(route.outputPath, html)
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
