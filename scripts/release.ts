#!/usr/bin/env bun
import { $ } from 'bun'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const OWNER = 'rhyver'
const REPO = 'dcc'
const API = `https://codeberg.org/api/v1/repos/${OWNER}/${REPO}`

const argv = process.argv.slice(2)
const skipPublish = argv.includes('--no-publish')
const manualVersion = argv.find((a) => !a.startsWith('--'))

if (argv.some((a) => a !== '--no-publish' && a.startsWith('--'))) {
  console.error('usage: bun run release [version] [--no-publish]')
  console.error('       version  optional manual override (e.g. 0.5.0-2026041901 or 0.6.0)')
  console.error('                if omitted, derived as <base>-YYYYMMDDNN from package.json + today')
  console.error('       CODEBERG_TOKEN=<token> required unless --no-publish')
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
await $`git fetch --tags --quiet`.nothrow()

let version: string
if (manualVersion) {
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

console.log('==> committing and tagging')
await $`git add package.json apps/core/package.json bun.lock`
await $`git commit -m ${`Release ${tag}`}`
await $`git tag -a ${tag} -m ${`Release ${tag}`}`

console.log('==> pushing commit and tag')
await $`git push --follow-tags`

if (skipPublish) {
  console.log('')
  console.log(`Skipping Codeberg publish (--no-publish). Upload manually at:`)
  console.log(`  https://codeberg.org/${OWNER}/${REPO}/releases/new?tag=${tag}`)
  console.log('Files to attach:')
  for (const f of artifacts) console.log(`  - ${f}`)
  process.exit(0)
}

console.log('==> creating Codeberg release')
const createRes = await fetch(`${API}/releases`, {
  method: 'POST',
  headers: {
    Authorization: `token ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tag_name: tag,
    name: tag,
    body: `Release ${tag}`,
    draft: false,
    prerelease: false
  })
})
if (!createRes.ok) {
  console.error(`error: create release failed: ${createRes.status} ${await createRes.text()}`)
  process.exit(1)
}
const release = (await createRes.json()) as { id: number; html_url: string }
console.log(`    release id: ${release.id}`)

for (const path of artifacts) {
  const name = path.split('/').pop()!
  console.log(`==> uploading ${name}`)
  const form = new FormData()
  form.append('attachment', Bun.file(path), name)
  const uploadRes = await fetch(
    `${API}/releases/${release.id}/assets?name=${encodeURIComponent(name)}`,
    {
      method: 'POST',
      headers: { Authorization: `token ${token}` },
      body: form
    }
  )
  if (!uploadRes.ok) {
    console.error(`error: upload ${name} failed: ${uploadRes.status} ${await uploadRes.text()}`)
    console.error(`release was created but is incomplete — finish manually at ${release.html_url}`)
    process.exit(1)
  }
}

console.log('')
console.log(`Released ${tag} -> ${release.html_url}`)
