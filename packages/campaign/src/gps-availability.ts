export const GPS_AVAILABLE_FROM_ISO = '1994-03-28T00:00:00.000Z'
export const GPS_ENABLED_OVERRIDE_YEAR = 1995

const GPS_AVAILABLE_FROM_MS = Date.parse(GPS_AVAILABLE_FROM_ISO)

export function isGpsAvailable(date: Date | string): boolean {
  return new Date(date).getTime() >= GPS_AVAILABLE_FROM_MS
}

export function getCampaignDateForYear(date: Date | string, year: number): Date {
  const campaignDate = new Date(date)
  campaignDate.setUTCFullYear(year)
  return campaignDate
}

export function getGpsEnabledCampaignDate(date: Date | string): Date {
  const campaignDate = new Date(date)
  if (isGpsAvailable(campaignDate)) return campaignDate

  return getCampaignDateForYear(campaignDate, GPS_ENABLED_OVERRIDE_YEAR)
}
