export function formatLocalDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function today() {
  return formatLocalDate(new Date())
}

export function normalizeDate(value) {
  if (!value) return ''

  if (value instanceof Date) {
    return formatLocalDate(value)
  }

  const text = String(value)
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`

  return text.slice(0, 10)
}

export function formatShortDate(value) {
  const normalized = normalizeDate(value)
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) return normalized

  const [, year, month, day] = match
  return `${day}/${month}/${year.slice(-2)}`
}
