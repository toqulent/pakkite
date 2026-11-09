/* global Split */

const { ipcRenderer } = require('electron')

const state = require('./state.js').state
const versionStore = require('./state.js')
const packetList = require('./packetList.js')
const filtering = require('./filtering.js')
const dialogs = require('./dialogs.js')
const wiki = require('./wiki.js')
const ipcHandler = require('./ipcHandler.js')
const settings = require('./settings.js')
const scripting = require('./scripting.js')
const packetDom = require('./packetDom.js')

state.proxyCapabilities = ipcRenderer.sendSync('proxyCapabilities', '')

state.hiddenPackets = versionStore.getVersionSpecificVar('hiddenPackets', versionStore.findDefault('hiddenPackets'))

if (!state.proxyCapabilities.scriptingSupport) {
  document.getElementById('scriptingTab').style.display = 'none'
}

if (!state.proxyCapabilities.modifyPackets) {
  document.getElementById('editAndResend').style.display = 'none'
}

Split(['#packets', '#sidebar'], {
  minSize: [50, 75]
})

packetDom.setup()
packetList.setup()
filtering.setup()
wiki.setup()

settings.bindToSettingChange('showTimes', (newValue) => {
  if (newValue) {
    document.body.classList.remove('timeNotShown')
    document.body.classList.add('timeShown')
  } else {
    document.body.classList.remove('timeShown')
    document.body.classList.add('timeNotShown')
  }
})
settings.bindToSettingChange('inverseFiltering', () => {
  try {
    packetList.deselectPacket()
    filtering.updateFiltering()
  } catch (e) {}
})
settings.bindToSettingChange('regexFilter', () => {
  try {
    packetList.deselectPacket()
    filtering.updateFiltering()
  } catch (e) {}
})
settings.setup()

ipcHandler.setup()

// Modified from W3Schools
function openMenu (evt, menuName, id) {
  let i, tabcontent, tablinks
  tabcontent = document.getElementsByClassName('tabcontent' + id)
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = 'none'
  }
  tablinks = document.getElementsByClassName('tablinks' + id)
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(' active', '')
  }
  document.getElementById(menuName).style.display = 'block'
  evt.currentTarget.className += ' active'
}

// Top bar tabs and right panel tabs
for (const button of document.querySelectorAll('[data-panel]')) {
  button.addEventListener('click', (event) => {
    openMenu(event, button.dataset.panel, button.dataset.group)
    if (button.dataset.panel === 'wikivg') {
      wiki.scrollWikiToCurrentPacket(state.allPackets[packetList.getCurrentPacket()])
    }
  })
}

document.getElementById('backButton').addEventListener('click', () => {
  ipcRenderer.send('relaunchApp', '')
})

// Quick actions
document.getElementById('hideAllType').addEventListener('click', () => {
  filtering.hideAllOfType(packetList.getCurrentPacket())
})
document.getElementById('editAndResend').addEventListener('click', () => {
  dialogs.editAndResend(packetList.getCurrentPacket())
})

// File tab
document.getElementById('saveLog').addEventListener('click', () => {
  ipcRenderer.send('saveLog', JSON.stringify(state.allPackets))
})
document.getElementById('loadLog').addEventListener('click', () => {
  ipcRenderer.send('loadLog', '')
})

// Filtering tab
document.getElementById('showAllButton').addEventListener('click', filtering.showAllPackets)
document.getElementById('hideAllButton').addEventListener('click', filtering.hideAllPackets)
document.getElementById('defaultHiddenButton').addEventListener('click', filtering.resetHiddenToDefaults)

// Scripting tab
document.getElementById('enableScripting').addEventListener('change', () => {
  scripting.updateScript(true)
})
document.getElementById('btnScriptLoad').addEventListener('click', () => {
  ipcRenderer.send('loadScript', '')
})
document.getElementById('btnScriptSave').addEventListener('click', () => {
  ipcRenderer.send('saveScript', scripting.getValue())
})
document.getElementById('btnScriptSaveAs').addEventListener('click', () => {
  ipcRenderer.send('saveAsScript', scripting.getValue())
})
document.getElementById('resetScript').addEventListener('click', (event) => {
  event.preventDefault()
  scripting.reset()
})

// Packet list toolbar
document.getElementById('clearPackets').addEventListener('click', (event) => {
  event.preventDefault()
  packetList.clearPackets()
})
document.getElementById('hiddenPackets').addEventListener('click', (event) => {
  event.preventDefault()
  if (event.target.tagName === 'A') {
    filtering.showAllPackets()
  }
})
