import { track } from '@vercel/analytics'

export function trackDownloadModalOpened() {
  track('download_modal_opened')
}

export function trackDownloadClicked() {
  track('download_clicked')
}

export function trackSourceClicked() {
  track('source_clicked')
}

export function trackDiscordClicked() {
  track('discord_clicked')
}
