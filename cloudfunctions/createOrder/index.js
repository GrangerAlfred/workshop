const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const COLLECTIONS = {
  USERS: 'users',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  BISQUE_ITEMS: 'bisque_items',
  ORDER_BISQUE_USAGES: 'order_bisque_usages',
  INVENTORY_TRANSACTIONS: 'inventory_transactions'
}

const BASE_COLLECTIONS = [
  COLLECTIONS.ORDERS,
  COLLECTIONS.ORDER_BISQUE_USAGES,
  COLLECTIONS.INVENTORY_TRANSACTIONS
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
    throw new Error('当前账号没有订单创建权限')
  }

  return user
}

function validateInput(input) {
  if (!input.customerId) {
    throw new Error('请选择客户')
  }

  if (!input.title) {
    throw new Error('请填写产品名称')
  }

  if (toNumber(input.quantity) <= 0) {
    throw new Error('订单数量必须大于 0')
  }

  if (toNumber(input.unitPrice) < 0) {
    throw new Error('订单单价不能小于 0')
  }

  if (!input.bisqueItemId) {
    throw new Error('请选择订单使用的素胚')
  }

  if (toNumber(input.bisqueQuantity) <= 0) {
    throw new Error('素胚使用数量必须大于 0')
  }
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
    const quantity = toNumber(event.quantity)
    const unitPrice = toNumber(event.unitPrice)
    const totalAmount = toNumber(event.totalAmount) || quantity * unitPrice
    const bisqueQuantity = toNumber(event.bisqueQuantity)
    const orderDate = toNumber(event.orderDate) || now
    const deliveryDate = toNumber(event.deliveryDate) || 0
    const orderNo = event.orderNo || generateNo('DD', now)

    const customerResult = await db.collection(COLLECTIONS.CUSTOMERS).doc(event.customerId).get()
    const customer = customerResult.data
    const bisqueRef = db.collection(COLLECTIONS.BISQUE_ITEMS).doc(event.bisqueItemId)
    const bisqueResult = await bisqueRef.get()
    const bisque = bisqueResult.data
    const currentStock = toNumber(bisque.currentStock)

    if (currentStock < bisqueQuantity) {
      throw new Error(`素胚库存不足，当前库存 ${currentStock}`)
    }

    const stockAfter = currentStock - bisqueQuantity
    const unitCost = toNumber(bisque.averageCost)
    const totalCost = bisqueQuantity * unitCost

    const orderData = {
      _openid: openid,
      orderNo,
      customerId: event.customerId,
      customerName: customer.name,
      title: event.title,
      quantity,
      unitPrice,
      totalAmount,
      paidAmount: 0,
      unpaidAmount: totalAmount,
      orderDate,
      deliveryDate,
      status: 'pending',
      paymentStatus: 'unpaid',
      currentProcessId: '',
      note: event.note || '',
      imageFileIds: [],
      profitSummary: {
        incomeAmount: totalAmount,
        bisqueCost: totalCost,
        wageCost: 0,
        firingCost: 0,
        packageLogisticsCost: 0,
        otherCost: 0,
        profitAmount: totalAmount - totalCost,
        profitRate: totalAmount > 0 ? Math.round(((totalAmount - totalCost) / totalAmount) * 10000) / 100 : 0,
        calculatedAt: now
      },
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      deleted: false
    }

    const orderRef = await db.collection(COLLECTIONS.ORDERS).add({
      data: orderData
    })

    await bisqueRef.update({
      data: {
        currentStock: stockAfter,
        updatedAt: now,
        updatedBy: userId
      }
    })

    await db.collection(COLLECTIONS.ORDER_BISQUE_USAGES).add({
      data: {
        _openid: openid,
        orderId: orderRef._id,
        bisqueItemId: event.bisqueItemId,
        bisqueName: bisque.name,
        quantity: bisqueQuantity,
        unitCost,
        totalCost,
        createdAt: now,
        createdBy: userId,
        deleted: false
      }
    })

    await db.collection(COLLECTIONS.INVENTORY_TRANSACTIONS).add({
      data: {
        _openid: openid,
        itemType: 'bisque',
        itemId: event.bisqueItemId,
        itemName: bisque.name,
        type: 'order_out',
        quantityChange: -bisqueQuantity,
        stockAfter,
        unitCost,
        relatedType: 'order',
        relatedId: orderRef._id,
        relatedNo: orderNo,
        note: event.note || '',
        createdAt: now,
        createdBy: userId
      }
    })

    await db.collection(COLLECTIONS.CUSTOMERS).doc(event.customerId).update({
      data: {
        totalOrderAmount: toNumber(customer.totalOrderAmount) + totalAmount,
        unpaidAmount: toNumber(customer.unpaidAmount) + totalAmount,
        updatedAt: now,
        updatedBy: userId
      }
    })

    return success({
      orderId: orderRef._id,
      orderNo
    })
  } catch (error) {
    return failure('CREATE_ORDER_FAILED', error.message || '订单创建失败')
  }
}
