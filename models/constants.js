const COLLECTIONS = {
  USERS: 'users',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  ORDER_PAYMENTS: 'order_payments',
  BISQUE_ITEMS: 'bisque_items',
  PURCHASE_ORDERS: 'purchase_orders',
  PURCHASE_ORDER_ITEMS: 'purchase_order_items',
  INVENTORY_TRANSACTIONS: 'inventory_transactions',
  ORDER_BISQUE_USAGES: 'order_bisque_usages',
  WORKERS: 'workers',
  ORDER_PROCESSES: 'order_processes',
  WAGE_RECORDS: 'wage_records',
  WAGE_SETTLEMENTS: 'wage_settlements',
  FIRING_BATCHES: 'firing_batches',
  FIRING_BATCH_ORDERS: 'firing_batch_orders',
  LEDGER_ENTRIES: 'ledger_entries',
  PRODUCT_TEMPLATES: 'product_templates'
}

const USER_ROLE = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  WORKER: 'worker'
}

const USER_ROLE_TEXT = {
  [USER_ROLE.ADMIN]: '管理员',
  [USER_ROLE.MANAGER]: '管理员助手',
  [USER_ROLE.WORKER]: '工人'
}

const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  WAITING_FIRING: 'waiting_firing',
  CHECKING: 'checking',
  PACKING: 'packing',
  SHIPPING: 'shipping',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

const ORDER_STATUS_TEXT = {
  [ORDER_STATUS.PENDING]: '待加工',
  [ORDER_STATUS.PROCESSING]: '加工中',
  [ORDER_STATUS.WAITING_FIRING]: '待烧制',
  [ORDER_STATUS.CHECKING]: '待检品',
  [ORDER_STATUS.PACKING]: '待包装',
  [ORDER_STATUS.SHIPPING]: '待发货',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [ORDER_STATUS.CANCELLED]: '已取消'
}

const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  DEPOSIT_PAID: 'deposit_paid',
  PARTIAL_PAID: 'partial_paid',
  PAID: 'paid'
}

const PAYMENT_STATUS_TEXT = {
  [PAYMENT_STATUS.UNPAID]: '未收款',
  [PAYMENT_STATUS.DEPOSIT_PAID]: '已收定金',
  [PAYMENT_STATUS.PARTIAL_PAID]: '部分收款',
  [PAYMENT_STATUS.PAID]: '已结清'
}

const PROCESS_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REWORK: 'rework',
  SKIPPED: 'skipped'
}

const PROCESS_STATUS_TEXT = {
  [PROCESS_STATUS.PENDING]: '未开始',
  [PROCESS_STATUS.PROCESSING]: '进行中',
  [PROCESS_STATUS.COMPLETED]: '已完成',
  [PROCESS_STATUS.REWORK]: '返工',
  [PROCESS_STATUS.SKIPPED]: '跳过'
}

const PRICE_TYPE = {
  PER_PIECE: 'per_piece',
  PER_BATCH: 'per_batch',
  PER_DAY: 'per_day',
  FIXED: 'fixed',
  MANUAL: 'manual'
}

const PRICE_TYPE_TEXT = {
  [PRICE_TYPE.PER_PIECE]: '按件',
  [PRICE_TYPE.PER_BATCH]: '按批',
  [PRICE_TYPE.PER_DAY]: '按天',
  [PRICE_TYPE.FIXED]: '固定金额',
  [PRICE_TYPE.MANUAL]: '手动调整'
}

const WAGE_STATUS = {
  UNSETTLED: 'unsettled',
  PARTIAL_SETTLED: 'partial_settled',
  SETTLED: 'settled'
}

const WAGE_STATUS_TEXT = {
  [WAGE_STATUS.UNSETTLED]: '未结算',
  [WAGE_STATUS.PARTIAL_SETTLED]: '部分结算',
  [WAGE_STATUS.SETTLED]: '已结算'
}

const PAYMENT_METHOD = {
  WECHAT: 'wechat',
  ALIPAY: 'alipay',
  CASH: 'cash',
  BANK: 'bank',
  OTHER: 'other'
}

const PAYMENT_METHOD_TEXT = {
  [PAYMENT_METHOD.WECHAT]: '微信',
  [PAYMENT_METHOD.ALIPAY]: '支付宝',
  [PAYMENT_METHOD.CASH]: '现金',
  [PAYMENT_METHOD.BANK]: '银行卡',
  [PAYMENT_METHOD.OTHER]: '其他'
}

const LEDGER_DIRECTION = {
  INCOME: 'income',
  EXPENSE: 'expense'
}

const INVENTORY_TRANSACTION_TYPE = {
  PURCHASE_IN: 'purchase_in',
  ORDER_OUT: 'order_out',
  DAMAGE_OUT: 'damage_out',
  ADJUST_IN: 'adjust_in',
  ADJUST_OUT: 'adjust_out',
  RETURN_IN: 'return_in'
}

module.exports = {
  COLLECTIONS,
  USER_ROLE,
  USER_ROLE_TEXT,
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  PAYMENT_STATUS,
  PAYMENT_STATUS_TEXT,
  PROCESS_STATUS,
  PROCESS_STATUS_TEXT,
  PRICE_TYPE,
  PRICE_TYPE_TEXT,
  WAGE_STATUS,
  WAGE_STATUS_TEXT,
  PAYMENT_METHOD,
  PAYMENT_METHOD_TEXT,
  LEDGER_DIRECTION,
  INVENTORY_TRANSACTION_TYPE
}
