# 陶瓷素胚加工工坊管理小程序

这是一个面向小型陶瓷素胚加工工坊的轻量级经营管理小程序。第一版不追求完整 ERP，而是优先解决家庭工坊日常最容易乱的几件事：订单进度、素胚库存、加工工序、工人工资、收支记账和订单利润。

## 项目依据

- 产品需求文档：[docs/PRD-ceramic-workshop-miniapp.md](docs/PRD-ceramic-workshop-miniapp.md)
- 架构设计文档：[docs/ARCHITECTURE-ceramic-workshop-miniapp.md](docs/ARCHITECTURE-ceramic-workshop-miniapp.md)

## 技术方案

本项目基于当前微信开发者工具生成的原生小程序模板继续开发。

| 层级 | 方案 |
| --- | --- |
| 小程序框架 | 微信原生小程序 |
| 页面开发 | WXML + WXSS + JavaScript |
| 后端服务 | CloudBase / 微信云开发 |
| 数据库 | CloudBase 云数据库 |
| 云函数 | Node.js |
| 文件存储 | CloudBase 云存储 |
| 登录方式 | 微信登录 openid |
| 权限模型 | `users` 集合维护角色 |

## MVP 目标

第一版必须跑通以下闭环：

```text
客户录入
  -> 素胚采购入库
  -> 创建订单并扣减素胚库存
  -> 添加或套用工序
  -> 完成工序并生成工资
  -> 结算工资并生成支出
  -> 记录订单收款
  -> 计算订单利润
  -> 首页查看待办、收款、工资和库存预警
```

MVP 暂不做多门店、复杂审批、完整会计系统、复杂权限矩阵、离线同步、自动财务报表和 Excel 导入导出。

## 核心模块

- 首页看板：订单待办、临近交货、未收款、未结工资、库存预警。
- 客户管理：客户档案、历史订单、欠款金额。
- 素胚采购与库存：素胚档案、采购入库、订单扣减、报损、库存流水。
- 订单管理：订单创建、编辑、详情、收款、成本和利润。
- 自定义工序：工序排序、工人分配、数量录入、损耗记录、工资计算。
- 产品模板：常用产品默认素胚、工序和工价。
- 工人工资：工资记录、按工人统计、工资结算。
- 记账管理：收入、支出、关联业务单据、月度汇总。
- 烧制批次：多订单关联、烧制成本、瑕疵和损耗、成本分摊。
- 订单利润：汇总收入、素胚成本、工资、烧制成本和其他支出。

## 推荐目录结构

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
    orders/
    order-detail/
    order-edit/
    customers/
    customer-edit/
    inventory/
    purchase-edit/
    workers/
    wages/
    firing/
    ledger/
    templates/
    profile/

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
    createOrder/
    updateOrderProcess/
    settleWages/
    createPurchase/
    createFiringBatch/
    createLedgerEntry/
    recalcOrderProfit/
```

## 开发计划

### 第 0 阶段：项目初始化

目标：让项目具备稳定的基础工程结构。

- 确认微信开发者工具可正常打开 `workshop` 项目。
- 初始化 CloudBase 环境，并在 `app.js` 中完成云开发初始化。
- 新增 `services/cloud.js`，统一封装数据库、云函数和云存储入口。
- 新增 `models/constants.js`，维护订单状态、收款状态、工资状态、支付方式等枚举。
- 新增 `utils/date.js`、`utils/money.js`、`utils/id.js`、`utils/validators.js`。

验收标准：

- 小程序可正常启动。
- 页面可调用 CloudBase。
- 常量、金额、日期和表单校验工具有统一入口。

### 第 1 阶段：登录与基础权限

目标：建立用户身份和简单角色体系。

- 实现 `login` 云函数，获取 openid。
- 创建 `users` 集合。
- 初始化 `admin`、`manager` 两类角色。
- 新增 `services/auth.js`。
- 新增 `pages/profile`，展示当前用户和角色。

验收标准：

- 用户进入小程序后能完成登录初始化。
- 云函数可以识别当前用户和角色。
- 未启用用户或无权限用户不能执行关键写入。

### 第 2 阶段：客户与素胚基础资料

目标：先建立订单会依赖的基础资料。

- 实现客户列表、新增、编辑和搜索。
- 创建 `customers` 集合。
- 实现素胚档案列表、新增、编辑和库存预警值维护。
- 创建 `bisque_items` 集合。
- 新增 `customer-picker`、`bisque-picker` 组件。

验收标准：

- 创建订单时可选择已有客户和素胚。
- 客户、素胚支持软删除。
- 素胚库存、平均成本、最近采购价可展示。

### 第 3 阶段：采购入库与库存流水

目标：让素胚库存从采购开始有据可查。

- 实现 `createPurchase` 云函数。
- 创建 `purchase_orders`、`purchase_order_items`、`inventory_transactions` 集合。
- 实现采购入库页面 `pages/purchase-edit`。
- 在 `pages/inventory` 展示库存列表和库存流水。
- 采购完成后自动更新素胚库存和成本。
- 采购完成后自动生成一条支出账目。

验收标准：

- 新增采购单后库存自动增加。
- 破损数量能记录。
- 库存流水能追溯到采购单。

### 第 4 阶段：订单创建与订单列表

目标：跑通核心主线的订单入口。

- 实现 `createOrder` 云函数。
- 创建 `orders`、`order_bisque_usages` 集合。
- 实现订单创建页 `pages/order-edit`。
- 实现订单列表页 `pages/orders`，支持按状态、收款状态、客户、日期筛选。
- 创建订单时扣减素胚库存，并写入库存流水。

验收标准：

- 可创建订单并关联客户。
- 可选择订单使用的素胚和数量。
- 订单创建后素胚库存自动扣减。
- 订单列表能清楚显示订单编号、客户、产品、交货日期、订单状态和收款状态。

### 第 5 阶段：订单详情与自定义工序

目标：让订单能真实跟踪加工过程。

- 实现订单详情页 `pages/order-detail`。
- 创建 `order_processes` 集合。
- 实现工序新增、编辑、排序、跳过和完成。
- 实现 `updateOrderProcess` 云函数。
- 支持按件、按批、按天、固定金额四种计价方式。
- 工序完成后自动计算工资金额。

验收标准：

- 订单详情能展示基础信息、素胚使用、工序进度和当前状态。
- 工序完成后能自动生成或更新工资记录。
- 工序损耗数量能记录，并可用于后续利润和库存核对。

### 第 6 阶段：产品模板与工序复用

目标：减少重复录入，让家人使用时更顺手。

- 创建 `product_templates` 集合。
- 实现模板列表和编辑页 `pages/templates`。
- 模板支持默认素胚、默认售价、默认工序、默认工价和默认工人。
- 创建订单时可套用模板，并允许继续调整。

验收标准：

- 常用产品能保存为模板。
- 选择模板后，订单自动带出素胚和工序。
- 模板带出的工序仍可在订单内修改。

### 第 7 阶段：工人工资与结算

目标：让工资从工序自动产生，并可按周期结算。

- 创建 `workers`、`wage_records`、`wage_settlements` 集合。
- 实现工人档案页 `pages/workers`。
- 实现工资统计和结算页 `pages/wages`。
- 实现 `settleWages` 云函数。
- 工资结算后自动生成支出账目。

验收标准：

- 工序完成后能按工人生成未结工资。
- 可按工人、日期范围查看工资明细。
- 可生成工资结算单并标记为已结算。
- 已结算工资不直接修改，后续通过调整记录处理。

### 第 8 阶段：记账与订单收款

目标：让收入支出可追踪，并能关联业务单据。

- 创建 `ledger_entries`、`order_payments` 集合。
- 实现记账页 `pages/ledger`。
- 支持手动新增收入和支出。
- 支持订单收款，并自动更新订单已收、未收和收款状态。
- 支持按月查看收入、支出和结余。
- 实现 `createLedgerEntry` 云函数。

验收标准：

- 订单定金、尾款可记录。
- 收款后订单收款状态自动变化。
- 采购、工资、烧制等自动账目可追溯来源。
- 手动记账可独立记录其他收入和支出。

### 第 9 阶段：烧制批次

目标：处理烧制跨订单、成本分摊和损耗记录。

- 创建 `firing_batches`、`firing_batch_orders` 集合。
- 实现烧制批次页 `pages/firing`。
- 实现 `createFiringBatch` 云函数。
- 支持一个烧制批次关联多个订单。
- 支持按数量、按订单金额或手动分摊烧制成本。
- 记录合格、瑕疵、破损数量。

验收标准：

- 烧制成本能分摊到订单。
- 烧制损耗能关联到订单。
- 烧制完成后触发相关订单利润重算。

### 第 10 阶段：订单利润与首页看板

目标：补齐经营视角，让负责人能快速看清状况。

- 实现 `recalcOrderProfit` 云函数。
- 在订单详情展示收入、素胚成本、工资成本、烧制成本、其他支出、利润和利润率。
- 实现首页看板 `pages/dashboard`。
- 首页展示进行中订单、临近交货订单、未收款金额、未结工资、库存预警和本月收支。

验收标准：

- 每个订单都能看到基本利润。
- 订单相关成本变化后利润会重算。
- 首页能快速暴露待办、异常和未结事项。

### 第 11 阶段：图片、凭证与体验打磨

目标：补全日常使用中需要留证和核对的能力。

- 接入 CloudBase 云存储。
- 支持订单图片、素胚图片、收付款凭证、工资结算凭证上传。
- 增加空状态、状态标签、金额展示、订单卡片、工序时间线等通用组件。
- 优化表单默认值、二次确认、loading、toast 和错误提示。
- 检查软删除、权限校验、金额单位和时间格式是否一致。

验收标准：

- 关键单据可上传凭证。
- 常用页面操作路径短、提示清楚。
- 误删和错误录入有基本防护。

## 数据集合清单

MVP 建议创建以下 CloudBase 集合：

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

## 代码约定

- 页面目录使用小写短横线，如 `order-detail`。
- 组件目录使用小写短横线，如 `order-card`。
- service 文件使用复数名词，如 `orders.js`、`customers.js`。
- 函数使用 `camelCase`。
- 常量使用 `UPPER_SNAKE_CASE`。
- 数据库集合使用小写下划线，如 `wage_records`。
- 金额统一用“分”为单位存储，展示时再格式化为元。
- 时间统一用毫秒时间戳存储。
- 重要业务数据使用软删除。
- 页面只负责展示、交互和调用 service，库存、工资、利润等核心计算放在云函数。

## 后续增强

- Excel 导入 / 导出。
- 微信订阅消息提醒。
- 更完整的材料库存管理。
- 成品库存和零售出库。
- 多门店 / 多工坊。
- 条码或二维码扫码管理订单和库存。
- 月度经营报表。
- 客户对账单。
- 工人端确认工资。
