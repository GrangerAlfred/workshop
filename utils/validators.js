function isEmpty(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

function isNonNegativeNumber(value) {
  if (isEmpty(value)) {
    return false
  }

  const number = Number(value)
  return Number.isFinite(number) && number >= 0
}

function isPositiveNumber(value) {
  if (isEmpty(value)) {
    return false
  }

  const number = Number(value)
  return Number.isFinite(number) && number > 0
}

function required(value, message = '该字段不能为空') {
  return isEmpty(value)
    ? { valid: false, message }
    : { valid: true, message: '' }
}

function nonNegativeNumber(value, message = '请输入不小于 0 的数字') {
  return isNonNegativeNumber(value)
    ? { valid: true, message: '' }
    : { valid: false, message }
}

function positiveNumber(value, message = '请输入大于 0 的数字') {
  return isPositiveNumber(value)
    ? { valid: true, message: '' }
    : { valid: false, message }
}

function validateRules(rules) {
  for (let i = 0; i < rules.length; i += 1) {
    const result = rules[i]()

    if (!result.valid) {
      return result
    }
  }

  return {
    valid: true,
    message: ''
  }
}

module.exports = {
  isEmpty,
  isNonNegativeNumber,
  isPositiveNumber,
  required,
  nonNegativeNumber,
  positiveNumber,
  validateRules
}
