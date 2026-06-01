const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const COLLECTIONS = {
  USERS: 'users',
  BISQUE_ITEMS: 'bisque_items',
  PURCHASE_ORDERS: 'purchase_orders',
  PURCHASE_ORDER_ITEMS: 'purchase_order_items',
  INVENTORY_TRANSACTIONS: 'inventory_transactions',
  LEDGER_ENTRIES: 'ledger_entries'
}

const BASE_COLLECTIONS = [
  COLLECTIONS.PURCHASE_ORDERS,
  COLLECTIONS.PURCHASE_ORDER_ITEMS,
  COLLECTIONS.INVENTORY_TRANSACTIONS,
  COLLECTIONS.LEDGER_ENTRIES
]

function success(data) {
  return {
    success: true,
    data
  }
}

function failure(errorCode, errorMessage) {
  return {
    success: false,
    errorCode,
    errorMessage
  }
}

function isCollectionNotFound(error) {
  const message = error.errMsg || error.message || ''
  return message.indexOf('collection') >= 0 && (
    message.indexOf('not exist') >= 0 ||
    message.indexOf('not exists') >= 0 ||
    message.indexOf('不存在') >= 0
  )
}

async function ensureCollection(collectionName) {
  try {
    await db.collection(collectionName).limit(1).get()
  } catch (error) {
    if (!isCollectionNotFound(error)) {
      throw error
    }

    await db.createCollection(collectionName)
  }
}

async function ensureBaseCollections() {
  for (let i = 0; i < BASE_COLLECTIONS.length; i += 1) {
    await ensureCollection(BASE_COLLECTIONS[i])
  }
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function generateNo(prefix, now) {
  return `${prefix}${new Date(now).toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
}

async function getCurrentUser(openid) {
  const result = await db.collection(COLLECTIONS.USERS).where({
    openid,
    deleted: false
  }).limit(1).get()

  if (result.data.length === 0) {
    throw new Error('当前用户未初始化')
  }

  const user = result.data[0]

  if (!user.enabled || ['admin', 'manager'].indexOf(user.role) < 0) {
    throw new Error('当前账号没有采购入库权限')
  }

  return user
}

function validateInput(input) {
  if (!input.supplierName) {
    throw new Error('请填写供应商')
  }

  if (!input.items || input.items.length === 0) {
    throw new Error('请至少选择一种素胚')
  }

  input.items.forEach((item) => {
    const quantity = toNumber(item.quantity)
    const brokenQuantity = toNumber(item.brokenQuantity)
    const unitPrice = toNumber(item.unitPrice)

    if (!item.bisqueItemId) {
      throw new Error('请选择素胚')
    }

    if (quantity <= 0) {
      throw new Error('采购数量必须大于 0')
    }

    if (brokenQuantity < 0 || brokenQuantity > quantity) {
      throw new Error('破损数量不能小于 0，也不能大于采购数量')
    }

    if (unitPrice < 0) {
      throw new Error('采购单价不能小于 0')
    }
  })
}

async function updateBisqueStock(item, purchaseOrderId, purchaseNo, now, userId) {
  const bisqueRef = db.collection(COLLECTIONS.BISQUE_ITEMS).doc(item.bisqueItemId)
  const bisqueResult = await bisqueRef.get()
  const bisque = bisqueResult.data
  const quantity = toNumber(item.quantity)
  const brokenQuantity = toNumber(item.brokenQuantity)
  const receivedQuantity = quantity - brokenQuantity
  const unitPrice = toNumber(item.unitPrice)
  const totalAmount = quantity * unitPrice
  const currentStock = toNumber(bisque.currentStock)
  const currentAverageCost = toNumber(bisque.averageCost)
  const stockAfter = currentStock + receivedQuantity
  const averageCost = stockAfter > 0
    ? Math.round(((currentStock * currentAverageCost) + totalAmount) / stockAfter)
    : currentAverageCost

  await bisqueRef.update({
    data: {
      currentStock: stockAfter,
      averageCost,
      latestPurchasePrice: unitPrice,
      updatedAt: now,
      updatedBy: userId
    }
  })

  await db.collection(COLLECTIONS.PURCHASE_ORDER_ITEMS).add({
    data: {
      purchaseOrderId,
      bisqueItemId: item.bisqueItemId,
      bisqueName: bisque.name,
      spec: bisque.spec || '',
      quantity,
      unitPrice,
      totalAmount,
      receivedQuantity,
      brokenQuantity,
      createdAt: now,
      createdBy: userId
    }
  })

  if (receivedQuantity > 0) {
    await db.collection(COLLECTIONS.INVENTORY_TRANSACTIONS).add({
      data: {
        itemType: 'bisque',
        itemId: item.bisqueItemId,
        itemName: bisque.name,
        type: 'purchase_in',
        quantityChange: receivedQuantity,
        stockAfter,
        unitCost: Math.round(totalAmount / receivedQuantity),
        relatedType: 'purchase_order',
        relatedId: purchaseOrderId,
        relatedNo: purchaseNo,
        note: item.note || '',
        createdAt: now,
        createdBy: userId
      }
    })
  }

  return totalAmount
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return failure('OPENID_MISSING', '无法获取 OpenID')
  }

  try {
    await ensureBaseCollections()
    validateInput(event)

    const user = await getCurrentUser(openid)
    const now = Date.now()
    const userId = user._id || openid
    const purchaseNo = event.purchaseNo || generateNo('CG', now)
    const purchaseDate = toNumber(event.purchaseDate) || now
    const paymentMethod = event.paymentMethod || 'wechat'
    const note = event.note || ''
    const purchaseRef = await db.collection(COLLECTIONS.PURCHASE_ORDERS).add({
      data: {
        purchaseNo,
        supplierName: event.supplierName,
        purchaseDate,
        totalAmount: 0,
        status: 'completed',
        ledgerEntryId: '',
        voucherFileIds: [],
        note,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
        deleted: false
      }
    })

    let totalAmount = 0

    for (let i = 0; i < event.items.length; i += 1) {
      totalAmount += await updateBisqueStock(event.items[i], purchaseRef._id, purchaseNo, now, userId)
    }

    const ledgerRef = await db.collection(COLLECTIONS.LEDGER_ENTRIES).add({
      data: {
        direction: 'expense',
        category: 'bisque_purchase',
        amount: totalAmount,
        occurredAt: purchaseDate,
        paymentMethod,
        relatedType: 'purchase_order',
        relatedId: purchaseRef._id,
        relatedNo: purchaseNo,
        handledBy: user.name || user.nickName || '',
        voucherFileIds: [],
        note,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
        deleted: false
      }
    })

    await db.collection(COLLECTIONS.PURCHASE_ORDERS).doc(purchaseRef._id).update({
      data: {
        totalAmount,
        ledgerEntryId: ledgerRef._id,
        updatedAt: now
      }
    })

    return success({
      purchaseOrderId: purchaseRef._id,
      ledgerEntryId: ledgerRef._id,
      purchaseNo,
      totalAmount
    })
  } catch (error) {
    return failure('CREATE_PURCHASE_FAILED', error.message || '采购入库失败')
  }
}
