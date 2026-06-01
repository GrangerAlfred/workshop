const { listCustomers } = require('../../services/customers')
const { listBisqueItems } = require('../../services/inventory')
const { formatMoneyWithSymbol } = require('../../utils/money')

Page({
  data: {
    loading: false,
    errorMessage: '',
    stats: {
      customerCount: 0,
      bisqueCount: 0,
      lowStockCount: 0,
      unpaidAmountText: '¥0.00'
    }
  },

  onShow() {
    this.loadOverview()
  },

  loadOverview() {
    this.setData({
      loading: true,
      errorMessage: ''
    })

    Promise.all([
      listCustomers(),
      listBisqueItems()
    ])
      .then(([customers, bisqueItems]) => {
        const unpaidAmount = customers.reduce((sum, item) => sum + Number(item.unpaidAmount || 0), 0)
        const lowStockCount = bisqueItems.filter((item) => item.stockStatus !== '正常').length

        this.setData({
          stats: {
            customerCount: customers.length,
            bisqueCount: bisqueItems.length,
            lowStockCount,
            unpaidAmountText: formatMoneyWithSymbol(unpaidAmount)
          }
        })
      })
      .catch((error) => {
        this.setData({
          errorMessage: error.message || '工作台加载失败'
        })
      })
      .then(() => {
        this.setData({
          loading: false
        })
      })
  },

  goCustomers() {
    wx.navigateTo({
      url: '../customers/index'
    })
  },

  goInventory() {
    wx.navigateTo({
      url: '../inventory/index'
    })
  },

  goProfile() {
    wx.navigateTo({
      url: '../profile/index'
    })
  }
})
