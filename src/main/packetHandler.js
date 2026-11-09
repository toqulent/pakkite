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

  ipcMain.on('injectPacket', (event, message) => {
    if (message.direction === 'clientbound') {
      proxy.writeToClient(message.meta, message.data, false)
    } else {
      proxy.writeToServer(message.meta, message.data, false)
    }
  })

  ipcMain.on('scriptStateChange', (event, message) => {
    scriptingEnabled = message.scriptingEnabled
    proxy.setScriptingEnabled(scriptingEnabled)
    currentScriptModule = scriptingEnabled ? _eval(message.script, '/script.js') : undefined
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
  mainWindow.send('message', { header: header, info: info, fatal: fatal })
}
