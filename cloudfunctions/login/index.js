const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const USERS_COLLECTION = 'users'

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

async function ensureUsersCollection() {
  try {
    await db.collection(USERS_COLLECTION).limit(1).get()
  } catch (error) {
    if (!isCollectionNotFound(error)) {
      throw error
    }

    await db.createCollection(USERS_COLLECTION)
  }
}

function pickProfile(profile = {}) {
  return {
    nickName: profile.nickName || '',
    avatarUrl: profile.avatarUrl || ''
  }
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const appid = wxContext.APPID
  const unionid = wxContext.UNIONID || ''

  if (!openid) {
    return failure('OPENID_MISSING', '无法获取 OpenID')
  }

  try {
    await ensureUsersCollection()

    const now = Date.now()
    const users = db.collection(USERS_COLLECTION)
    const profile = pickProfile(event.profile)
    const currentResult = await users.where({ openid }).limit(1).get()

    if (currentResult.data.length > 0) {
      const currentUser = currentResult.data[0]
      const updates = {
        lastLoginAt: now,
        updatedAt: now
      }

      if (profile.nickName) {
        updates.nickName = profile.nickName
        updates.name = profile.nickName
      }

      if (profile.avatarUrl) {
        updates.avatarUrl = profile.avatarUrl
      }

      await users.doc(currentUser._id).update({
        data: updates
      })

      return success({
        openid,
        appid,
        unionid,
        user: Object.assign({}, currentUser, updates)
      })
    }

    const userCount = await users.count()
    const isFirstUser = userCount.total === 0
    const newUser = {
      openid,
      appid,
      unionid,
      name: profile.nickName,
      nickName: profile.nickName,
      avatarUrl: profile.avatarUrl,
      phone: '',
      role: isFirstUser ? 'admin' : 'manager',
      workerId: '',
      enabled: isFirstUser,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      deleted: false
    }

    const addResult = await users.add({
      data: newUser
    })

    return success({
      openid,
      appid,
      unionid,
      user: Object.assign({
        _id: addResult._id
      }, newUser)
    })
  } catch (error) {
    return failure('LOGIN_FAILED', error.message || '登录失败')
  }
}
