const TIME_ZONE = 'America/Sao_Paulo'

function partsFromDate(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23'
  })

  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]))

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second)
  }
}

export function todaySaoPaulo(date = new Date()) {
  const { year, month, day } = partsFromDate(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function currentHourSaoPaulo(date = new Date()) {
  return partsFromDate(date).hour
}

export function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false
  const [year, month, day] = String(value).split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
}

export function addDays(dateString, amount) {
  const [year, month, day] = String(dateString).split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

export function compareDateStrings(a, b) {
  return String(a).localeCompare(String(b))
}

export function normalizeTime(time) {
  if (time === null || time === undefined || time === '') return null

  const value = String(time).trim()
  const rangeMatch = value.match(/^(\d{1,2})-(\d{1,2})$/)
  if (rangeMatch) {
    const hour = Number(rangeMatch[1])
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null
    return `${String(hour).padStart(2, '0')}:00:00`
  }

  const clockMatch = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (clockMatch) {
    const [, hourText, minuteText, secondText = '00'] = clockMatch
    const hour = Number(hourText)
    const minute = Number(minuteText)
    const second = Number(secondText)

    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null
    if (!Number.isInteger(second) || second < 0 || second > 59) return null

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
  }

  return null
}

export function hourFromTime(time) {
  const normalized = normalizeTime(time)
  if (!normalized) return null
  return Number(normalized.slice(0, 2))
}

export function shiftByTime(time, fallback = null) {
  const hour = hourFromTime(time)
  if (hour === null) return fallback
  return hour >= 7 && hour <= 18 ? '1º Turno' : '2º Turno'
}

export function getLaunchLock(date, time = null, now = new Date()) {
  if (!date || !isValidDateString(date)) {
    return {
      locked: true,
      message: 'Data de lançamento inválida.'
    }
  }

  const today = todaySaoPaulo(now)
  const yesterday = addDays(today, -1)
  const tomorrow = addDays(today, 1)
  const nowParts = partsFromDate(now)

  if (compareDateStrings(date, tomorrow) >= 0) {
    return {
      locked: true,
      message: 'Não é permitido lançar coleta para data futura.'
    }
  }

  if (date !== today && date !== yesterday) {
    return {
      locked: true,
      message: 'Não é permitido lançar coleta para datas anteriores ao dia de ontem.'
    }
  }

  if (date === yesterday && (nowParts.hour > 1 || (nowParts.hour === 1 && (nowParts.minute > 0 || nowParts.second > 0)))) {
    return {
      locked: true,
      message: 'O lançamento do dia anterior só é permitido até 01:00 da manhã.'
    }
  }

  if (time !== null && time !== undefined && time !== '') {
    const hour = hourFromTime(time)

    if (hour === null) {
      return {
        locked: true,
        message: 'Faixa horária inválida para lançamento.'
      }
    }

    if (date === today && nowParts.hour < hour + 1) {
      const releaseClock = `${String((hour + 1) % 24).padStart(2, '0')}:00`
      return {
        locked: true,
        message: `Lançamento liberado somente a partir das ${releaseClock}.`,
        releaseClock
      }
    }
  }

  return {
    locked: false,
    message: ''
  }
}
