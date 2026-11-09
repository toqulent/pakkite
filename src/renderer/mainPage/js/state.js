const Store = require('electron-store')

const defaultsJson = require('./defaults.json')

// Shared state for the main page - a singleton every module requires
exports.state = {
  allPackets: [],
  allPacketsHTML: [],
  proxyCapabilities: {},
  packetList: document.getElementById('packetlist'),
  hiddenPackets: undefined,
  lastFilter: '',
  lastRenderedIndex: 0,
  hiddenPacketsAmount: 0,
  packetsUpdated: false,
  store: new Store()
}

exports.getVersionSpecificVar = function (name, defaultValue) {
  const versionId = 'version-' + exports.state.proxyCapabilities.versionId
  let settingsObject = exports.state.store.get(versionId)
  if (!settingsObject) {
    settingsObject = {}
  }
  if (!settingsObject[name]) {
    settingsObject[name] = JSON.stringify(defaultValue)
    exports.state.store.set(versionId, settingsObject)
  }
  return JSON.parse(settingsObject[name])
}

exports.setVersionSpecificVar = function (name, value) {
  const versionId = 'version-' + exports.state.proxyCapabilities.versionId
  const settingsObject = exports.state.store.get(versionId)
  settingsObject[name] = JSON.stringify(value)
  exports.state.store.set(versionId, settingsObject)
}

exports.findDefault = function (setting) {
  const versionId = exports.state.proxyCapabilities.versionId
  for (const key in defaultsJson) {
    if (versionId.match(new RegExp(key))) {
      return defaultsJson[key][setting]
    }
  }
}
