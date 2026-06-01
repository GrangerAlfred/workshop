const { listInventoryTransactions } = require('../../services/inventory')
const { INVENTORY_TRANSACTION_TYPE_TEXT } = require('../../models/constants')
const { formatDateTime } = require('../../utils/date')
const { formatMoneyWithSymbol } = require('../../utils/money')

Page({
  data: {
    loading: false,
    itemId: '',
    purchaseNo: '',
    transactions: [],
    errorMessage: ''
  },

  onLoad(options) {
    this.setData({
      itemId: options.itemId || '',
      purchaseNo: options.purchaseNo || ''
    })
  },

  onShow() {
    this.loadTransactions()
  },

  loadTransactions() {
    this.setData({
      loading: true,
      errorMessage: ''
    })

    listInventoryTransactions(this.data.itemId)
      .then((transactions) => {
        const filtered = this.data.purchaseNo
          ? transactions.filter((item) => item.relatedNo === this.data.purchaseNo)
          : transactions

        this.setData({
          transactions: filtered.map((item) => Object.assign({}, item, {
            typeText: INVENTORY_TRANSACTION_TYPE_TEXT[item.type] || item.type,
            createdAtText: formatDateTime(item.createdAt),
            quantityText: item.quantityChange > 0 ? `+${item.quantityChange}` : `${item.quantityChange}`,
            unitCostText: formatMoneyWithSymbol(item.unitCost || 0)
          }))
        })
      })
      .catch((error) => {
        this.setData({
          errorMessage: error.message || '库存流水加载失败'
        })
      })
      .then(() => {
        this.setData({
          loading: false
        })
      })
  }
})
