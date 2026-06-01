const { getDb, getCommand } = require('./cloud')
const { getCachedAuth, canManage } = require('./auth')
const { COLLECTIONS } = require('../models/constants')

function getCurrentUser() {
  const auth = getCachedAuth()
  return auth && auth.user
}

function assertCanManage() {
  const user = getCurrentUser()

  if (!canManage(user)) {
    throw new Error('当前账号没有素胚管理权限')
  }

  return user
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function normalizeBisqueItem(input) {
  return {
    name: input.name || '',
    spec: input.spec || '',
    unit: input.unit || '个',
    currentStock: toNumber(input.currentStock),
    averageCost: toNumber(input.averageCost),
    latestPurchasePrice: toNumber(input.latestPurchasePrice),
    warningStock: toNumber(input.warningStock),
    imageFileIds: input.imageFileIds || [],
    note: input.note || ''
  }
}

function matchKeyword(item, keyword) {
  if (!keyword) {
    return true
  }

  const text = [
    item.name,
    item.spec,
    item.unit,
    item.note
  ].join(' ').toLowerCase()

  return text.indexOf(keyword.toLowerCase()) >= 0
}

function getStockStatus(item) {
  if (item.currentStock <= 0) {
    return '缺货'
  }

  if (item.warningStock > 0 && item.currentStock <= item.warningStock) {
    return '低库存'
  }

  return '正常'
}

function listBisqueItems(keyword = '') {
  const db = getDb()
  const _ = getCommand()

  return db.collection(COLLECTIONS.BISQUE_ITEMS)
    .where({
      deleted: _.neq(true)
    })
    .orderBy('updatedAt', 'desc')
    .limit(100)
    .get()
    .then((res) => res.data
      .filter((item) => matchKeyword(item, keyword))
      .map((item) => Object.assign({}, item, {
        stockStatus: getStockStatus(item)
      })))
}

function listInventoryTransactions(itemId = '') {
  const db = getDb()
  const query = {
    itemType: 'bisque'
  }

  if (itemId) {
    query.itemId = itemId
  }

  return db.collection(COLLECTIONS.INVENTORY_TRANSACTIONS)
    .where(query)
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get()
    .then((res) => res.data.filter((item) => item.deleted !== true))
}

function getBisqueItem(id) {
  return getDb().collection(COLLECTIONS.BISQUE_ITEMS).doc(id).get()
    .then((res) => Object.assign({}, res.data, {
      stockStatus: getStockStatus(res.data)
    }))
}

function saveBisqueItem(input) {
  const user = assertCanManage()
  const db = getDb()
  const now = Date.now()
  const data = normalizeBisqueItem(input)

  if (input._id) {
    return db.collection(COLLECTIONS.BISQUE_ITEMS).doc(input._id).update({
      data: Object.assign({}, data, {
        updatedAt: now,
        updatedBy: user._id || user.openid
      })
    }).then(() => input._id)
  }

  return db.collection(COLLECTIONS.BISQUE_ITEMS).add({
    data: Object.assign({}, data, {
      createdAt: now,
      updatedAt: now,
      createdBy: user._id || user.openid,
      updatedBy: user._id || user.openid,
      deleted: false
    })
  }).then((res) => res._id)
}

function deleteBisqueItem(id) {
  const user = assertCanManage()
  const now = Date.now()

  return getDb().collection(COLLECTIONS.BISQUE_ITEMS).doc(id).update({
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
  listBisqueItems,
  listInventoryTransactions,
  getBisqueItem,
  saveBisqueItem,
  deleteBisqueItem
}
