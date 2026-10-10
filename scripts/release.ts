#!/usr/bin/env bun
import { $ } from 'bun'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const REPO = 'rhyver/dcc'
const LATEST_TAG = 'dcc-latest'
const argv = process.argv.slice(2)
const skipPublish = argv.includes('--no-publish')
const resume = argv.includes('--resume')
const publish = argv.includes('--publish')
const manualVersion = argv.find((arg) => !arg.startsWith('--'))
const flags = new Set(['--no-publish', '--resume', '--publish'])

if (argv.some((arg) => arg.startsWith('--') && !flags.has(arg)) || (skipPublish && publish)) {
  console.error('usage: bun run release [version] [--no-publish | --publish] [--resume]')
  console.error('Default: build, tag, push to GitHub, and upload a draft release.')
  console.error('--no-publish: build and tag locally; no push or upload.')
  console.error('--publish: publish the verified draft and refresh the auto-update channel.')
  console.error('--resume: reuse the current version, tag, and existing artifacts.')
  process.exit(1)
}
if (resume && manualVersion) throw new Error('--resume cannot be combined with a manual version')
if (manualVersion && !/^\d+\.\d+\.\d+(-[A-Za-z0-9.]+)?$/.test(manualVersion)) {
  throw new Error(`Invalid semver: ${manualVersion}`)
}

process.chdir((await $`git rev-parse --show-toplevel`.text()).trim())
if ((await $`git status --porcelain`.text()).trim()) {
  throw new Error('Working tree is dirty; commit changes before releasing')
}
const branch = (await $`git branch --show-current`.text()).trim()
if (!skipPublish && branch !== 'main' && branch !== '')
  throw new Error('Publish releases from main or a detached origin/main checkout')
if (!skipPublish) {
  await $`gh auth status`.quiet()
  await $`git fetch origin main --tags`
  if (
    (await $`git rev-parse HEAD`.text()).trim() !==
    (await $`git rev-parse origin/main`.text()).trim()
  ) {
    throw new Error('main must match origin/main before releasing')
  }
}

const currentVersion = (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string })
  .version
let version = manualVersion ?? currentVersion
if (!resume && !manualVersion) {
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

if (resume) {
  const tagCommit = (await $`git rev-parse ${`${tag}^{commit}`}`.text()).trim()
  if (tagCommit !== (await $`git rev-parse HEAD`.text()).trim()) {
    throw new Error('The release tag must point to the checked-out commit')
  }
} else {
  if ((await $`git rev-parse --verify ${tag}`.quiet().nothrow()).exitCode === 0) {
    throw new Error(`${tag} already exists`)
  }
  for (const path of ['package.json', 'apps/core/package.json']) {
    const pkg = JSON.parse(readFileSync(path, 'utf8'))
    pkg.version = version
    writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n')
  }
  await $`bun install`
  await $`bun run build:win`
  await $`bun run build:linux:docker`
}

const artifacts = [
  `dist/dcc-${version}-setup.exe`,
  `dist/dcc-${version}-setup.exe.blockmap`,
  `dist/linux/dcc-${version}.AppImage`,
  `dist/linux/dcc-${version}-amd64.deb`,
  'dist/latest.yml',
  'dist/linux/latest-linux.yml'
]
for (const path of artifacts) if (!existsSync(path)) throw new Error(`Missing artifact: ${path}`)
for (const path of ['dist/latest.yml', 'dist/linux/latest-linux.yml']) {
  if (!readFileSync(path, 'utf8').includes(`version: ${version}`)) {
    throw new Error(`Wrong release version in ${path}`)
  }
}
if (
  (JSON.parse(readFileSync('apps/core/package.json', 'utf8')) as { version: string }).version !==
  version
) {
  throw new Error('App and release versions differ')
}

if (!resume) {
  await $`git add package.json apps/core/package.json bun.lock`
  if ((await $`git diff --cached --quiet`.nothrow()).exitCode !== 0)
    await $`git commit -m ${`Release ${tag}`}`
  await $`git tag -a ${tag} -m ${`Release ${tag}`}`
}
if (skipPublish) {
  console.log(`Built and tagged ${tag} locally. Nothing pushed or uploaded.`)
  process.exit(0)
}

await $`git push origin HEAD:main ${`refs/tags/${tag}`}`
type Release = { isDraft: boolean; url: string }
const lookup = await $`gh release view ${tag} --repo ${REPO} --json isDraft,url`.quiet().nothrow()
let release: Release
if (lookup.exitCode === 0) {
  release = JSON.parse(lookup.stdout.toString()) as Release
} else {
  // A failed lookup must not be mistaken for a missing release (e.g. auth/network failure).
  const releases = JSON.parse(
    await $`gh release list --repo ${REPO} --limit 100 --json tagName`.text()
  ) as { tagName: string }[]
  if (releases.some((item) => item.tagName === tag)) throw new Error(`Could not inspect ${tag}`)
  await $`gh release create ${tag} --repo ${REPO} --verify-tag --draft --prerelease --title ${tag} --notes-file ${notes}`
  release = JSON.parse(
    await $`gh release view ${tag} --repo ${REPO} --json isDraft,url`.text()
  ) as Release
}
if (release.isDraft) {
  await $`gh release upload ${tag} --repo ${REPO} --clobber ${artifacts}`
  const remote = JSON.parse(
    await $`gh release view ${tag} --repo ${REPO} --json assets`.text()
  ) as { assets: { name: string; size: number }[] }
  for (const path of artifacts) {
    const asset = remote.assets.find((item) => item.name === path.split('/').pop())
    if (!asset || asset.size !== Bun.file(path).size)
      throw new Error(`Upload verification failed: ${path}`)
  }
}
if (!publish) {
  console.log(
    `Draft ready: ${release.url}. After checking packages, run bun run release --resume --publish`
  )
  process.exit(0)
}
if (release.isDraft) await $`gh release edit ${tag} --repo ${REPO} --draft=false`

// Keep the generic update feed: numeric date prereleases do not form a single GitHub-native channel.
// Upload binaries first and manifests last, so installed apps only discover complete downloads.
const channel = await $`gh release view ${LATEST_TAG} --repo ${REPO} --json isDraft`
  .quiet()
  .nothrow()
if (channel.exitCode !== 0) {
  const remoteTag = (await $`git ls-remote --tags origin ${`refs/tags/${LATEST_TAG}`}`.text())
    .trim()
    .split(/\s/)[0]
  await $`git tag -f ${LATEST_TAG} HEAD`
  await $`git push ${`--force-with-lease=refs/tags/${LATEST_TAG}:${remoteTag}`} origin ${`refs/tags/${LATEST_TAG}`}`
  await $`gh release create ${LATEST_TAG} --repo ${REPO} --verify-tag --draft --prerelease --title ${`Auto-update channel (${version})`} --notes ${`Update feed for ${tag}. Use versioned releases for release history.`}`
}
for (const path of artifacts)
  await $`gh release upload ${LATEST_TAG} --repo ${REPO} --clobber ${path}`
await $`gh release edit ${LATEST_TAG} --repo ${REPO} --draft=false --title ${`Auto-update channel (${version})`} --notes ${`Update feed for [${tag}](https://github.com/${REPO}/releases/tag/${tag}).`}`
console.log(`Published ${tag}: ${release.url}`)
console.log(
  `Auto-update feed: https://github.com/${REPO}/releases/download/${LATEST_TAG}/latest.yml`
)
