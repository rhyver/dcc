import { existsSync } from 'node:fs'
import { mkdir, readdir, rm, unlink } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

const bbox = '40.130612,40.747635,44.435577,44.169509'
const maxZoom = process.env.MAP_CACHE_MAX_ZOOM ?? '12'
const worldMaxZoom = process.env.MAP_CACHE_WORLD_MAX_ZOOM ?? '5'
const mapsRoot = join(import.meta.dirname, '..', 'public', 'maps')
const caucasusOutputPath = join(mapsRoot, 'caucasus', 'caucasus.pmtiles')
const worldOutputPath = join(mapsRoot, 'world-low.pmtiles')
const fontsRoot = join(import.meta.dirname, '..', 'public', 'maps', 'fonts')
const cliRoot = join(import.meta.dirname, '..', '.cache', 'pmtiles-cli')
const fontStacks = ['Noto Sans Regular', 'Noto Sans Medium', 'Noto Sans Italic']
const fontRanges = ['0-255']

type GitHubAsset = {
  name: string
  browser_download_url: string
}

type GitHubRelease = {
  assets: GitHubAsset[]
}

type ProtomapsBuild = {
  key: string
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

function getAssetPattern() {
  const arch = process.arch === 'arm64' ? 'arm64' : 'x86_64'
  if (process.platform === 'win32') return { os: 'Windows', arch, extension: '.zip' }
  if (process.platform === 'darwin') return { os: 'Darwin', arch, extension: '.zip' }
  return { os: 'Linux', arch, extension: '.tar.gz' }
}

async function run(command: string, args: string[]) {
  const proc = Bun.spawn([command, ...args], { stdout: 'inherit', stderr: 'inherit' })
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${exitCode}`)
  }
}

async function findPmtilesExecutable(dir: string): Promise<string | null> {
  if (!existsSync(dir)) return null
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  const executableName = process.platform === 'win32' ? 'pmtiles.exe' : 'pmtiles'
  for (const entry of entries) {
    if (entry.isFile() && entry.name === executableName) {
      return join(entry.parentPath, entry.name)
    }
  }
  return null
}

async function downloadPmtilesCli() {
  const existing = await findPmtilesExecutable(cliRoot)
  if (existing) return existing

  const release = await fetchJson<GitHubRelease>(
    'https://api.github.com/repos/protomaps/go-pmtiles/releases/latest'
  )
  const { os, arch, extension } = getAssetPattern()
  const asset = release.assets.find(
    (candidate) =>
      candidate.name.includes(os) &&
      candidate.name.includes(arch) &&
      candidate.name.endsWith(extension)
  )

  if (!asset) {
    throw new Error(`Could not find a PMTiles CLI release asset for ${os} ${arch}`)
  }

  await rm(cliRoot, { recursive: true, force: true })
  await mkdir(cliRoot, { recursive: true })

  const archivePath = join(cliRoot, basename(asset.name))
  const response = await fetch(asset.browser_download_url)
  if (!response.ok) {
    throw new Error(`Failed to download ${asset.browser_download_url}: ${response.status}`)
  }
  await Bun.write(archivePath, await response.arrayBuffer())

  if (archivePath.endsWith('.zip')) {
    if (process.platform === 'win32') {
      await run('powershell.exe', [
        '-NoProfile',
        '-Command',
        `Expand-Archive -LiteralPath '${archivePath}' -DestinationPath '${cliRoot}' -Force`
      ])
    } else {
      await run('unzip', ['-o', archivePath, '-d', cliRoot])
    }
  } else {
    await run('tar', ['-xzf', archivePath, '-C', cliRoot])
  }

  const extracted = await findPmtilesExecutable(cliRoot)
  if (!extracted) {
    throw new Error(`Downloaded ${asset.name}, but could not find the pmtiles executable inside it`)
  }
  return extracted
}

async function getLatestBuildUrl() {
  const builds = await fetchJson<ProtomapsBuild[]>('https://build-metadata.protomaps.dev/builds.json')
  const latest = builds
    .filter((build) => build.key.endsWith('.pmtiles'))
    .sort((a, b) => b.key.localeCompare(a.key))[0]

  if (!latest) {
    throw new Error('No Protomaps basemap build found')
  }

  return `https://build.protomaps.com/${latest.key}`
}

async function cacheGlyphs() {
  let downloaded = 0
  let cached = 0

  for (const fontStack of fontStacks) {
    for (const range of fontRanges) {
      const output = join(fontsRoot, fontStack, `${range}.pbf`)
      if (existsSync(output)) {
        cached += 1
        continue
      }

      const url = `https://protomaps.github.io/basemaps-assets/fonts/${encodeURIComponent(fontStack)}/${range}.pbf`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download glyphs ${fontStack}/${range}: ${response.status}`)
      }

      await mkdir(dirname(output), { recursive: true })
      await Bun.write(output, await response.arrayBuffer())
      downloaded += 1
    }
  }

  console.log(`Glyph cache ready: ${downloaded} downloaded, ${cached} already cached.`)
}

async function removeFile(path: string) {
  await unlink(path).catch((error: unknown) => {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return
    throw error
  })
}

await mkdir(dirname(caucasusOutputPath), { recursive: true })
await mkdir(dirname(worldOutputPath), { recursive: true })
await removeFile(caucasusOutputPath)
await removeFile(worldOutputPath)

const pmtiles = await downloadPmtilesCli()
const sourceUrl = process.env.PROTOMAPS_SOURCE_URL ?? (await getLatestBuildUrl())

await run(pmtiles, ['extract', sourceUrl, worldOutputPath, `--maxzoom=${worldMaxZoom}`])
await run(pmtiles, [
  'extract',
  sourceUrl,
  caucasusOutputPath,
  `--bbox=${bbox}`,
  `--maxzoom=${maxZoom}`
])
await cacheGlyphs()

console.log(`World low-zoom PMTiles cache ready: ${worldOutputPath}`)
console.log(`Caucasus PMTiles cache ready: ${caucasusOutputPath}`)
