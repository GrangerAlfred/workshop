const { getBisqueItem, saveBisqueItem } = require('../../services/inventory')
const { yuanToFen, formatMoney } = require('../../utils/money')
const { required, nonNegativeNumber, validateRules } = require('../../utils/validators')

Page({
  data: {
    id: '',
    loading: false,
    saving: false,
    form: {
      name: '',
      spec: '',
      unit: '个',
      currentStock: '0',
      averageCostYuan: '0.00',
      latestPurchasePriceYuan: '0.00',
      warningStock: '0',
      note: ''
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        id: options.id
      })
      this.loadItem(options.id)
    }
  },

  loadItem(id) {
    this.setData({
      loading: true
    })

    getBisqueItem(id)
      .then((item) => {
        this.setData({
          form: {
            name: item.name || '',
            spec: item.spec || '',
            unit: item.unit || '个',
            currentStock: item.currentStock,
            averageCostYuan: formatMoney(item.averageCost || 0),
            latestPurchasePriceYuan: formatMoney(item.latestPurchasePrice || 0),
            warningStock: item.warningStock,
            note: item.note || ''
          }
        })
      })
      .catch((error) => {
        wx.showToast({
          title: error.message || '加载失败',
          icon: 'none'
        })
      })
      .then(() => {
        this.setData({
          loading: false
        })
      })
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field

    this.setData({
      [`form.${field}`]: e.detail.value
    })
  },

  save() {
    const form = this.data.form
    const result = validateRules([
      () => required(form.name, '请填写素胚名称'),
      () => nonNegativeNumber(form.currentStock, '库存不能小于 0'),
      () => nonNegativeNumber(form.warningStock, '预警值不能小于 0'),
      () => nonNegativeNumber(form.averageCostYuan, '平均成本不能小于 0'),
      () => nonNegativeNumber(form.latestPurchasePriceYuan, '最近采购价不能小于 0')
    ])

    if (!result.valid) {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
      return
    }

    this.setData({
      saving: true
    })

    saveBisqueItem({
      _id: this.data.id,
      name: form.name,
      spec: form.spec,
      unit: form.unit || '个',
      currentStock: form.currentStock,
      averageCost: yuanToFen(form.averageCostYuan),
      latestPurchasePrice: yuanToFen(form.latestPurchasePriceYuan),
      warningStock: form.warningStock,
      note: form.note
    })
      .then(() => {
        wx.showToast({
          title: '已保存',
          icon: 'success'
        })
        wx.navigateBack()
      })
      .catch((error) => {
        wx.showToast({
          title: error.message || '保存失败',
          icon: 'none'
        })
      })
      .then(() => {
        this.setData({
          saving: false
        })
      })
  }
})
