function padNumber(value) {
  return value < 10 ? `0${value}` : `${value}`
}

function formatTimestamp(date = new Date()) {
  const year = date.getFullYear()
  const month = padNumber(date.getMonth() + 1)
  const day = padNumber(date.getDate())
  const hour = padNumber(date.getHours())
  const minute = padNumber(date.getMinutes())
  const second = padNumber(date.getSeconds())

  return `${year}${month}${day}${hour}${minute}${second}`
}

function randomDigits(length = 4) {
  const max = Math.pow(10, length)
  let value = Math.floor(Math.random() * max).toString()

  while (value.length < length) {
    value = `0${value}`
  }

  return value
}

function generateSerialNo(prefix, date = new Date()) {
  return `${prefix}${formatTimestamp(date)}${randomDigits()}`
}

module.exports = {
  formatTimestamp,
  randomDigits,
  generateSerialNo
}
