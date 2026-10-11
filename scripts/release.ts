#!/usr/bin/env bun
import { $ } from 'bun'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const REPO = 'rhyver/dcc'
const argv = process.argv.slice(2)
const publish = argv.includes('--publish')
const manualVersion = argv.find((arg) => !arg.startsWith('--'))

if (argv.some((arg) => arg.startsWith('--') && arg !== '--publish') || (publish && manualVersion)) {
  console.error('usage: bun run release [version] | bun run release --publish')
  console.error('Default: bump the version, commit, tag, and push. GitHub Actions builds the')
  console.error('Windows and Linux packages and uploads them to a draft release.')
  console.error(
    '--publish: publish the checked draft of the current version as the latest release.'
  )
  process.exit(1)
}
if (manualVersion && !/^\d+\.\d+\.\d+(-[A-Za-z0-9.]+)?$/.test(manualVersion)) {
  throw new Error(`Invalid semver: ${manualVersion}`)
}

process.chdir((await $`git rev-parse --show-toplevel`.text()).trim())
if ((await $`git status --porcelain`.text()).trim()) {
  throw new Error('Working tree is dirty; commit changes before releasing')
}
if ((await $`git branch --show-current`.text()).trim() !== 'main') {
  throw new Error('Release from main')
}
await $`gh auth status`.quiet()
await $`git fetch origin main --tags`
if (
  (await $`git rev-parse HEAD`.text()).trim() !== (await $`git rev-parse origin/main`.text()).trim()
) {
  throw new Error('main must match origin/main before releasing')
}

const currentVersion = (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string })
  .version

if (publish) {
  const tag = `v${currentVersion}`
  const release = JSON.parse(
    await $`gh release view ${tag} --repo ${REPO} --json isDraft,url,assets`.text()
  ) as { isDraft: boolean; url: string; assets: { name: string }[] }
  if (!release.isDraft) throw new Error(`${tag} is already published: ${release.url}`)
  const expected = [
    `dcc-${currentVersion}-setup.exe`,
    `dcc-${currentVersion}-setup.exe.blockmap`,
    `dcc-${currentVersion}.AppImage`,
    `dcc-${currentVersion}-amd64.deb`,
    'latest.yml',
    'latest-linux.yml'
  ]
  for (const name of expected) {
    if (!release.assets.some((asset) => asset.name === name)) {
      throw new Error(`Draft ${tag} is missing ${name}`)
    }
  }
  // Installed apps read the generic feed at releases/latest/download, so the published release must
  // become GitHub's latest release. Drafts are invisible there until they are published.
  await $`gh release edit ${tag} --repo ${REPO} --draft=false --latest`
  console.log(`Published ${tag}: ${release.url}`)
  console.log(`Auto-update feed: https://github.com/${REPO}/releases/latest/download/latest.yml`)
  process.exit(0)
}

let version = manualVersion ?? currentVersion
if (!manualVersion) {
  const base = currentVersion.replace(/-\d{10,}$/, '')
  if (!/^\d+\.\d+\.\d+$/.test(base)) throw new Error(`Cannot derive version from ${currentVersion}`)
  const now = new Date()
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const prefix = `v${base}-${date}`
  const nums = (await $`git tag --list ${`${prefix}*`}`.text())
    .split('\n')
    .filter((tag) => tag.startsWith(prefix) && /^\d{2}$/.test(tag.slice(prefix.length)))
    .map((tag) => Number(tag.slice(prefix.length)))
  const next = Math.max(0, ...nums) + 1
  if (next > 99) throw new Error('Daily version counter exceeded 99')
  version = `${base}-${date}${String(next).padStart(2, '0')}`
}
const tag = `v${version}`
const notes = `docs/releases/${tag}.md`
if (!existsSync(notes)) throw new Error(`Write release notes in ${notes} before releasing`)
if ((await $`git rev-parse --verify ${tag}`.quiet().nothrow()).exitCode === 0) {
  throw new Error(`${tag} already exists`)
}

for (const path of ['package.json', 'apps/core/package.json']) {
  const pkg = JSON.parse(readFileSync(path, 'utf8'))
  pkg.version = version
  writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n')
}
await $`bun install`
await $`git add package.json apps/core/package.json bun.lock`
await $`git commit -m ${`Release ${tag}`}`
await $`git tag -a ${tag} -m ${`Release ${tag}`}`
// The tag push starts .github/workflows/release.yml, which builds and uploads the draft release.
await $`git push --atomic origin HEAD:main ${`refs/tags/${tag}`}`
console.log(
  `Pushed ${tag}. Follow the build: https://github.com/${REPO}/actions/workflows/release.yml`
)
console.log('After checking the draft release, run bun run release --publish')
