export function toHourNumber(time) {
  if (time === null || time === undefined || time === '') return null

  const value = String(time).trim()
  const match = value.match(/^(\d{1,2})(?::|h|-)?/i)
  if (!match) return null

  const hour = Number(match[1])
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null

  return hour
}

export function formatHourRange(time) {
  const hour = toHourNumber(time)
  if (hour === null) return time || '-'

  const nextHour = (hour + 1) % 24
  return `${String(hour).padStart(2, '0')}-${String(nextHour).padStart(2, '0')}`
}

export function formatClockTime(time) {
  const value = time === null || time === undefined ? '' : String(time).trim()
  if (!value) return '-'

  const match = value.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return value

  return `${match[1].padStart(2, '0')}:${match[2]}`
}
