const { ipcRenderer } = require('electron')
const Store = require('electron-store')
const minecraftData = require('minecraft-data')

const store = new Store()

const values = {}

let isLoading = false

populateVersions()
loadSetting('lastVersion', 'version', 'version', document.getElementById('version').options[0].value)
if (document.getElementById('version').value === '') {
  document.getElementById('version').value = document.getElementById('version').options[0].value
}
loadSetting('lastConnectAddress', 'connectAddress', 'connect-address', '127.0.0.1')
loadSetting('lastConnectPort', 'connectPort', 'connect-port', '25565')
loadSetting('lastListenPort', 'listenPort', 'listen-port', '25566')
loadSetting('lastOnlineMode', 'onlineMode', 'auth-online', true)
loadSetting('lastOfflineUsername', 'offlineUsername', 'offline-username', 'Player')

function updateOfflineRow () {
  const showOfflineRow = !document.getElementById('auth-online').checked
  document.getElementById('offline-row').style.display = showOfflineRow ? 'block' : 'none'
}

document.getElementById('auth-online').addEventListener('change', updateOfflineRow)
updateOfflineRow()

function populateVersions () {
  const versionSelect = document.getElementById('version')
  const releases = minecraftData.supportedVersions.pc.filter(v => /^\d+\.\d+(\.\d+)?$/.test(v)).reverse()

  for (const version of releases) {
    const option = document.createElement('option')
    option.value = version
    option.textContent = version
    versionSelect.appendChild(option)
  }
}

function saveSettings () {
  store.set('lastVersion', values.version)
  store.set('lastConnectAddress', values.connectAddress)
  store.set('lastConnectPort', values.connectPort)
  store.set('lastListenPort', values.listenPort)
  store.set('lastOnlineMode', values.onlineMode)
  store.set('lastOfflineUsername', values.offlineUsername)
}

function loadSetting (name, key, elementID, defaultValue) {
  if (!store.has(name)) {
    store.set(name, defaultValue)
  }

  values[key] = store.get(name)
  const element = document.getElementById(elementID)
  if (element.type === 'checkbox') {
    element.checked = values[key]
  } else {
    element.value = values[key]
  }
}

function readForm () {
  values.connectAddress = document.getElementById('connect-address').value
  values.connectPort = document.getElementById('connect-port').value
  values.listenPort = document.getElementById('listen-port').value
  values.version = document.getElementById('version').value
  values.onlineMode = document.getElementById('auth-online').checked
  values.offlineUsername = document.getElementById('offline-username').value
}

document.getElementById('proxy-form').addEventListener('submit', function (event) {
  if (isLoading) {
    return
  }
  isLoading = true
  event.preventDefault()
  readForm()
  saveSettings()
  // If blank use default values
  values.connectAddress = (values.connectAddress === '') ? '127.0.0.1' : values.connectAddress
  values.connectPort = (values.connectPort === '') ? '25565' : values.connectPort
  values.listenPort = (values.listenPort === '') ? '25566' : values.listenPort
  // TODO: Validate data (e.g. port range)
  ipcRenderer.send('startProxy', {
    connectAddress: values.connectAddress,
    connectPort: values.connectPort,
    listenPort: values.listenPort,
    version: values.version,
    onlineMode: values.onlineMode,
    offlineUsername: values.offlineUsername
  })
})
