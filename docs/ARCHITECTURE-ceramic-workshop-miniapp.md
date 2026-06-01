# 陶瓷素胚加工工坊管理小程序架构设计文档

## 1. 文档目标

本文档基于《陶瓷素胚加工工坊管理小程序 PRD》，用于指导项目的目录组织、核心模块划分、数据模型设计和代码规范。

当前项目根目录为：

```text
D:\projects\vibe\workshop
```

该目录已经包含微信开发者工具生成的原生小程序模板文件：

```text
app.js
app.json
app.wxss
project.config.json
project.private.config.json
sitemap.json
pages/
utils/
```

因此本项目第一版建议直接基于现有模板开发，采用 **微信原生小程序 + CloudBase 云开发**，暂不切换到 uni-app，避免重建项目和增加额外工程复杂度。

## 2. 技术栈

| 层级 | 技术选型 |
| --- | --- |
| 小程序框架 | 微信原生小程序 |
| 页面语言 | WXML + WXSS + JavaScript |
| 后端服务 | 腾讯云 CloudBase / 微信云开发 |
| 数据库 | CloudBase 云数据库 |
| 云函数 | Node.js |
| 文件存储 | CloudBase 云存储 |
| 登录方式 | 微信登录 openid |
| 权限模型 | users 集合维护角色 |
| 开发工具 | 微信开发者工具 + VS Code |
| 版本管理 | Git |

说明：

- 现有模板是原生微信小程序结构，不是 uni-app 结构。
- 当前用户规模小，原生小程序足够支撑第一版。
- 如果后续需要多端发布，再评估是否迁移到 uni-app。

## 3. 整体架构

```text
微信原生小程序
  |
  | 调用封装后的 service 方法
  v
CloudBase SDK
  |
  |----------------------|
  |                      |
  v                      v
云数据库              云函数
  |                      |
  |                      v
  |                  权限校验
  |                  多集合写入
  |                  工资计算
  |                  库存扣减
  |                  利润重算
  |
  v
云存储
  图片、凭证、附件
```

前端负责：

- 页面展示。
- 表单录入。
- 基础校验。
- 调用 service 层。
- 展示 loading、toast、确认弹窗。

云函数负责：

- 登录初始化。
- 权限校验。
- 创建订单等多集合联动写入。
- 工资计算。
- 库存扣减。
- 烧制成本分摊。
- 订单利润重算。

云数据库负责：

- 存储客户、订单、工序、工资、库存、账目等业务数据。

云存储负责：

- 订单图片。
- 素胚图片。
- 收付款凭证。
- 工资结算凭证。

## 4. 项目目录结构

推荐在现有模板基础上扩展为：

```text
workshop/
  app.js
  app.json
  app.wxss
  project.config.json
  project.private.config.json
  sitemap.json

  docs/
    PRD-ceramic-workshop-miniapp.md
    ARCHITECTURE-ceramic-workshop-miniapp.md

  pages/
    dashboard/
      index.js
      index.json
      index.wxml
      index.wxss
    orders/
      index.js
      index.json
      index.wxml
      index.wxss
    order-detail/
      index.js
      index.json
      index.wxml
      index.wxss
    order-edit/
      index.js
      index.json
      index.wxml
      index.wxss
    customers/
      index.js
      index.json
      index.wxml
      index.wxss
    customer-edit/
      index.js
      index.json
      index.wxml
      index.wxss
    inventory/
      index.js
      index.json
      index.wxml
      index.wxss
    purchase-edit/
      index.js
      index.json
      index.wxml
      index.wxss
    workers/
      index.js
      index.json
      index.wxml
      index.wxss
    wages/
      index.js
      index.json
      index.wxml
      index.wxss
    firing/
      index.js
      index.json
      index.wxml
      index.wxss
    ledger/
      index.js
      index.json
      index.wxml
      index.wxss
    templates/
      index.js
      index.json
      index.wxml
      index.wxss
    profile/
      index.js
      index.json
      index.wxml
      index.wxss

  components/
    empty-state/
    status-tag/
    money-text/
    order-card/
    process-timeline/
    customer-picker/
    worker-picker/
    bisque-picker/

  services/
    cloud.js
    auth.js
    customers.js
    orders.js
    inventory.js
    workers.js
    wages.js
    firing.js
    ledger.js
    templates.js

  models/
    constants.js
    schemas.js

  utils/
    util.js
    date.js
    money.js
    id.js
    validators.js

  cloudfunctions/
    login/
      index.js
      package.json
    createOrder/
      index.js
      package.json
    updateOrderProcess/
      index.js
      package.json
    settleWages/
      index.js
      package.json
    createPurchase/
      index.js
      package.json
    createFiringBatch/
      index.js
      package.json
    createLedgerEntry/
      index.js
      package.json
    recalcOrderProfit/
      index.js
      package.json
```

说明：

- 保留现有 `app.js`、`app.json`、`app.wxss`、`pages/`、`utils/`。
- 当前模板中的 `pages/index` 和 `pages/logs` 可以后续替换或删除。
- 新增 `services/`，统一封装 CloudBase 调用。
- 新增 `components/`，沉淀可复用业务组件。
- 新增 `models/`，维护常量、枚举和字段约定。
- 新增 `cloudfunctions/`，存放 CloudBase 云函数。
- 新增 `docs/`，存放 PRD 和架构文档。

## 5. 核心模块划分

### 5.1 登录与权限模块

功能：

- 微信登录。
- 获取 openid。
- 初始化用户档案。
- 根据 `users.role` 判断权限。

角色：

| 角色 | 说明 | 权限 |
| --- | --- | --- |
| admin | 你，开发者和系统管理员 | 全部权限 |
| manager | 父母日常使用 | 订单、客户、工序、工资、库存、记账 |
| worker | 工人，后续可开放 | 查看自己的工序和工资 |

MVP 阶段建议只实现 `admin` 和 `manager`。

### 5.2 首页看板模块

功能：

- 今日待办工序。
- 进行中订单。
- 临近交货订单。
- 未收款金额。
- 未结算工资。
- 素胚库存预警。

### 5.3 客户模块

功能：

- 新增 / 编辑客户。
- 创建订单时快速选择客户。
- 查看客户历史订单。
- 查看客户未结清金额。

### 5.4 订单模块

功能：

- 创建订单。
- 编辑订单。
- 查看订单详情。
- 关联客户。
- 关联使用素胚。
- 查看工序进度。
- 查看收款记录。
- 查看成本与利润。

### 5.5 自定义工序模块

功能：

- 订单内添加任意工序。
- 调整工序顺序。
- 分配工人。
- 录入加工数量、合格数量、损耗数量。
- 支持按件、按批、按天、固定金额计价。
- 自动生成工资记录。

### 5.6 工序模板 / 产品模板模块

功能：

- 保存常用产品模板。
- 保存默认素胚。
- 保存默认工序和默认工价。
- 创建订单时套用模板。

### 5.7 素胚采购与库存模块

功能：

- 素胚档案。
- 采购入库。
- 订单使用扣库存。
- 破损报损。
- 库存流水。
- 库存预警。

### 5.8 烧制批次模块

功能：

- 创建烧制批次。
- 关联多个订单。
- 记录烧制数量、合格数量、瑕疵数量、破损数量。
- 记录烧制成本。
- 分摊烧制成本到订单。

### 5.9 工人工资模块

功能：

- 工人档案。
- 由订单工序生成工资记录。
- 按工人、订单、日期统计工资。
- 工资结算。
- 自动生成工资支出账目。

### 5.10 记账模块

功能：

- 记录收入。
- 记录支出。
- 关联订单、采购单、烧制批次、工资结算单。
- 查看月度收支。
- 上传凭证图片。

### 5.11 订单利润模块

功能：

- 汇总订单收入。
- 汇总素胚成本。
- 汇总工人工资。
- 汇总烧制成本。
- 汇总包装物流和其他支出。
- 计算订单利润和利润率。

建议统一通过云函数 `recalcOrderProfit` 计算，避免页面里散落复杂计算。

## 6. 数据模型设计

### 6.1 通用约定

所有主要集合建议包含：

```js
{
  _id: string,
  createdAt: number,
  updatedAt: number,
  createdBy: string,
  updatedBy: string,
  deleted: boolean
}
```

约定：

- 时间统一使用毫秒时间戳。
- 金额统一使用“分”为单位存储。
- 重要业务数据优先软删除，不直接物理删除。

### 6.2 users 用户集合

```js
{
  _id: string,
  openid: string,
  name: string,
  phone: string,
  role: 'admin' | 'manager' | 'worker',
  workerId: string,
  enabled: boolean,
  createdAt: number,
  updatedAt: number
}
```

### 6.3 customers 客户集合

```js
{
  _id: string,
  name: string,
  contactName: string,
  phone: string,
  wechat: string,
  address: string,
  type: 'retail' | 'wholesale' | 'regular' | 'temporary',
  note: string,
  totalOrderAmount: number,
  unpaidAmount: number,
  createdAt: number,
  updatedAt: number,
  createdBy: string,
  deleted: boolean
}
```

### 6.4 orders 订单集合

```js
{
  _id: string,
  orderNo: string,
  customerId: string,
  customerName: string,
  title: string,
  quantity: number,
  unitPrice: number,
  totalAmount: number,
  paidAmount: number,
  unpaidAmount: number,
  orderDate: number,
  deliveryDate: number,
  status: 'pending' | 'processing' | 'waiting_firing' | 'checking' | 'packing' | 'shipping' | 'completed' | 'cancelled',
  paymentStatus: 'unpaid' | 'deposit_paid' | 'partial_paid' | 'paid',
  currentProcessId: string,
  note: string,
  imageFileIds: string[],
  profitSummary: {
    incomeAmount: number,
    bisqueCost: number,
    wageCost: number,
    firingCost: number,
    packageLogisticsCost: number,
    otherCost: number,
    profitAmount: number,
    profitRate: number,
    calculatedAt: number
  },
  createdAt: number,
  updatedAt: number,
  createdBy: string,
  deleted: boolean
}
```

### 6.5 order_payments 订单收款集合

```js
{
  _id: string,
  orderId: string,
  customerId: string,
  amount: number,
  paymentDate: number,
  paymentMethod: 'wechat' | 'alipay' | 'cash' | 'bank' | 'other',
  type: 'deposit' | 'final' | 'partial' | 'refund',
  ledgerEntryId: string,
  voucherFileIds: string[],
  note: string,
  createdAt: number,
  createdBy: string,
  deleted: boolean
}
```

### 6.6 bisque_items 素胚档案集合

```js
{
  _id: string,
  name: string,
  spec: string,
  unit: string,
  currentStock: number,
  averageCost: number,
  latestPurchasePrice: number,
  warningStock: number,
  imageFileIds: string[],
  note: string,
  createdAt: number,
  updatedAt: number,
  createdBy: string,
  deleted: boolean
}
```

### 6.7 purchase_orders 采购单集合

```js
{
  _id: string,
  purchaseNo: string,
  supplierName: string,
  purchaseDate: number,
  totalAmount: number,
  status: 'draft' | 'completed' | 'cancelled',
  ledgerEntryId: string,
  voucherFileIds: string[],
  note: string,
  createdAt: number,
  updatedAt: number,
  createdBy: string,
  deleted: boolean
}
```

### 6.8 purchase_order_items 采购明细集合

```js
{
  _id: string,
  purchaseOrderId: string,
  bisqueItemId: string,
  bisqueName: string,
  spec: string,
  quantity: number,
  unitPrice: number,
  totalAmount: number,
  receivedQuantity: number,
  brokenQuantity: number,
  createdAt: number,
  createdBy: string
}
```

### 6.9 inventory_transactions 库存流水集合

```js
{
  _id: string,
  itemType: 'bisque' | 'material' | 'package' | 'finished',
  itemId: string,
  itemName: string,
  type: 'purchase_in' | 'order_out' | 'damage_out' | 'adjust_in' | 'adjust_out' | 'return_in',
  quantityChange: number,
  stockAfter: number,
  unitCost: number,
  relatedType: 'purchase_order' | 'order' | 'firing_batch' | 'manual',
  relatedId: string,
  note: string,
  createdAt: number,
  createdBy: string
}
```

### 6.10 order_bisque_usages 订单素胚使用集合

```js
{
  _id: string,
  orderId: string,
  bisqueItemId: string,
  bisqueName: string,
  quantity: number,
  unitCost: number,
  totalCost: number,
  createdAt: number,
  createdBy: string,
  deleted: boolean
}
```

### 6.11 workers 工人集合

```js
{
  _id: string,
  name: string,
  phone: string,
  defaultProcessNames: string[],
  enabled: boolean,
  note: string,
  createdAt: number,
  updatedAt: number,
  createdBy: string,
  deleted: boolean
}
```

### 6.12 order_processes 订单工序集合

```js
{
  _id: string,
  orderId: string,
  processName: string,
  sortOrder: number,
  workerId: string,
  workerName: string,
  plannedQuantity: number,
  completedQuantity: number,
  qualifiedQuantity: number,
  damagedQuantity: number,
  priceType: 'per_piece' | 'per_batch' | 'per_day' | 'fixed',
  unitPrice: number,
  wageAmount: number,
  status: 'pending' | 'processing' | 'completed' | 'rework' | 'skipped',
  startedAt: number,
  completedAt: number,
  wageRecordId: string,
  note: string,
  createdAt: number,
  updatedAt: number,
  createdBy: string,
  deleted: boolean
}
```

### 6.13 wage_records 工资记录集合

```js
{
  _id: string,
  workerId: string,
  workerName: string,
  orderId: string,
  orderNo: string,
  orderProcessId: string,
  processName: string,
  quantity: number,
  priceType: 'per_piece' | 'per_batch' | 'per_day' | 'fixed' | 'manual',
  unitPrice: number,
  amount: number,
  status: 'unsettled' | 'partial_settled' | 'settled',
  settlementId: string,
  occurredAt: number,
  note: string,
  createdAt: number,
  updatedAt: number,
  createdBy: string,
  deleted: boolean
}
```

### 6.14 wage_settlements 工资结算集合

```js
{
  _id: string,
  settlementNo: string,
  workerId: string,
  workerName: string,
  periodStart: number,
  periodEnd: number,
  wageRecordIds: string[],
  payableAmount: number,
  adjustmentAmount: number,
  paidAmount: number,
  paidAt: number,
  paymentMethod: 'wechat' | 'alipay' | 'cash' | 'bank' | 'other',
  ledgerEntryId: string,
  voucherFileIds: string[],
  note: string,
  createdAt: number,
  createdBy: string,
  deleted: boolean
}
```

### 6.15 firing_batches 烧制批次集合

```js
{
  _id: string,
  batchNo: string,
  firingDate: number,
  kilnNo: string,
  totalQuantity: number,
  qualifiedQuantity: number,
  defectiveQuantity: number,
  damagedQuantity: number,
  firingCost: number,
  allocationMethod: 'by_quantity' | 'by_order_amount' | 'manual',
  status: 'draft' | 'completed' | 'cancelled',
  ledgerEntryId: string,
  note: string,
  createdAt: number,
  updatedAt: number,
  createdBy: string,
  deleted: boolean
}
```

### 6.16 firing_batch_orders 烧制批次订单关联集合

```js
{
  _id: string,
  firingBatchId: string,
  orderId: string,
  orderNo: string,
  quantity: number,
  qualifiedQuantity: number,
  defectiveQuantity: number,
  damagedQuantity: number,
  allocatedCost: number,
  createdAt: number,
  createdBy: string
}
```

### 6.17 ledger_entries 账目集合

```js
{
  _id: string,
  direction: 'income' | 'expense',
  category: 'order_payment' | 'bisque_purchase' | 'wage' | 'firing' | 'package' | 'logistics' | 'rent' | 'repair' | 'other',
  amount: number,
  occurredAt: number,
  paymentMethod: 'wechat' | 'alipay' | 'cash' | 'bank' | 'other',
  relatedType: 'order' | 'purchase_order' | 'firing_batch' | 'wage_settlement' | 'manual',
  relatedId: string,
  handledBy: string,
  voucherFileIds: string[],
  note: string,
  createdAt: number,
  updatedAt: number,
  createdBy: string,
  deleted: boolean
}
```

### 6.18 product_templates 产品模板集合

```js
{
  _id: string,
  name: string,
  defaultBisqueItemId: string,
  defaultBisqueName: string,
  defaultUnitPrice: number,
  processTemplates: [
    {
      processName: string,
      sortOrder: number,
      priceType: 'per_piece' | 'per_batch' | 'per_day' | 'fixed',
      unitPrice: number,
      defaultWorkerId: string
    }
  ],
  note: string,
  enabled: boolean,
  createdAt: number,
  updatedAt: number,
  createdBy: string,
  deleted: boolean
}
```

## 7. 关键业务写入流程

### 7.1 创建订单

云函数：`createOrder`

```text
校验用户权限
  -> 创建 orders
  -> 写入 order_bisque_usages
  -> 扣减 bisque_items.currentStock
  -> 写入 inventory_transactions
  -> 如果选择模板，创建 order_processes
  -> 返回订单 ID
```

### 7.2 更新工序并生成工资

云函数：`updateOrderProcess`

```text
校验用户权限
  -> 更新 order_processes
  -> 根据计价方式计算 wageAmount
  -> 创建或更新 wage_records
  -> 更新订单 currentProcessId / status
  -> 触发 recalcOrderProfit
```

### 7.3 工资结算

云函数：`settleWages`

```text
校验用户权限
  -> 查询未结 wage_records
  -> 创建 wage_settlements
  -> 更新 wage_records.status
  -> 创建 ledger_entries 支出记录
```

### 7.4 创建采购单

云函数：`createPurchase`

```text
校验用户权限
  -> 创建 purchase_orders
  -> 创建 purchase_order_items
  -> 更新 bisque_items 库存和成本
  -> 写入 inventory_transactions
  -> 创建 ledger_entries 支出记录
```

### 7.5 创建烧制批次

云函数：`createFiringBatch`

```text
校验用户权限
  -> 创建 firing_batches
  -> 创建 firing_batch_orders
  -> 按规则分摊烧制成本
  -> 创建 ledger_entries 支出记录
  -> 记录损耗
  -> 触发相关订单 recalcOrderProfit
```

## 8. CloudBase 集合与索引建议

建议集合：

```text
users
customers
orders
order_payments
bisque_items
purchase_orders
purchase_order_items
inventory_transactions
order_bisque_usages
workers
order_processes
wage_records
wage_settlements
firing_batches
firing_batch_orders
ledger_entries
product_templates
```

建议索引：

| 集合 | 索引字段 |
| --- | --- |
| orders | customerId, status, paymentStatus, deliveryDate, createdAt |
| order_processes | orderId, workerId, status, completedAt |
| wage_records | workerId, status, occurredAt, orderId |
| ledger_entries | direction, category, occurredAt, relatedType, relatedId |
| inventory_transactions | itemId, type, createdAt |
| purchase_orders | purchaseDate, supplierName |
| firing_batches | firingDate, status |
| customers | name, phone |

## 9. 代码规范建议

### 9.1 命名规范

- 页面目录使用小写短横线，如 `order-detail`。
- 组件目录使用小写短横线，如 `order-card`。
- service 文件使用复数名词，如 `orders.js`、`customers.js`。
- 函数使用 `camelCase`，如 `createOrder`。
- 常量使用 `UPPER_SNAKE_CASE`，如 `ORDER_STATUS_TEXT`。
- 数据库集合使用小写下划线，如 `wage_records`。

### 9.2 页面代码规范

页面只负责：

- 页面状态。
- 用户交互。
- 调用 service。
- 展示数据。

页面中不直接写复杂数据库查询，不直接写工资、利润、库存等核心计算。

### 9.3 service 层规范

`services/` 统一封装 CloudBase 调用。

示例：

```js
async function getOrderDetail(orderId) {
  return db.collection('orders').doc(orderId).get()
}

async function createOrder(input) {
  return wx.cloud.callFunction({
    name: 'createOrder',
    data: input
  })
}

module.exports = {
  getOrderDetail,
  createOrder
}
```

### 9.4 云函数返回格式

所有云函数统一返回：

```js
{
  success: true,
  data: {}
}
```

错误时：

```js
{
  success: false,
  errorCode: 'NO_PERMISSION',
  errorMessage: '没有操作权限'
}
```

云函数必须做：

- 用户身份校验。
- 权限校验。
- 参数校验。
- 业务规则校验。
- 关键操作写入创建人和更新时间。

### 9.5 金额规范

金额统一使用“分”为单位存储。

```text
12.50 元 -> 1250
```

展示时再格式化：

```js
function formatMoney(amount) {
  return (amount / 100).toFixed(2)
}
```

### 9.6 时间规范

- 数据库存储统一使用毫秒时间戳。
- 页面展示时格式化为 `YYYY-MM-DD` 或 `YYYY-MM-DD HH:mm`。
- 日期筛选使用当天开始时间和结束时间。

### 9.7 状态值规范

状态值用英文，页面展示统一映射中文。

```js
const ORDER_STATUS_TEXT = {
  pending: '待加工',
  processing: '加工中',
  waiting_firing: '待烧制',
  checking: '待检品',
  packing: '待包装',
  shipping: '待发货',
  completed: '已完成',
  cancelled: '已取消'
}
```

### 9.8 表单校验规范

必填规则：

- 订单：客户、产品名称、数量、总金额。
- 工序：工序名称、数量、计价方式。
- 采购：素胚、数量、单价。
- 工资结算：工人、结算记录、实发金额。
- 账目：类型、分类、金额、日期。

数值规则：

- 数量不能小于 0。
- 金额不能小于 0。
- 完成数量不能大于计划数量，除非明确允许超额。
- 损耗数量不能大于处理数量。
- 已结算工资不直接修改，通过调整记录处理。

### 9.9 软删除规范

重要业务数据使用软删除：

```js
{
  deleted: true,
  deletedAt: Date.now(),
  deletedBy: userId
}
```

适用对象：

- 订单。
- 客户。
- 工序。
- 工资记录。
- 采购单。
- 账目。

## 10. 开发顺序建议

推荐顺序：

1. 初始化 CloudBase 环境。
2. 创建 `services/cloud.js`。
3. 登录与用户角色。
4. 客户管理。
5. 素胚档案和采购入库。
6. 订单创建和订单列表。
7. 订单详情。
8. 自定义工序。
9. 工资记录生成。
10. 工资结算。
11. 记账模块。
12. 烧制批次。
13. 订单利润统计。
14. 首页经营看板。
15. 图片上传和凭证附件。

这样可以先跑通“客户 -> 素胚 -> 订单 -> 工序 -> 工资”的主链路，再逐步补上利润和看板。

## 11. MVP 边界

第一版不做：

- 多门店。
- 复杂审批流。
- 完整会计系统。
- 复杂权限矩阵。
- 离线同步。
- 自动财务报表。

第一版必须跑通：

- 客户能录。
- 订单能管。
- 素胚库存能扣。
- 工序能自定义。
- 工资能自动算。
- 收支能记。
- 订单利润能看。

