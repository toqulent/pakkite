/* global CodeMirror */

const state = require('./state.js').state
const { ipcRenderer } = require('electron')

let editor

exports.updateScript = function (fromCheckbox) {
  if (!((fromCheckbox === true) || document.getElementById('enableScripting').checked)) return
  ipcRenderer.send('scriptStateChange', {
    scriptingEnabled: document.getElementById('enableScripting').checked,
    script: editor.getValue()
  })
}

exports.getValue = function () {
  return editor.getValue()
}

exports.setValue = function (value) {
  editor.setValue(value)
}

const defaultScript = `// See the node-minecraft-protocol docs
// When editing your scripts, disable scripting or disconnect so
// you don't get lots of errors.

// Scripts won't automatically save (yet), so make sure to save
// them somewhere!

// Handles packets going from the client to the server
exports.upstreamHandler = function (meta, data, server, client) {
  /* if (meta.name === 'chat') {
    data.message = 'modified'
  } */
  server.sendPacket(meta, data)
}

// Handles packets going from the server to the client
exports.downstreamHandler = function (meta, data, server, client) {
  client.sendPacket(meta, data)
}`

exports.reset = function () {
  editor.setValue(defaultScript)
  // reset save button
  // todo: maybe confirm dialog, if there are unsaved changes?
  document.getElementById('btnScriptSave').disabled = true
  document.getElementById('btnScriptSave').title = ''
}


exports.setup = function () {
  editor = CodeMirror.fromTextArea(document.getElementById('scriptEditor'), {
    lineNumbers: true,
    autoCloseBrackets: true,
    theme: 'darcula',
    autoRefresh: true
  })
  exports.reset()

  editor.on('change', exports.updateScript)
}
