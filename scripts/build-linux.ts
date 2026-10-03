#!/usr/bin/env bun
import { $ } from 'bun'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dir, '..')
process.chdir(repoRoot)

const docker = await $`docker info --format {{.OSType}}`.quiet().nothrow()
if (docker.exitCode !== 0 || docker.stdout.toString().trim() !== 'linux') {
  console.error('error: start Docker Desktop with Linux containers before building Linux releases')
  process.exit(1)
}

const output = resolve(repoRoot, 'dist/linux')
mkdirSync(output, { recursive: true })
await $`docker build --platform linux/amd64 -f scripts/linux.Dockerfile -t dcc-linux-builder scripts`
const build =
  await $`docker run --rm --platform linux/amd64 --mount ${`type=bind,source=${repoRoot},target=/source,readonly`} --mount ${`type=bind,source=${output},target=/output`} --mount type=volume,source=dcc-linux-bun-cache,target=/root/.bun/install/cache --mount type=volume,source=dcc-linux-electron-cache,target=/root/.cache/electron --mount type=volume,source=dcc-linux-builder-cache,target=/root/.cache/electron-builder dcc-linux-builder bash /source/scripts/build-linux.sh`.nothrow()
process.exit(build.exitCode)
