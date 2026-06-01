function padNumber(value) {
  return value < 10 ? `0${value}` : `${value}`
}

function toDate(value) {
  if (value instanceof Date) {
    return new Date(value.getTime())
  }

  return new Date(value)
}

function toTimestamp(value) {
  if (!value) {
    return 0
  }

  return toDate(value).getTime()
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  const date = toDate(value)
  const year = date.getFullYear()
  const month = padNumber(date.getMonth() + 1)
  const day = padNumber(date.getDate())

  return `${year}-${month}-${day}`
}

function formatDateTime(value) {
  if (!value) {
    return ''
  }

  const date = toDate(value)
  const hour = padNumber(date.getHours())
  const minute = padNumber(date.getMinutes())

  return `${formatDate(date)} ${hour}:${minute}`
}

function startOfDay(value) {
  const date = toDate(value)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function endOfDay(value) {
  const date = toDate(value)
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}

module.exports = {
  padNumber,
  toTimestamp,
  formatDate,
  formatDateTime,
  startOfDay,
  endOfDay
}
