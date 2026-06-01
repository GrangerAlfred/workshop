const { listBisqueItems, deleteBisqueItem } = require('../../services/inventory')
const { formatMoneyWithSymbol } = require('../../utils/money')

Page({
  data: {
    keyword: '',
    loading: false,
    items: [],
    summary: {
      total: 0,
      totalStock: 0,
      lowStockCount: 0
    },
    errorMessage: ''
  },

  onShow() {
    this.loadItems()
  },

  onSearchInput(e) {
    this.setData({
      keyword: e.detail.value
    })
  },

  onSearchConfirm() {
    this.loadItems()
  },

  loadItems() {
    this.setData({
      loading: true,
      errorMessage: ''
    })

    listBisqueItems(this.data.keyword)
      .then((items) => {
        const totalStock = items.reduce((sum, item) => sum + Number(item.currentStock || 0), 0)
        const lowStockCount = items.filter((item) => item.stockStatus !== '正常').length

        this.setData({
          summary: {
            total: items.length,
            totalStock,
            lowStockCount
          },
          items: items.map((item) => Object.assign({}, item, {
            averageCostText: formatMoneyWithSymbol(item.averageCost || 0),
            latestPurchasePriceText: formatMoneyWithSymbol(item.latestPurchasePrice || 0)
          }))
        })
      })
      .catch((error) => {
        this.setData({
          errorMessage: error.message || '素胚加载失败'
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
      url: '../bisque-edit/index'
    })
  },

  goPurchase() {
    wx.navigateTo({
      url: '../purchase-edit/index'
    })
  },

  goTransactions() {
    wx.navigateTo({
      url: '../inventory-transactions/index'
    })
  },

  goEdit(e) {
    wx.navigateTo({
      url: `../bisque-edit/index?id=${e.currentTarget.dataset.id}`
    })
  },

  confirmDelete(e) {
    const { id, name } = e.currentTarget.dataset

    wx.showModal({
      title: '删除素胚',
      content: `确认删除 ${name}？`,
      success: (res) => {
        if (!res.confirm) {
          return
        }

        deleteBisqueItem(id)
          .then(() => {
            wx.showToast({
              title: '已删除',
              icon: 'success'
            })
            this.loadItems()
          })
          .catch((error) => {
            wx.showToast({
              title: error.message || '删除失败',
              icon: 'none'
            })
          })
      }
    })
  }
})
