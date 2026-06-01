const { initCloud } = require('./services/cloud')
const { login } = require('./services/auth')

// app.js
App({
  onLaunch() {
    const cloudState = initCloud()
    this.globalData.cloudReady = cloudState.success

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    if (cloudState.success) {
      login()
        .then((auth) => {
          this.globalData.openid = auth.openid
          this.globalData.currentUser = auth.user
          this.globalData.authReady = true
          this.globalData.authError = ''
        })
        .catch((error) => {
          this.globalData.authReady = false
          this.globalData.authError = error.message || '登录失败'
        })
    }
  },
  globalData: {
    userInfo: null,
    cloudReady: false,
    authReady: false,
    openid: '',
    currentUser: null,
    authError: ''
  }
})
