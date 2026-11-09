const _eval = require('node-eval')

let mainWindow
let ipcMain
let proxy
let scriptingEnabled = false
let currentScriptModule

const server = {
  sendPacket: function (meta, data) {
    proxy.writeToServer(meta, data, true)
  }
}

const client = {
  sendPacket: function (meta, data) {
    proxy.writeToClient(meta, data, true)
  }
}

exports.init = function (window, passedIpcMain, passedProxy) {
  mainWindow = window
  ipcMain = passedIpcMain
  proxy = passedProxy

  ipcMain.on('injectPacket', (event, arg) => {
    const ipcMessage = JSON.parse(arg)
    if (ipcMessage.direction === 'clientbound') {
      passedProxy.writeToClient(ipcMessage.meta, ipcMessage.data, false)
    } else {
      passedProxy.writeToServer(ipcMessage.meta, ipcMessage.data, false)
    }
  })

  ipcMain.on('scriptStateChange', (event, arg) => {
    const ipcMessage = JSON.parse(arg)
    scriptingEnabled = ipcMessage.scriptingEnabled
    proxy.setScriptingEnabled(scriptingEnabled)
    currentScriptModule = scriptingEnabled ? _eval(ipcMessage.script, '/script.js') : undefined
  })
}

exports.packetHandler = function (direction, meta, data, id, raw, canUseScripting, packetValid) {
  try {
    mainWindow.send('packet', { meta: meta, data: data, direction: direction, hexIdString: id, raw: raw, time: Date.now(), packetValid: packetValid })
    if (proxy.capabilities.scriptingSupport && canUseScripting && currentScriptModule) {
      if (direction === 'clientbound') {
        currentScriptModule.downstreamHandler(meta, data, server, client)
      } else {
        currentScriptModule.upstreamHandler(meta, data, server, client)
      }
    }
  } catch (err) {
    console.error(err)
  }
}

exports.messageHandler = function (header, info, fatal) {
  mainWindow.send('message', JSON.stringify({ header: header, info: info, fatal: fatal }))
}
