const { listBisqueItems } = require('../../services/inventory')

Component({
  properties: {
    value: {
      type: String,
      value: '',
      observer() {
        this.updateSelected()
      }
    },
    placeholder: {
      type: String,
      value: '选择素胚'
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  data: {
    items: [],
    names: ['请选择素胚'],
    selectedIndex: 0,
    displayText: ''
  },

  lifetimes: {
    attached() {
      this.loadOptions()
    }
  },

  methods: {
    loadOptions() {
      listBisqueItems()
        .then((items) => {
          this.setData({
            items,
            names: ['请选择素胚'].concat(items.map((item) => `${item.name}${item.spec ? ` / ${item.spec}` : ''}`))
          })
          this.updateSelected()
        })
        .catch(() => {
          this.setData({
            items: [],
            names: ['请选择素胚'],
            selectedIndex: 0,
            displayText: ''
          })
        })
    },

    updateSelected() {
      const { items, value } = this.data
      const itemIndex = items.findIndex((item) => item._id === value)
      const selectedIndex = itemIndex >= 0 ? itemIndex + 1 : 0
      const selected = itemIndex >= 0 ? items[itemIndex] : null

      this.setData({
        selectedIndex,
        displayText: selected ? `${selected.name}${selected.spec ? ` / ${selected.spec}` : ''}` : ''
      })
    },

    onChange(e) {
      const selectedIndex = Number(e.detail.value)
      const item = this.data.items[selectedIndex - 1]

      if (!item) {
        this.setData({
          selectedIndex: 0,
          displayText: ''
        })
        return
      }

      const displayText = `${item.name}${item.spec ? ` / ${item.spec}` : ''}`

      this.setData({
        selectedIndex,
        displayText
      })
      this.triggerEvent('change', {
        id: item._id,
        item
      })
    }
  }
})
