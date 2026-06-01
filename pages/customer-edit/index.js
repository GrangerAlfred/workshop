const { getCustomer, saveCustomer } = require('../../services/customers')
const { CUSTOMER_TYPE, CUSTOMER_TYPE_TEXT } = require('../../models/constants')
const { required, validateRules } = require('../../utils/validators')

const customerTypes = [
  CUSTOMER_TYPE.RETAIL,
  CUSTOMER_TYPE.WHOLESALE,
  CUSTOMER_TYPE.REGULAR,
  CUSTOMER_TYPE.TEMPORARY
]

Page({
  data: {
    id: '',
    loading: false,
    saving: false,
    typeIndex: 0,
    typeOptions: customerTypes.map((type) => CUSTOMER_TYPE_TEXT[type]),
    form: {
      name: '',
      contactName: '',
      phone: '',
      wechat: '',
      address: '',
      type: CUSTOMER_TYPE.RETAIL,
      note: ''
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        id: options.id
      })
      this.loadCustomer(options.id)
    }
  },

  loadCustomer(id) {
    this.setData({
      loading: true
    })

    getCustomer(id)
      .then((customer) => {
        const typeIndex = customerTypes.indexOf(customer.type)
        this.setData({
          form: Object.assign({}, this.data.form, customer),
          typeIndex: typeIndex >= 0 ? typeIndex : 0
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

  onTypeChange(e) {
    const typeIndex = Number(e.detail.value)

    this.setData({
      typeIndex,
      'form.type': customerTypes[typeIndex]
    })
  },

  save() {
    const form = this.data.form
    const result = validateRules([
      () => required(form.name, '请填写客户名称')
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

    saveCustomer(Object.assign({}, form, {
      _id: this.data.id
    }))
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
