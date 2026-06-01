const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const COLLECTIONS = {
  USERS: 'users',
  ORDERS: 'orders'
}

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
    throw new Error('当前账号没有订单查看权限')
  }

  return user
}

function matchKeyword(order, keyword) {
  if (!keyword) {
    return true
  }

  const text = [
    order.orderNo,
    order.customerName,
    order.title,
    order.note
  ].join(' ').toLowerCase()

  return text.indexOf(keyword.toLowerCase()) >= 0
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return failure('OPENID_MISSING', '无法获取 OpenID')
  }

  try {
    await getCurrentUser(openid)

    const query = {
      deleted: _.neq(true)
    }

    if (event.status) {
      query.status = event.status
    }

    if (event.paymentStatus) {
      query.paymentStatus = event.paymentStatus
    }

    if (event.customerId) {
      query.customerId = event.customerId
    }

    const result = await db.collection(COLLECTIONS.ORDERS)
      .where(query)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()

    return success(result.data.filter((item) => matchKeyword(item, event.keyword || '')))
  } catch (error) {
    if (isCollectionNotFound(error)) {
      return success([])
    }

    return failure('LIST_ORDERS_FAILED', error.message || '订单加载失败')
  }
}
