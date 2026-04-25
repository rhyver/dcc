#!/usr/bin/env bun
import { $ } from 'bun'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const OWNER = 'rhyver'
const REPO = 'dcc'
const API = `https://codeberg.org/api/v1/repos/${OWNER}/${REPO}`
const REPO_URL = `https://codeberg.org/${OWNER}/${REPO}.git`
const LATEST_TAG = 'dcc-latest'

const argv = process.argv.slice(2)
const skipPublish = argv.includes('--no-publish')
const resume = argv.includes('--resume')
const manualVersion = argv.find((a) => !a.startsWith('--'))
const KNOWN_FLAGS = new Set(['--no-publish', '--resume'])

if (argv.some((a) => a.startsWith('--') && !KNOWN_FLAGS.has(a))) {
  console.error('usage: bun run release [version] [--no-publish] [--resume]')
  console.error('       version    optional manual override (e.g. 0.5.0-2026041901 or 0.6.0)')
  console.error('                  if omitted, derived as <base>-YYYYMMDDNN from package.json + today')
  console.error('       --resume   skip bump/build/commit/tag; push and publish the version')
  console.error('                  already in package.json (use after a failed publish)')
  console.error('       CODEBERG_TOKEN=<token> required unless --no-publish')
  process.exit(1)
}

if (resume && manualVersion) {
  console.error('error: --resume cannot be combined with a manual version')
  process.exit(1)
}

if (manualVersion && !/^\d+\.\d+\.\d+(-[A-Za-z0-9.]+)?$/.test(manualVersion)) {
  console.error(`error: manual version '${manualVersion}' is not valid semver`)
  process.exit(1)
}

const token = process.env.CODEBERG_TOKEN

if (!skipPublish && !token) {
  console.error('error: CODEBERG_TOKEN env var required (or pass --no-publish)')
  console.error('       create one at https://codeberg.org/user/settings/applications')
  console.error('       scope needed: write:repository')
  process.exit(1)
}

const repoRoot = (await $`git rev-parse --show-toplevel`.text()).trim()
process.chdir(repoRoot)

const dirty = (await $`git status --porcelain`.text()).trim()
if (dirty) {
  console.error('error: working tree dirty — commit or stash first')
  console.error(dirty)
  process.exit(1)
}

const branch = (await $`git rev-parse --abbrev-ref HEAD`.text()).trim()
if (branch !== 'main') {
  console.warn(`warning: releasing from '${branch}' (not main)`)
}

console.log('==> fetching tags from origin')
if (token) {
  await $`git -c http.extraheader=${`Authorization: token ${token}`} fetch --tags --quiet`.nothrow()
} else {
  await $`git fetch --tags --quiet`.nothrow()
}

let version: string
if (resume) {
  const rootPkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }
  version = rootPkg.version
  console.log(`==> resuming release of ${version} from package.json`)
  const localTag = await $`git rev-parse v${version}`.quiet().nothrow()
  if (localTag.exitCode !== 0) {
    console.error(`error: tag v${version} not found locally — nothing to resume`)
    process.exit(1)
  }
} else if (manualVersion) {
  version = manualVersion
  console.log(`==> using manual version ${version}`)
} else {
  const rootPkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }
  const base = rootPkg.version.replace(/-\d{10,}$/, '')
  if (!/^\d+\.\d+\.\d+$/.test(base)) {
    console.error(`error: cannot derive base version from '${rootPkg.version}' in package.json`)
    console.error('       expected MAJOR.MINOR.PATCH (optionally followed by -YYYYMMDDNN)')
    process.exit(1)
  }

  const now = new Date()
  const dateStr =
    String(now.getFullYear()) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')

  const tagPrefix = `v${base}-${dateStr}`
  const tagPattern = new RegExp(`^${tagPrefix.replace(/\./g, '\\.')}(\\d{2})$`)
  const existingNums = (await $`git tag --list ${`${tagPrefix}*`}`.text())
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => tagPattern.exec(t)?.[1])
    .filter((n): n is string => n != null)
    .map((n) => parseInt(n, 10))

  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1
  if (nextNum > 99) {
    console.error(`error: per-day counter exceeded 99 for ${dateStr} — pick a new base version`)
    process.exit(1)
  }
  version = `${base}-${dateStr}${String(nextNum).padStart(2, '0')}`
  console.log(`==> derived version ${version}`)
}

const tag = `v${version}`

if (!resume) {
  const tagCheck = await $`git rev-parse ${tag}`.quiet().nothrow()
  if (tagCheck.exitCode === 0) {
    console.error(`error: tag ${tag} already exists locally`)
    process.exit(1)
  }

  function bump(path: string): void {
    const pkg = JSON.parse(readFileSync(path, 'utf8'))
    pkg.version = version
    writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n')
  }

  console.log(`==> bumping version to ${version}`)
  bump('package.json')
  bump('apps/core/package.json')

  console.log('==> refreshing lockfile')
  await $`bun install`

  console.log('==> building Windows installer')
  await $`bun run build:win`
}

const installer = `dist/dcc-${version}-setup.exe`
const blockmap = `dist/dcc-${version}-setup.exe.blockmap`
const manifest = `dist/latest.yml`
const artifacts = [installer, blockmap, manifest]

console.log('==> verifying artifacts')
const missing = artifacts.filter((f) => !existsSync(f))
if (missing.length > 0) {
  console.error('error: missing artifacts:')
  for (const f of missing) console.error(`  - ${f}`)
  process.exit(1)
}
for (const f of artifacts) console.log(`    ok: ${f}`)

const manifestText = readFileSync(manifest, 'utf8')
if (!manifestText.includes(`version: ${version}`)) {
  console.error(`error: ${manifest} does not reference version ${version}`)
  process.exit(1)
}

if (!resume) {
  console.log('==> committing and tagging')
  await $`git add package.json apps/core/package.json bun.lock`
  await $`git commit -m ${`Release ${tag}`}`
  await $`git tag -a ${tag} -m ${`Release ${tag}`}`
}

console.log(`==> pushing commit and tag to ${REPO_URL}`)
if (token) {
  await $`git -c http.extraheader=${`Authorization: token ${token}`} push --follow-tags ${REPO_URL} HEAD:${branch}`
} else {
  await $`git push --follow-tags ${REPO_URL} HEAD:${branch}`
}

if (skipPublish) {
  console.log('')
  console.log(`Skipping Codeberg publish (--no-publish). Upload manually at:`)
  console.log(`  https://codeberg.org/${OWNER}/${REPO}/releases/new?tag=${tag}`)
  console.log('Files to attach:')
  for (const f of artifacts) console.log(`  - ${f}`)
  process.exit(0)
}

const baseHeaders = {
  Authorization: `token ${token}`,
  Accept: 'application/json',
  'User-Agent': `dcc-release-script (${OWNER}/${REPO})`
}

type Release = { id: number; html_url: string }
type Asset = { id: number; name: string }

async function describe(res: Response): Promise<string> {
  let body = ''
  try {
    body = await res.text()
  } catch {
    // ignore
  }
  return `${res.status} ${res.statusText} ${body}`.trim()
}

async function createRelease(
  payload: Record<string, unknown>,
  label: string
): Promise<Release> {
  const delaysMs = [3000, 6000, 12000]
  let lastError = ''
  for (let attempt = 0; attempt <= delaysMs.length; attempt++) {
    const res = await fetch(`${API}/releases`, {
      method: 'POST',
      headers: { ...baseHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) return (await res.json()) as Release
    lastError = await describe(res)
    if (res.status < 500 || attempt === delaysMs.length) break
    const wait = delaysMs[attempt]
    console.log(`    ${label} create returned ${res.status}, retrying in ${wait / 1000}s...`)
    await new Promise((r) => setTimeout(r, wait))
  }
  throw new Error(lastError)
}

console.log('==> looking up Codeberg release')
let release: Release
const existingRes = await fetch(`${API}/releases/tags/${encodeURIComponent(tag)}`, {
  headers: baseHeaders
})
if (existingRes.ok) {
  release = (await existingRes.json()) as Release
  console.log(`    reusing existing release id ${release.id}`)
} else if (existingRes.status === 404) {
  console.log('==> creating Codeberg release')
  try {
    release = await createRelease(
      {
        tag_name: tag,
        target_commitish: branch,
        name: tag,
        body: `Release ${tag}`,
        draft: false,
        prerelease: true
      },
      tag
    )
  } catch (err) {
    console.error(`error: create release failed: ${(err as Error).message}`)
    console.error(`       tag is already pushed; retry with: bun run release --resume`)
    process.exit(1)
  }
  console.log(`    release id: ${release.id}`)
} else {
  console.error(`error: lookup release failed: ${await describe(existingRes)}`)
  process.exit(1)
}

const assetsRes = await fetch(`${API}/releases/${release.id}/assets`, { headers: baseHeaders })
const existingAssets = assetsRes.ok ? ((await assetsRes.json()) as Asset[]) : []
const existingNames = new Set(existingAssets.map((a) => a.name))

for (const path of artifacts) {
  const name = path.split('/').pop()!
  if (existingNames.has(name)) {
    console.log(`==> skipping ${name} (already uploaded)`)
    continue
  }
  console.log(`==> uploading ${name}`)
  const form = new FormData()
  form.append('attachment', Bun.file(path), name)
  const uploadRes = await fetch(
    `${API}/releases/${release.id}/assets?name=${encodeURIComponent(name)}`,
    {
      method: 'POST',
      headers: baseHeaders,
      body: form
    }
  )
  if (!uploadRes.ok) {
    console.error(`error: upload ${name} failed: ${await describe(uploadRes)}`)
    console.error(`release exists but is incomplete — retry with: bun run release --resume`)
    console.error(`or finish manually at ${release.html_url}`)
    process.exit(1)
  }
}

console.log(`==> mirroring assets to ${LATEST_TAG}`)
const headCommit = (await $`git rev-parse HEAD`.text()).trim()

const oldLatestRes = await fetch(`${API}/releases/tags/${encodeURIComponent(LATEST_TAG)}`, {
  headers: baseHeaders
})
if (oldLatestRes.ok) {
  const old = (await oldLatestRes.json()) as Release
  console.log(`    deleting previous ${LATEST_TAG} release (id ${old.id})`)
  const delRes = await fetch(`${API}/releases/${old.id}`, {
    method: 'DELETE',
    headers: baseHeaders
  })
  if (!delRes.ok && delRes.status !== 404) {
    console.error(`error: delete previous ${LATEST_TAG} failed: ${await describe(delRes)}`)
    process.exit(1)
  }
} else if (oldLatestRes.status !== 404) {
  console.error(`error: lookup ${LATEST_TAG} failed: ${await describe(oldLatestRes)}`)
  process.exit(1)
}

console.log(`    moving ${LATEST_TAG} tag to ${headCommit.slice(0, 7)}`)
await $`git tag -f ${LATEST_TAG} ${headCommit}`
if (token) {
  await $`git -c http.extraheader=${`Authorization: token ${token}`} push --force ${REPO_URL} ${LATEST_TAG}`
} else {
  await $`git push --force ${REPO_URL} ${LATEST_TAG}`
}

console.log(`    creating ${LATEST_TAG} release`)
let latestRelease: Release
try {
  latestRelease = await createRelease(
    {
      tag_name: LATEST_TAG,
      target_commitish: headCommit,
      name: `Auto-update channel (${version})`,
      body: `Stable URL for the auto-updater. Mirrors assets from [${tag}](https://codeberg.org/${OWNER}/${REPO}/releases/tag/${tag}).`,
      draft: false,
      prerelease: true
    },
    LATEST_TAG
  )
} catch (err) {
  console.error(`error: create ${LATEST_TAG} failed: ${(err as Error).message}`)
  console.error(`       retry with: bun run release --resume`)
  process.exit(1)
}

for (const path of artifacts) {
  const name = path.split('/').pop()!
  console.log(`    uploading ${name} to ${LATEST_TAG}`)
  const form = new FormData()
  form.append('attachment', Bun.file(path), name)
  const uploadRes = await fetch(
    `${API}/releases/${latestRelease.id}/assets?name=${encodeURIComponent(name)}`,
    { method: 'POST', headers: baseHeaders, body: form }
  )
  if (!uploadRes.ok) {
    console.error(`error: upload ${name} to ${LATEST_TAG} failed: ${await describe(uploadRes)}`)
    console.error(`mirror is incomplete — retry with: bun run release --resume`)
    console.error(`or finish manually at ${latestRelease.html_url}`)
    process.exit(1)
  }
}

console.log('')
console.log(`Released ${tag} -> ${release.html_url}`)
console.log(`Auto-update channel -> ${latestRelease.html_url}`)
