/* global CodeMirror, alert */

const state = require('./state.js').state
const { ipcRenderer } = require('electron')

function openDialog (className, html) {
  document.getElementById('dialog-overlay').className = 'dialog-overlay active'
  document.getElementById('dialog').className = className
  document.getElementById('dialog').innerHTML = html
}

exports.closeDialog = function () {
  document.getElementById('dialog-overlay').className = 'dialog-overlay'
  document.getElementById('dialog').innerHTML = ''
}

function resendEdited (id, newValue) {
  try {
    ipcRenderer.send('injectPacket', {
      meta: state.allPackets[id].meta,
      data: JSON.parse(newValue),
      direction: state.allPackets[id].direction
    })
  } catch (err) {
    alert('Invalid JSON')
  }
}

exports.editAndResend = function (id) {
  if (!state.proxyCapabilities.modifyPackets) {
    alert('Edit and Resend is unavailable')
    return
  }

  openDialog('dialog', `
    <h2>Edit and resend packet</h2>
    <textarea id="packetEditor"></textarea>
    <button id="resendButton" style="margin-top: 16px;">Send</button>
    <button id="closeButton" style="margin-top: 16px;" class="bottom-button">Close</button>`)

  document.getElementById('packetEditor').value = JSON.stringify(state.allPackets[id].data, null, 2)

  const editor = CodeMirror.fromTextArea(document.getElementById('packetEditor'), {
    lineNumbers: false,
    autoCloseBrackets: true,
    theme: 'darcula'
  })

  document.getElementById('resendButton').addEventListener('click', () => resendEdited(id, editor.getValue()))
  document.getElementById('closeButton').addEventListener('click', exports.closeDialog)
}

exports.errorDialog = function (header, info, fatal) {
  openDialog('dialog dialog-small error-dialog', `
    <h2>${header}</h2>
    ${info}
    <br>
    <button id="closeButton" style="margin-top: 16px;" class="bottom-button">Close</button>`)

  document.getElementById('closeButton').addEventListener('click', () => {
    if (fatal) {
      ipcRenderer.send('relaunchApp', '')
    } else {
      exports.closeDialog()
    }
  })
}

exports.loginDialog = function (data) {
  // TODO: Take into account the other parameters
  /*
  {
    user_code: 'ABCDEFGH',
    device_code: '[long tokenish string]',
    verification_uri: 'https://www.microsoft.com/link',
    interval: 5,
    expires_in: 900,
    message: 'To sign in, use a web browser to open the page https://www.microsoft.com/link and enter the code ABCDEFGH to authenticate.'
  }
  */
  openDialog('dialog dialog-medium', `
    <h2>This server is in online mode</h2>
    Please log in to your Microsoft account at the following URL:
    <br><br>
    <a href="https://www.microsoft.com/link" style="color: rgba(64, 128, 255, 0.8);" target="_blank" id="msaLink">microsoft.com/link</a>
    <br><br>
    and enter the code:
    <br><br>
    <code style="font-size: 200%; user-select: all;" id="msaCode">${data.user_code}</code>
    <br><br>
    pakkite does not store passwords, it stores authentication tokens.
    <br><br>
    <button id="openBrowserButton" type="button">Open in browser and copy code</button>`)

  document.getElementById('openBrowserButton').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('msaCode').innerText)
    document.getElementById('msaLink').click()
  })
}
