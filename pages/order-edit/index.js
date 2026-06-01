const { createOrder } = require('../../services/orders')
const { formatDate } = require('../../utils/date')
const { yuanToFen, formatMoneyWithSymbol } = require('../../utils/money')
const { required, positiveNumber, nonNegativeNumber, validateRules } = require('../../utils/validators')

function parseDateText(value) {
  const parts = value.split('-').map((item) => Number(item))
  return new Date(parts[0], parts[1] - 1, parts[2]).getTime()
}

Page({
  data: {
    saving: false,
    selectedCustomer: null,
    selectedBisque: null,
    totalAmountText: '¥0.00',
    stockHint: '',
    form: {
      customerId: '',
      title: '',
      quantity: '',
      unitPriceYuan: '',
      totalAmount: 0,
      orderDateText: formatDate(Date.now()),
      deliveryDateText: formatDate(Date.now()),
      bisqueItemId: '',
      bisqueQuantity: '',
      note: ''
    }
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value

    this.setData({
      [`form.${field}`]: value
    })

    if (field === 'quantity' && !this.data.form.bisqueQuantity) {
      this.setData({
        'form.bisqueQuantity': value
      })
    }

    this.refreshTotal()
    this.refreshStockHint()
  },

  onOrderDateChange(e) {
    this.setData({
      'form.orderDateText': e.detail.value
    })
  },

  onDeliveryDateChange(e) {
    this.setData({
      'form.deliveryDateText': e.detail.value
    })
  },

  onCustomerChange(e) {
    this.setData({
      selectedCustomer: e.detail.item,
      'form.customerId': e.detail.id
    })
  },

  onBisqueChange(e) {
    this.setData({
      selectedBisque: e.detail.item,
      'form.bisqueItemId': e.detail.id
    })
    this.refreshStockHint()
  },

  refreshTotal() {
    const { quantity, unitPriceYuan } = this.data.form
    const totalAmount = Number(quantity || 0) * yuanToFen(unitPriceYuan)

    this.setData({
      'form.totalAmount': totalAmount,
      totalAmountText: formatMoneyWithSymbol(totalAmount)
    })
  },

  refreshStockHint() {
    const { selectedBisque } = this.data
    const bisqueQuantity = Number(this.data.form.bisqueQuantity || 0)

    if (!selectedBisque) {
      this.setData({
        stockHint: ''
      })
      return
    }

    const currentStock = Number(selectedBisque.currentStock || 0)
    const unit = selectedBisque.unit || '个'
    const enoughText = bisqueQuantity > currentStock ? '库存不足' : '库存可用'

    this.setData({
      stockHint: `${enoughText}：当前 ${currentStock}${unit}`
    })
  },

  save() {
    const form = this.data.form
    const bisqueQuantity = Number(form.bisqueQuantity)
    const stock = this.data.selectedBisque ? Number(this.data.selectedBisque.currentStock || 0) : 0
    const result = validateRules([
      () => required(form.customerId, '请选择客户'),
      () => required(form.title, '请填写产品名称'),
      () => positiveNumber(form.quantity, '订单数量必须大于 0'),
      () => nonNegativeNumber(form.unitPriceYuan, '订单单价不能小于 0'),
      () => required(form.bisqueItemId, '请选择素胚'),
      () => positiveNumber(form.bisqueQuantity, '素胚使用数量必须大于 0')
    ])

    if (!result.valid) {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
      return
    }

    if (bisqueQuantity > stock) {
      wx.showToast({
        title: '素胚库存不足',
        icon: 'none'
      })
      return
    }

    this.setData({
      saving: true
    })

    createOrder({
      customerId: form.customerId,
      title: form.title,
      quantity: Number(form.quantity),
      unitPrice: yuanToFen(form.unitPriceYuan),
      totalAmount: form.totalAmount,
      orderDate: parseDateText(form.orderDateText),
      deliveryDate: parseDateText(form.deliveryDateText),
      bisqueItemId: form.bisqueItemId,
      bisqueQuantity,
      note: form.note
    })
      .then(() => {
        wx.showToast({
          title: '已创建',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 400)
      })
      .catch((error) => {
        wx.showToast({
          title: error.message || '创建失败',
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
