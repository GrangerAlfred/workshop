const { callFunction } = require('./cloud')
const {
  ORDER_STATUS_TEXT,
  PAYMENT_STATUS_TEXT
} = require('../models/constants')
const { formatDate } = require('../utils/date')
const { formatMoneyWithSymbol } = require('../utils/money')

function unwrapCloudResult(response) {
  const result = response && response.result

  if (!result) {
    throw new Error('云函数没有返回结果')
  }

  if (!result.success) {
    throw new Error(result.errorMessage || '订单创建失败')
  }

  return result.data
}

function decorateOrder(order) {
  return Object.assign({}, order, {
    statusText: ORDER_STATUS_TEXT[order.status] || order.status || '',
    paymentStatusText: PAYMENT_STATUS_TEXT[order.paymentStatus] || order.paymentStatus || '',
    totalAmountText: formatMoneyWithSymbol(order.totalAmount || 0),
    unpaidAmountText: formatMoneyWithSymbol(order.unpaidAmount || 0),
    deliveryDateText: formatDate(order.deliveryDate),
    orderDateText: formatDate(order.orderDate)
  })
}

function listOrders(filters = {}) {
  return callFunction('listOrders', filters)
    .then(unwrapCloudResult)
    .then((orders) => orders.map(decorateOrder))
}

function createOrder(input) {
  return callFunction('createOrder', input).then(unwrapCloudResult)
}

module.exports = {
  listOrders,
  createOrder
}
