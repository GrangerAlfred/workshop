const { createPurchase } = require('../../services/purchases')
const { PAYMENT_METHOD, PAYMENT_METHOD_TEXT } = require('../../models/constants')
const { formatDate } = require('../../utils/date')
const { yuanToFen, formatMoneyWithSymbol } = require('../../utils/money')
const { required, positiveNumber, nonNegativeNumber, validateRules } = require('../../utils/validators')

const paymentMethods = [
  PAYMENT_METHOD.WECHAT,
  PAYMENT_METHOD.ALIPAY,
  PAYMENT_METHOD.CASH,
  PAYMENT_METHOD.BANK,
  PAYMENT_METHOD.OTHER
]

function parseDateText(value) {
  const parts = value.split('-').map((item) => Number(item))
  return new Date(parts[0], parts[1] - 1, parts[2]).getTime()
}

Page({
  data: {
    saving: false,
    selectedBisque: null,
    paymentMethodIndex: 0,
    paymentMethodOptions: paymentMethods.map((method) => PAYMENT_METHOD_TEXT[method]),
    totalAmountText: '¥0.00',
    form: {
      supplierName: '',
      purchaseDateText: formatDate(Date.now()),
      bisqueItemId: '',
      quantity: '',
      brokenQuantity: '0',
      unitPriceYuan: '',
      paymentMethod: PAYMENT_METHOD.WECHAT,
      note: ''
    }
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field

    this.setData({
      [`form.${field}`]: e.detail.value
    })
    this.refreshTotal()
  },

  onDateChange(e) {
    this.setData({
      'form.purchaseDateText': e.detail.value
    })
  },

  onPaymentMethodChange(e) {
    const paymentMethodIndex = Number(e.detail.value)

    this.setData({
      paymentMethodIndex,
      'form.paymentMethod': paymentMethods[paymentMethodIndex]
    })
  },

  onBisqueChange(e) {
    this.setData({
      selectedBisque: e.detail.item,
      'form.bisqueItemId': e.detail.id
    })
  },

  refreshTotal() {
    const { quantity, unitPriceYuan } = this.data.form
    const totalAmount = Number(quantity || 0) * yuanToFen(unitPriceYuan)

    this.setData({
      totalAmountText: formatMoneyWithSymbol(totalAmount)
    })
  },

  save() {
    const form = this.data.form
    const quantity = Number(form.quantity)
    const brokenQuantity = Number(form.brokenQuantity || 0)
    const result = validateRules([
      () => required(form.supplierName, '请填写供应商'),
      () => required(form.bisqueItemId, '请选择素胚'),
      () => positiveNumber(form.quantity, '采购数量必须大于 0'),
      () => nonNegativeNumber(form.brokenQuantity, '破损数量不能小于 0'),
      () => nonNegativeNumber(form.unitPriceYuan, '采购单价不能小于 0')
    ])

    if (!result.valid) {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
      return
    }

    if (brokenQuantity > quantity) {
      wx.showToast({
        title: '破损数量不能大于采购数量',
        icon: 'none'
      })
      return
    }

    this.setData({
      saving: true
    })

    createPurchase({
      supplierName: form.supplierName,
      purchaseDate: parseDateText(form.purchaseDateText),
      paymentMethod: form.paymentMethod,
      note: form.note,
      items: [
        {
          bisqueItemId: form.bisqueItemId,
          quantity,
          brokenQuantity,
          unitPrice: yuanToFen(form.unitPriceYuan),
          note: form.note
        }
      ]
    })
      .then((resultData) => {
        wx.showToast({
          title: '已入库',
          icon: 'success'
        })
        setTimeout(() => {
          wx.redirectTo({
            url: `../inventory-transactions/index?purchaseNo=${resultData.purchaseNo}`
          })
        }, 400)
      })
      .catch((error) => {
        wx.showToast({
          title: error.message || '入库失败',
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
