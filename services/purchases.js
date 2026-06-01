const { callFunction } = require('./cloud')

function unwrapCloudResult(response) {
  const result = response && response.result

  if (!result) {
    throw new Error('云函数没有返回结果')
  }

  if (!result.success) {
    throw new Error(result.errorMessage || '采购入库失败')
  }

  return result.data
}

function createPurchase(input) {
  return callFunction('createPurchase', input).then(unwrapCloudResult)
}

module.exports = {
  createPurchase
}
