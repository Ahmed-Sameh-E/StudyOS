import { safeDate, todayKey } from '../data/studyData'

export const today = () => todayKey()

export const prettyDate = (value) => {
  const date = safeDate(value)

  if (!date) return '—'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export const dateAtLocalNoon = (value) => {
  const date = safeDate(value)

  if (!date) return null

  date.setHours(12, 0, 0, 0)

  return date
}

export const toDateKey = (value) => {
  const date = safeDate(value)

  if (!date) return ''

  return todayKey(date)
}

export const weekStart = (value = new Date()) => {
  const date = safeDate(value)

  if (!date) return null

  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day

  date.setDate(date.getDate() + diff)
  date.setHours(12, 0, 0, 0)

  return date
}

export const formatMinutes = (minutes = 0) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0))

  const hours = Math.floor(total / 60)
  const remaining = total % 60

  if (hours === 0) {
    return `${remaining}m`
  }

  if (remaining === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remaining}m`
}

export const formatHours = (minutes = 0) => {
  const total = Math.max(0, Number(minutes) || 0)
  const hours = total / 60

  if (hours === 0) return '0h'

  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`
}

export const initials = (name = '') => {
  return String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}