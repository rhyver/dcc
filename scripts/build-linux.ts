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

// Keep the Linux output on the container filesystem. Docker Desktop's bind
// mount of this Dev Drive reports EEXIST for directories that are not there,
// and Node then fails the electron-builder unpack with ENOENT.
const container = 'dcc-linux-build'
await $`docker rm -f ${container}`.quiet().nothrow()
const build =
  await $`docker run --name ${container} --platform linux/amd64 --mount ${`type=bind,source=${repoRoot},target=/source,readonly`} --mount type=volume,source=dcc-linux-bun-cache,target=/root/.bun/install/cache --mount type=volume,source=dcc-linux-electron-cache,target=/root/.cache/electron --mount type=volume,source=dcc-linux-builder-cache,target=/root/.cache/electron-builder dcc-linux-builder bash /source/scripts/build-linux.sh`.nothrow()
if (build.exitCode === 0) {
  const copied = await $`docker cp ${`${container}:/output/.`} ${output}`.nothrow()
  await $`docker rm -f ${container}`.quiet().nothrow()
  process.exit(copied.exitCode)
}
await $`docker rm -f ${container}`.quiet().nothrow()
process.exit(build.exitCode)
