# GitHub release migration

Target: public source and releases at <https://github.com/rhyver/dcc>.
Release: `v0.5.0-2026101001`; preserve `0.5.0-YYYYMMDDNN` versioning.

## Implementation

- Use GitHub's `dcc-latest` release as a generic updater feed. The GitHub-native updater
  interprets numeric prerelease identifiers as individual channels; the generic feed preserves
  existing date-based versioning.
- Keep the application ID, executable name, and campaign save locations unchanged.
- Build Windows NSIS and Linux x64 AppImage/Debian packages with publishing disabled during builds.
- Upload all installers, blockmaps, and both update manifests to a draft versioned release.
- Verify packages before publishing the versioned release and then refresh the update channel,
  uploading binaries before manifests. Keep versioned release assets immutable after publication.
- Change website source, release, and installer links to GitHub; retain historical release notes.

## Release checklist

- [ ] Commit and merge PR #1 into `main`.
- [ ] Run automated checks and package Windows/Linux builds.
- [ ] Confirm embedded update config points to public GitHub and preserves `latest` channel.
- [ ] Smoke-test the packaged app with an existing campaign and generate a mission.
- [ ] Make `rhyver/dcc` public.
- [ ] Publish the versioned GitHub release and refresh `dcc-latest`.
- [ ] Verify anonymous installer/manifest access and update discovery/download.
- [ ] Publish the transition build to Codeberg's existing `dcc-latest` feed.
- [ ] Deploy the updated website through its existing hosting process.

## Existing installations

The updater URL is embedded in installed versions. Existing Codeberg installations will
continue to query Codeberg until they install a GitHub-configured build. Keep the Codeberg
release available. To migrate automatically, upload this release's Windows installer,
blockmap, and `latest.yml` to the existing Codeberg `dcc-latest` release, replacing its manifest
last. The installer embeds GitHub as the next update source. A manual installation of the
GitHub Windows package is also sufficient. Linux users install a newer package manually.

Codeberg publishing credentials are not available in the current session. Live DCS checks
remain outstanding; the public release notes must state this limitation.
