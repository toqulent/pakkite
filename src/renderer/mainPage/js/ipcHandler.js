/* global handleError */

const { ipcRenderer } = require('electron')

const state = require('./state.js').state
const packetDom = require('./packetDom.js')
const filtering = require('./filtering.js')
const dialogs = require('./dialogs.js')
const scripting = require('./scripting.js')

exports.setup = function () {
  ipcRenderer.on('packet', (event, packet) => {
    packetDom.addPacket(packet)
  })

  ipcRenderer.on('error', (event, err) => {
    handleError(err.msg, err.stack)
  })

  ipcRenderer.on('message', (event, message) => {
    dialogs.errorDialog(message.header, message.info, message.fatal)
  })

  ipcRenderer.on('showAuthCode', (event, arg) => {
    if (arg === 'close') {
      dialogs.closeDialog()
    } else {
      dialogs.loginDialog(arg)
    }
  })

  ipcRenderer.on('editAndResend', (event, message) => {
    dialogs.editAndResend(message.id)
  })

  ipcRenderer.on('hideAllOfType', (event, message) => { // Context menu
    filtering.hideAllOfType(message.id)
  })

  ipcRenderer.on('copyPacketData', (event, message) => {
    const data = state.allPackets[message.id].data
    ipcRenderer.send('copyToClipboard', state.proxyCapabilities.jsonData ? JSON.stringify(data, null, 2) : data.data)
  })

  ipcRenderer.on('copyHexData', (event, message) => {
    const raw = state.allPackets[message.id].raw
    // raw is a Buffer for live packets and a plain object when loaded from a saved log
    const bytes = raw.length ? raw : raw.data
    let data = ''
    for (const byte of bytes) {
      data += byte.toString(16).padStart(2, '0')
      data += ' '
    }
    ipcRenderer.send('copyToClipboard', data.trim().toUpperCase())
  })

  ipcRenderer.on('copyTeleportCommand', (event, message) => {
    const data = state.allPackets[message.id].data

    let clipData = '/tp @p ' + ((data.flags & 0x01) ? '~' : '') + ((data.x === 0 && (data.flags & 0x01)) ? '' : data.x) +
      ((data.flags & 0x02) ? ' ~' : ' ') + ((data.y === 0 && (data.flags & 0x03)) ? '' : data.y) +
      ((data.flags & 0x04) ? ' ~' : ' ') + ((data.z === 0 && (data.flags & 0x04)) ? '' : data.z)

    if (!(data.flags & 0x10) || !(data.flags & 0x08) || data.pitch != 0 || data.yaw !== 0) {
      clipData += ((data.flags & 0x10) ? ' ~' : ' ') + data.pitch +
        ((data.flags & 0x08) ? ' ~' : ' ') + data.yaw
    }

    ipcRenderer.send('copyToClipboard', clipData)
  })

  ipcRenderer.on('updateFiltering', () => {
    state.proxyCapabilities = ipcRenderer.sendSync('proxyCapabilities', '')
    filtering.updateFilteringPackets()
  })

  ipcRenderer.on('loadLogData', (event, arg) => {
    state.allPackets = JSON.parse(arg)
    state.allPackets.forEach((packet, index) => {
      packet.uid = index
    })
    for (const packet of state.allPackets) {
      packetDom.addPacketToDOM(packet)
    }
  })

  ipcRenderer.on('streamingState', (event, active) => {
    document.getElementById('streamLog').textContent = active ? 'Stop streaming' : 'Stream to file'
  })

  ipcRenderer.on('loadScriptData', (event, script) => {
    scripting.setValue(script)
    ipcRenderer.send('scriptStateChange', {
      scriptingEnabled: document.getElementById('enableScripting').checked,
      script: script
    })
  })

  ipcRenderer.on('enableBtnScriptSave', (event, path) => {
    document.getElementById('btnScriptSave').disabled = false
    document.getElementById('btnScriptSave').title = path
  })

  ipcRenderer.on('disableBtnScriptSave', () => {
    document.getElementById('btnScriptSave').disabled = true
    document.getElementById('btnScriptSave').title = ''
  })
}
