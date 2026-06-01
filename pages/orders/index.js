const { listOrders } = require('../../services/orders')
const {
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  PAYMENT_STATUS,
  PAYMENT_STATUS_TEXT
} = require('../../models/constants')
const { formatMoneyWithSymbol } = require('../../utils/money')

const statusValues = [
  '',
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.WAITING_FIRING,
  ORDER_STATUS.CHECKING,
  ORDER_STATUS.PACKING,
  ORDER_STATUS.SHIPPING,
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED
]

const paymentStatusValues = [
  '',
  PAYMENT_STATUS.UNPAID,
  PAYMENT_STATUS.DEPOSIT_PAID,
  PAYMENT_STATUS.PARTIAL_PAID,
  PAYMENT_STATUS.PAID
]

Page({
  data: {
    keyword: '',
    loading: false,
    orders: [],
    summary: {
      total: 0,
      activeCount: 0,
      unpaidAmountText: '¥0.00'
    },
    statusIndex: 0,
    statusOptions: ['全部状态'].concat(statusValues.slice(1).map((status) => ORDER_STATUS_TEXT[status])),
    paymentStatusIndex: 0,
    paymentStatusOptions: ['全部收款'].concat(paymentStatusValues.slice(1).map((status) => PAYMENT_STATUS_TEXT[status])),
    errorMessage: ''
  },

  onShow() {
    this.loadOrders()
  },

  onSearchInput(e) {
    this.setData({
      keyword: e.detail.value
    })
  },

  onSearchConfirm() {
    this.loadOrders()
  },

  onStatusChange(e) {
    this.setData({
      statusIndex: Number(e.detail.value)
    })
    this.loadOrders()
  },

  onPaymentStatusChange(e) {
    this.setData({
      paymentStatusIndex: Number(e.detail.value)
    })
    this.loadOrders()
  },

  loadOrders() {
    this.setData({
      loading: true,
      errorMessage: ''
    })

    listOrders({
      keyword: this.data.keyword,
      status: statusValues[this.data.statusIndex],
      paymentStatus: paymentStatusValues[this.data.paymentStatusIndex]
    })
      .then((orders) => {
        const activeCount = orders.filter((item) => item.status !== ORDER_STATUS.COMPLETED && item.status !== ORDER_STATUS.CANCELLED).length
        const unpaidAmount = orders.reduce((sum, item) => sum + Number(item.unpaidAmount || 0), 0)

        this.setData({
          orders,
          summary: {
            total: orders.length,
            activeCount,
            unpaidAmountText: formatMoneyWithSymbol(unpaidAmount)
          }
        })
      })
      .catch((error) => {
        this.setData({
          errorMessage: error.message || '订单加载失败'
        })
      })
      .then(() => {
        this.setData({
          loading: false
        })
      })
  },

  goCreate() {
    wx.navigateTo({
      url: '../order-edit/index'
    })
  }
})
