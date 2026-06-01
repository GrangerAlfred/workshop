const { callFunction } = require('./cloud')
const { USER_ROLE } = require('../models/constants')

const AUTH_STORAGE_KEY = 'workshop_auth'

function unwrapCloudResult(response) {
  const result = response && response.result

  if (!result) {
    throw new Error('云函数没有返回结果')
  }

  if (!result.success) {
    throw new Error(result.errorMessage || '登录失败')
  }

  return result.data
}

function setCachedAuth(auth) {
  wx.setStorageSync(AUTH_STORAGE_KEY, auth)
}

function getCachedAuth() {
  return wx.getStorageSync(AUTH_STORAGE_KEY) || null
}

function clearCachedAuth() {
  wx.removeStorageSync(AUTH_STORAGE_KEY)
}

function login(profile = {}) {
  return callFunction('login', {
    profile
  }).then((response) => {
    const auth = unwrapCloudResult(response)
    setCachedAuth(auth)
    return auth
  })
}

function isEnabled(user) {
  return Boolean(user && user.enabled)
}

function hasRole(user, roles) {
  if (!user || !user.role) {
    return false
  }

  return roles.indexOf(user.role) >= 0
}

function canManage(user) {
  return isEnabled(user) && hasRole(user, [USER_ROLE.ADMIN, USER_ROLE.MANAGER])
}

module.exports = {
  login,
  getCachedAuth,
  clearCachedAuth,
  isEnabled,
  hasRole,
  canManage
}
