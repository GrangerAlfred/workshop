const { listCustomers, deleteCustomer } = require('../../services/customers')
const { CUSTOMER_TYPE_TEXT } = require('../../models/constants')
const { formatMoneyWithSymbol } = require('../../utils/money')

Page({
  data: {
    keyword: '',
    loading: false,
    customers: [],
    summary: {
      total: 0,
      regularCount: 0,
      unpaidAmountText: '¥0.00'
    },
    errorMessage: ''
  },

  onShow() {
    this.loadCustomers()
  },

  onSearchInput(e) {
    this.setData({
      keyword: e.detail.value
    })
  },

  onSearchConfirm() {
    this.loadCustomers()
  },

  loadCustomers() {
    this.setData({
      loading: true,
      errorMessage: ''
    })

    listCustomers(this.data.keyword)
      .then((customers) => {
        const unpaidAmount = customers.reduce((sum, item) => sum + Number(item.unpaidAmount || 0), 0)
        const regularCount = customers.filter((item) => item.type === 'regular').length

        this.setData({
          summary: {
            total: customers.length,
            regularCount,
            unpaidAmountText: formatMoneyWithSymbol(unpaidAmount)
          },
          customers: customers.map((item) => Object.assign({}, item, {
            typeText: CUSTOMER_TYPE_TEXT[item.type] || item.type || '',
            unpaidAmountText: formatMoneyWithSymbol(item.unpaidAmount || 0)
          }))
        })
      })
      .catch((error) => {
        this.setData({
          errorMessage: error.message || '客户加载失败'
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
      url: '../customer-edit/index'
    })
  },

  goEdit(e) {
    wx.navigateTo({
      url: `../customer-edit/index?id=${e.currentTarget.dataset.id}`
    })
  },

  confirmDelete(e) {
    const { id, name } = e.currentTarget.dataset

    wx.showModal({
      title: '删除客户',
      content: `确认删除 ${name}？`,
      success: (res) => {
        if (!res.confirm) {
          return
        }

        deleteCustomer(id)
          .then(() => {
            wx.showToast({
              title: '已删除',
              icon: 'success'
            })
            this.loadCustomers()
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
