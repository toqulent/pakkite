const {ipcRenderer} = require('electron')
const Store = require('electron-store')
const minecraftData = require('minecraft-data')

const store = new Store()

/* const customTitlebar = require('custom-electron-titlebar');

new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#FFF')
}); */

// if (!store.get('authConsentGiven')) {
//   document.getElementById('consent-row').style.display = 'flex'
// }

let isLoading = false
let connectAddress
let connectPort
let listenPort
let version
let onlineMode
let offlineUsername

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

function updateOfflineRow ()
{
  const showOfflineRow = !document.getElementById('auth-online').checked
  document.getElementById('offline-row').style.display = showOfflineRow ? 'block' : 'none'
}

document.getElementById('auth-online').addEventListener('change', updateOfflineRow)
updateOfflineRow()

function populateVersions ()
{
  const versionSelect = document.getElementById('version')
  const releases = minecraftData.supportedVersions.pc.filter(v => /^\d+\.\d+(\.\d+)?$/.test(v)).reverse()

  for (const version of releases) {
    const option = document.createElement('option')
    option.value = version
    option.textContent = version
    versionSelect.appendChild(option)
  }
}

function saveSettings ()
{
  store.set('lastVersion', version)
  store.set('lastConnectAddress', connectAddress)
  store.set('lastConnectPort', connectPort)
  store.set('lastListenPort', listenPort)
  store.set('lastOnlineMode', onlineMode)
  store.set('lastOfflineUsername', offlineUsername)
}

function loadSetting (name, varname, elementID, defaultValue)
{
  if (!store.has(name)) {
    store.set(name, defaultValue)
  }

  window[varname] = store.get(name)
  if (varname == 'onlineMode') {
    document.getElementById(elementID).checked = window[varname]
  } else {
    document.getElementById(elementID).value = window[varname]
  }
}

function updateVars ()
{
  connectAddress = document.getElementById('connect-address').value
  connectPort = document.getElementById('connect-port').value
  listenPort = document.getElementById('listen-port').value
  version = document.getElementById('version').value
  onlineMode = document.getElementById('auth-online').checked
  offlineUsername = document.getElementById('offline-username').value
}

window.startProxy = function (event)
{
  if (isLoading) {
    return
  }
  isLoading = true
  event.preventDefault()
  updateVars()
  saveSettings()
  // If blank use default values
  connectAddress = (connectAddress === '') ? '127.0.0.1' : connectAddress
  connectPort = (connectPort === '') ? '25565' : connectPort
  listenPort = (listenPort === '') ? '25566' : listenPort
  // if (document.getElementById('consent').checked) {
  //   store.set('authConsentGiven', true)
  // }
  store.set('authConsentGiven', false)
  // TODO: Validate data (e.g. port range)
  ipcRenderer.send('startProxy', JSON.stringify({
    consent: store.get('authConsentGiven'),
    connectAddress: connectAddress,
    connectPort: connectPort,
    listenPort: listenPort,
    version: version,
    onlineMode: onlineMode,
    offlineUsername: offlineUsername,
  }))
}
