/* global Clusterize */

const { ipcRenderer } = require('electron')

const state = require('./state.js').state
const packetDom = require('./packetDom.js')
const wiki = require('./wiki.js')

let currentPacket
let clusterize

// Update the visible list, dropping hidden rows from the render and counting them
function updateRows (htmlArray) {
  state.hiddenPacketsAmount = 0
  const newArray = []
  for (const item of htmlArray) {
    // If the packet is hidden
    if (item[0].match(/<li .* class=".*filter-hidden.*">/)) {
      state.hiddenPacketsAmount += 1
    } else {
      newArray.push(item)
    }
  }
  clusterize.update(newArray)
  state.lastRenderedIndex = htmlArray.length
  packetDom.updateHiddenCounter()
}

exports.updateRows = updateRows

exports.refresh = function () {
  clusterize.refresh()
}

function removeOrAddSelection (id, add) {
  const fakeElement = document.createElement('div')
  fakeElement.innerHTML = state.allPacketsHTML[id][0]
  if (add) {
    fakeElement.firstChild.classList.add('selected')
  } else {
    fakeElement.firstChild.classList.remove('selected')
  }
  state.allPacketsHTML[id] = [fakeElement.innerHTML]

  updateRows(state.allPacketsHTML)
  clusterize.refresh()
}

exports.deselectPacket = function () {
  if (currentPacket !== undefined) {
    removeOrAddSelection(currentPacket, false)
  }
  currentPacket = undefined
  packetDom.getTreeElement().firstElementChild.innerHTML = 'No packet selected!'
  document.body.classList.remove('packetSelected')
  document.body.classList.add('noPacketSelected')
}

exports.getCurrentPacket = function () {
  return currentPacket
}

function packetClick (id) {
  // Remove selection background from old selected packet
  if (currentPacket !== undefined) {
    removeOrAddSelection(currentPacket, false)
  }

  currentPacket = id
  removeOrAddSelection(currentPacket, true)
  document.body.classList.remove('noPacketSelected')
  document.body.classList.add('packetSelected')
  if (state.proxyCapabilities.jsonData) {
    if (state.allPackets[id].data === undefined) {
      packetDom.getTreeElement().firstElementChild.innerHTML = 'Could not parse packet'
      // TODO: Error message
    } else {
      packetDom.getTree().loadData(state.allPackets[id].data)
    }
  } else {
    packetDom.getTreeElement().innerText = state.allPackets[id].data.data
    packetDom.getTreeElement().style = `
    color: #0F0;
    white-space: pre;
    font-family: 'PT Mono', monospace;
    font-size: 14px;
    display: block;`
  }

  wiki.scrollWikiToCurrentPacket(state.allPackets[id])
}

exports.clearPackets = function () {
  exports.deselectPacket()
  state.allPackets = []
  state.allPacketsHTML = []
  state.packetsUpdated = true
  // TODO: Doesn't seem to work? When removing line above it doesn't do anything until the next packet
  updateRows([])
}

exports.setup = function () {
  clusterize = new Clusterize({
    rows: state.allPacketsHTML,
    scrollElem: state.packetList.parentElement,
    contentElem: state.packetList,
    no_data_text: ''
  })

  // Packet rows are re-rendered by clusterize on scroll, so the click and
  // context menu handlers live on the containers and resolve rows on event
  document.getElementById('packetcontainer').addEventListener('click', (event) => {
    const row = event.target.closest('li.packet')
    if (row && row.dataset.uid !== undefined) {
      packetClick(Number(row.dataset.uid))
    }
  })

  document.body.addEventListener('contextmenu', (event) => {
    const row = event.target.closest('#packetcontainer li.packet')

    if (!row) {
      return
    }

    const id = Number(row.dataset.uid)
    ipcRenderer.send('contextMenu', {
      direction: state.allPackets[id].direction,
      text: row.children[0].children[0].innerText + ' ' + row.children[0].children[1].innerText,
      id: id,
      invalid: row.classList.contains('invalid'),
      noData: state.allPackets[id].data === undefined
    })
  })

  // Update every 0.05 seconds
  // TODO: Find a better way without updating on every packet (which causes lag)
  window.setInterval(function () {
    if (state.packetsUpdated) {
      const newItems = state.allPacketsHTML.slice(state.lastRenderedIndex)
      if (newItems.length > 0) {
        const diff = (state.packetList.parentElement.scrollHeight - state.packetList.parentElement.offsetHeight) - state.packetList.parentElement.scrollTop
        const wasScrolledToBottom = diff < 3 // If it was scrolled to the bottom or almost scrolled to the bottom
        const visibleNewItems = newItems.filter(item => !item[0].match(/<li .* class=".*filter-hidden.*">/))
        clusterize.append(visibleNewItems)
        state.lastRenderedIndex = state.allPacketsHTML.length
        if (wasScrolledToBottom) {
          state.packetList.parentElement.scrollTop = state.packetList.parentElement.scrollHeight
          // Also update it later - hacky workaround for scroll bar being "left behind"
          setTimeout(() => {
            state.packetList.parentElement.scrollTop = state.packetList.parentElement.scrollHeight
          }, 10)
        }
      }
      state.packetsUpdated = false
    }
  }, 50)
}
