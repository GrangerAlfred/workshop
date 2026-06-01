const { login, getCachedAuth, canManage } = require('../../services/auth')
const { USER_ROLE_TEXT } = require('../../models/constants')
const { formatDateTime } = require('../../utils/date')

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    loading: false,
    errorMessage: '',
    auth: null,
    user: null,
    profile: {
      avatarUrl: defaultAvatarUrl,
      nickName: ''
    },
    roleText: '',
    enabledText: '',
    lastLoginText: '',
    canManage: false,
    canIUseNicknameComp: wx.canIUse('input.type.nickname')
  },

  onLoad() {
    const app = getApp()
    const cachedAuth = getCachedAuth()

    if (cachedAuth) {
      this.applyAuth(cachedAuth)
      return
    }

    if (app.globalData.authReady && app.globalData.currentUser) {
      this.applyAuth({
        openid: app.globalData.openid,
        user: app.globalData.currentUser
      })
      return
    }

    this.refreshLogin()
  },

  onChooseAvatar(e) {
    this.setData({
      'profile.avatarUrl': e.detail.avatarUrl
    })
  },

  onInputChange(e) {
    this.setData({
      'profile.nickName': e.detail.value
    })
  },

  refreshLogin() {
    const { profile } = this.data

    this.setData({
      loading: true,
      errorMessage: ''
    })

    login({
      nickName: profile.nickName,
      avatarUrl: profile.avatarUrl === defaultAvatarUrl ? '' : profile.avatarUrl
    })
      .then((auth) => {
        const app = getApp()
        app.globalData.openid = auth.openid
        app.globalData.currentUser = auth.user
        app.globalData.authReady = true
        app.globalData.authError = ''
        this.applyAuth(auth)
      })
      .catch((error) => {
        this.setData({
          errorMessage: error.message || '登录失败'
        })
      })
      .then(() => {
        this.setData({
          loading: false
        })
      })
  },

  applyAuth(auth) {
    const user = auth.user || {}

    this.setData({
      auth,
      user,
      profile: {
        avatarUrl: user.avatarUrl || this.data.profile.avatarUrl,
        nickName: user.nickName || user.name || this.data.profile.nickName
      },
      roleText: USER_ROLE_TEXT[user.role] || user.role || '未分配',
      enabledText: user.enabled ? '已启用' : '待启用',
      lastLoginText: formatDateTime(user.lastLoginAt),
      canManage: canManage(user),
      errorMessage: ''
    })
  }
})
