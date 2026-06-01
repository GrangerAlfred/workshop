function yuanToFen(value) {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const text = String(value).trim()
  const negative = text[0] === '-'
  const normalized = negative ? text.slice(1) : text
  const parts = normalized.split('.')
  const yuan = Number.parseInt(parts[0] || '0', 10)
  const cent = Number.parseInt(`${parts[1] || ''}00`.slice(0, 2), 10)

  if (Number.isNaN(yuan) || Number.isNaN(cent)) {
    return 0
  }

  const amount = yuan * 100 + cent
  return negative ? -amount : amount
}

function fenToYuan(amount) {
  return Number(amount || 0) / 100
}

function formatMoney(amount) {
  return fenToYuan(amount).toFixed(2)
}

function formatMoneyWithSymbol(amount) {
  return `¥${formatMoney(amount)}`
}

module.exports = {
  yuanToFen,
  fenToYuan,
  formatMoney,
  formatMoneyWithSymbol
}
