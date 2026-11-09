const { app, BrowserWindow, ipcMain, clipboard, dialog } = require('electron')
const fs = require('fs')

const { buildPacketMenu } = require('./contextMenu.js')

const LOG_FILE_FILTERS = [{ name: 'pakkite log files', extensions: ['pakkite-json'] }]
const SCRIPT_FILE_FILTERS = [{ name: 'javascript files', extensions: ['js'] }]

let currentScriptFile = null

function sendToWindow (channel, payload) {
  BrowserWindow.getAllWindows()[0].send(channel, payload)
}

function ensureExtension (filePath, extension) {
  return filePath.endsWith(extension) ? filePath : filePath + extension
}

function save (filePath, contents, onSaved) {
  fs.writeFile(filePath, contents, function (err) {
    if (err) throw err
    console.log('Saved!')
    onSaved()
  })
}

exports.registerIpcHandlers = function (getProxy, getWindow, iconsPath) {
  ipcMain.on('proxyCapabilities', (event) => {
    event.returnValue = getProxy().capabilities
  })

  ipcMain.on('copyToClipboard', (event, text) => {
    clipboard.writeText(text)
  })

  ipcMain.on('relaunchApp', () => {
    app.relaunch()
    app.exit()
  })

  ipcMain.on('contextMenu', (event, packet) => {
    buildPacketMenu(packet, getProxy().capabilities, sendToWindow, iconsPath)
      .popup(getWindow())
  })

  ipcMain.on('saveLog', async (event, contents) => {
    const result = await dialog.showSaveDialog(getWindow(), {
      filters: LOG_FILE_FILTERS
    })

    if (!result.canceled) {
      const realPath = ensureExtension(result.filePath, '.pakkite-json')
      console.log('Saving log to', realPath)
      save(realPath, contents, () => {})
    }
  })

  ipcMain.on('loadLog', async () => {
    const result = await dialog.showOpenDialog(getWindow(), {
      filters: [...LOG_FILE_FILTERS, { name: 'All Files', extensions: ['*'] }],
      properties: ['openFile']
    })

    if (!result.canceled) {
      // It's an array, but we have multi-select off so it should only have one item
      console.log('Loading log from', result.filePaths[0])
      fs.readFile(result.filePaths[0], 'utf-8', function (err, data) {
        if (err) throw err
        sendToWindow('loadLogData', data)
      })
    }
  })

  ipcMain.on('saveAsScript', async (event, script) => {
    const result = await dialog.showSaveDialog(getWindow(), {
      title: 'Save user script',
      filters: SCRIPT_FILE_FILTERS
    })

    if (!result.canceled) {
      const realPath = ensureExtension(result.filePath, '.js')
      sendToWindow('disableBtnScriptSave')
      console.log('Saving script to', realPath)
      save(realPath, script, () => {
        currentScriptFile = realPath
        sendToWindow('enableBtnScriptSave', currentScriptFile)
      })
    }
  })

  ipcMain.on('saveScript', async (event, script) => {
    const validScriptPath = currentScriptFile != null && fs.existsSync(currentScriptFile)

    sendToWindow('disableBtnScriptSave')

    if (validScriptPath) {
      console.log('Overwrite script to', currentScriptFile)
      save(currentScriptFile, script, () => {
        sendToWindow('enableBtnScriptSave', currentScriptFile)
      })
    }
  })

  ipcMain.on('loadScript', async () => {
    const result = await dialog.showOpenDialog(getWindow(), {
      title: 'Load user script',
      filters: SCRIPT_FILE_FILTERS,
      properties: ['openFile']
    })

    if (!result.canceled) {
      sendToWindow('disableBtnScriptSave')

      // It's an array, but we have multi-select off so it should only have one item
      console.log('Loading script from', result.filePaths[0])
      fs.readFile(result.filePaths[0], 'utf-8', function (err, data) {
        if (err) throw err
        currentScriptFile = result.filePaths[0]
        sendToWindow('loadScriptData', data)
        sendToWindow('enableBtnScriptSave', currentScriptFile)
      })
    }
  })
}
