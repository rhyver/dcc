# Security Policy

## Supported Versions

DCC is in alpha. Only the latest release receives security fixes. The app
updates itself automatically, so please make sure you are on the newest version
before reporting.

## Reporting a Vulnerability

**Please do not report security problems in public issues, pull requests or
Discord.**

Report them privately through GitHub instead:

1. Go to the [Security tab](https://github.com/rhyver/dcc/security) of this repository.
2. Click **Report a vulnerability**.
3. Describe the problem, how to reproduce it, and the impact you expect.

We will acknowledge your report as soon as we can, keep you updated while we
work on a fix, and credit you in the release notes unless you prefer otherwise.

## Scope

Examples of what we would like to hear about:

- Ways for a campaign file, mission file or downloaded data to run code on the
  user's machine
- Leaks of the AI provider API keys stored in the app settings
- Problems with the auto-updater, such as installing an update that was not
  published by us
- Changes DCC makes to `MissionScripting.lua` that weaken DCS's script sandbox
  more than needed
