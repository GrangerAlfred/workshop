const DEFAULT_CLOUD_CONFIG = {
  env: 'cloud1-d3gzoqymc78e187e5',
  traceUser: true
}

let initialized = false
let db = null
let command = null

function hasCloud() {
  return typeof wx !== 'undefined' && wx.cloud
}

function getCloudConfig(options = {}) {
  return Object.assign({}, DEFAULT_CLOUD_CONFIG, options)
}

function initCloud(options = {}) {
  if (!hasCloud()) {
    return {
      success: false,
      errorCode: 'WX_CLOUD_UNAVAILABLE',
      errorMessage: '当前环境不支持 wx.cloud'
    }
  }

  if (!initialized) {
    wx.cloud.init(getCloudConfig(options))
    initialized = true
  }

  return {
    success: true
  }
}

function ensureCloud() {
  const result = initCloud()

  if (!result.success) {
    throw new Error(result.errorMessage)
  }
}

function getDb() {
  ensureCloud()

  if (!db) {
    db = wx.cloud.database()
  }

  return db
}

function getCommand() {
  if (!command) {
    command = getDb().command
  }

  return command
}

function callFunction(name, data = {}) {
  ensureCloud()

  return wx.cloud.callFunction({
    name,
    data
  })
}

function uploadFile(cloudPath, filePath) {
  ensureCloud()

  return wx.cloud.uploadFile({
    cloudPath,
    filePath
  })
}

function deleteFile(fileList) {
  ensureCloud()

  return wx.cloud.deleteFile({
    fileList
  })
}

function getTempFileURL(fileList) {
  ensureCloud()

  return wx.cloud.getTempFileURL({
    fileList
  })
}

module.exports = {
  initCloud,
  getDb,
  getCommand,
  callFunction,
  uploadFile,
  deleteFile,
  getTempFileURL
}
