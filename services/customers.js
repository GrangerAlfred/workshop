const { getDb, getCommand } = require('./cloud')
const { getCachedAuth, canManage } = require('./auth')
const { COLLECTIONS, CUSTOMER_TYPE } = require('../models/constants')

function getCurrentUser() {
  const auth = getCachedAuth()
  return auth && auth.user
}

function assertCanManage() {
  const user = getCurrentUser()

  if (!canManage(user)) {
    throw new Error('当前账号没有客户管理权限')
  }

  return user
}

function normalizeCustomer(input) {
  return {
    name: input.name || '',
    contactName: input.contactName || '',
    phone: input.phone || '',
    wechat: input.wechat || '',
    address: input.address || '',
    type: input.type || CUSTOMER_TYPE.RETAIL,
    note: input.note || '',
    totalOrderAmount: Number(input.totalOrderAmount || 0),
    unpaidAmount: Number(input.unpaidAmount || 0)
  }
}

function matchKeyword(customer, keyword) {
  if (!keyword) {
    return true
  }

  const text = [
    customer.name,
    customer.contactName,
    customer.phone,
    customer.wechat,
    customer.address,
    customer.note
  ].join(' ').toLowerCase()

  return text.indexOf(keyword.toLowerCase()) >= 0
}

function listCustomers(keyword = '') {
  const db = getDb()
  const _ = getCommand()

  return db.collection(COLLECTIONS.CUSTOMERS)
    .where({
      deleted: _.neq(true)
    })
    .orderBy('updatedAt', 'desc')
    .limit(100)
    .get()
    .then((res) => res.data.filter((item) => matchKeyword(item, keyword)))
}

function getCustomer(id) {
  return getDb().collection(COLLECTIONS.CUSTOMERS).doc(id).get()
    .then((res) => res.data)
}

function saveCustomer(input) {
  const user = assertCanManage()
  const db = getDb()
  const now = Date.now()
  const data = normalizeCustomer(input)

  if (input._id) {
    return db.collection(COLLECTIONS.CUSTOMERS).doc(input._id).update({
      data: Object.assign({}, data, {
        updatedAt: now,
        updatedBy: user._id || user.openid
      })
    }).then(() => input._id)
  }

  return db.collection(COLLECTIONS.CUSTOMERS).add({
    data: Object.assign({}, data, {
      createdAt: now,
      updatedAt: now,
      createdBy: user._id || user.openid,
      updatedBy: user._id || user.openid,
      deleted: false
    })
  }).then((res) => res._id)
}

function deleteCustomer(id) {
  const user = assertCanManage()
  const now = Date.now()

  return getDb().collection(COLLECTIONS.CUSTOMERS).doc(id).update({
    data: {
      deleted: true,
      deletedAt: now,
      deletedBy: user._id || user.openid,
      updatedAt: now,
      updatedBy: user._id || user.openid
    }
  })
}

module.exports = {
  listCustomers,
  getCustomer,
  saveCustomer,
  deleteCustomer
}
