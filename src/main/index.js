const { app, BrowserWindow, ipcMain, shell } = require('electron')
const fs = require('fs')
const path = require('path')

const electronLocalShortcut = require('electron-localshortcut')
const windowStateKeeper = require('electron-window-state')
const unhandled = require('electron-unhandled')
const Store = require('electron-store')

const proxy = require('../proxy/java/proxy.js')
const packetHandler = require('./packetHandler.js')
const setupDataFolder = require('./setupDataFolder.js')
const { registerIpcHandlers } = require('./ipc.js')

new Store()

const resourcesPath = fs.existsSync(process.resourcesPath.concat('/app/'))
  ? process.resourcesPath.concat('/app/') // Packaged with electron-forge
  : './' // npm start

const dataFolder = setupDataFolder.setup(app.getPath('appData'))

let mainWindow

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    height: 650,
    width: 480,
    // resizable: false,
    // frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: resourcesPath + 'icons/icon.png'
  })
  mainWindow = win

  win.setMenuBarVisibility(false)
  win.setMenu(null)

  // Open the DevTools.
  // win.webContents.openDevTools()
  electronLocalShortcut.register(win, 'F12', () => {
    win.openDevTools()
  })

  win.webContents.setWindowOpenHandler(function (details) {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  unhandled({
    logger: (err) => {
      win.send('error', { msg: err.message, stack: err.stack })
      console.log(err.stack)
      console.error(err)
    },
    showDialog: false
  })

  win.loadFile(path.join(__dirname, '../renderer/startPage/index.html'))
}

function startProxy (args) {
  const win = mainWindow

  packetHandler.init(win, ipcMain, proxy)
  proxy.startProxy(args.connectAddress, args.connectPort, args.listenPort, args.version, args.offlineUsername, args.onlineMode,
    packetHandler.packetHandler, packetHandler.messageHandler, dataFolder, () => {
      win.send('updateFiltering', '')
    }, (data) => {
      win.send('showAuthCode', data)
    })

  win.loadFile(path.join(__dirname, '../renderer/mainPage/index.html'))

  // Load the previous state with fallback to defaults
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  })

  win.setResizable(true)
  if (mainWindowState.x !== undefined && mainWindowState.y !== undefined) {
    win.setPosition(mainWindowState.x, mainWindowState.y)
  }
  win.setSize(mainWindowState.width, mainWindowState.height)

  mainWindowState.manage(win)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.on('startProxy', (event, args) => {
  startProxy(args)
})

registerIpcHandlers(() => proxy, () => mainWindow, resourcesPath)
