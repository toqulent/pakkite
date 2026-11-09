/* global escapeHtml */

const state = require('./state.js').state
const settings = require('./settings.js')
const filteringLogic = require('./filteringLogic.js')
const packetList = require('./packetList.js')

const filterInput = document.getElementById('filter')
const filteringPackets = document.getElementById('filtering-packets')

const allServerboundPackets = []
const allClientboundPackets = []

function buildRegex (filter) {
  try {
    return new RegExp(filter)
  } catch (err) {
    // TODO: handle
    console.error(err)
    return new RegExp('')
  }
}

function updateFiltering () {
  const inverseFiltering = settings.getSetting('inverseFiltering')
  const regexFilter = settings.getSetting('regexFilter')
  const regex = regexFilter ? buildRegex(state.lastFilter) : undefined
  state.allPacketsHTML.forEach(function (item, index, array) {
    const hidden = filteringLogic.packetIsHidden(state.allPackets[index], state.lastFilter,
      regex, state.hiddenPackets, inverseFiltering)
    if (!hidden) {
      // If it's hidden, show it
      array[index] = [item[0].replace('filter-hidden', 'filter-shown')]
    } else {
      // If it's shown, hide it
      array[index] = [item[0].replace('filter-shown', 'filter-hidden')]
    }
  })
  packetList.updateRows(state.allPacketsHTML)
  packetList.refresh()
}

exports.updateFiltering = updateFiltering

function updateFilterBox () {
  const newValue = filterInput.value
  if (state.lastFilter !== newValue) {
    state.lastFilter = newValue
    if (packetList.getCurrentPacket() !== undefined) {
      packetList.deselectPacket()
    }
    updateFiltering()
  }
}

function updateFilteringStorage () {
  state.setVersionSpecificVar('hiddenPackets', state.hiddenPackets)
}

function updateFilteringTab () {
  for (const item of filteringPackets.children) {
    const checkbox = item.children[0].firstElementChild
    checkbox.readOnly = false
    checkbox.indeterminate = false
    checkbox.checked = !state.hiddenPackets[item.dataset.direction].includes(item.dataset.name)
  }

  updateFiltering()
  updateFilteringStorage()
}

function toggleCheckbox (packetName, direction, box) {
  // TODO: collapsing with indeterminate state
  /* if (box.readOnly) {
    box.checked = false
    box.readOnly = false
  } else if (!box.checked) {
    box.readOnly = true
    box.indeterminate = true
  } */
  const check = box.checked

  const index = state.hiddenPackets[direction].indexOf(packetName)
  const currentlyHidden = index !== -1
  if (check && currentlyHidden) {
    // Remove it from the hidden packets
    state.hiddenPackets[direction].splice(index, 1)
  } else if (!check && !currentlyHidden) {
    // Add it to the hidden packets
    state.hiddenPackets[direction].push(packetName)
  }

  updateFiltering()
  updateFilteringStorage()
}

// Builds the checkboxes in the filtering tab
function updateFilteringPackets () {
  allServerboundPackets.length = 0
  allClientboundPackets.length = 0
  filteringPackets.innerHTML = ''

  function addPacketsToFiltering (packetsObject, direction, appendTo) {
    for (const key in packetsObject) {
      if (packetsObject.hasOwnProperty(key)) {
        const name = packetsObject[key]
        filteringPackets.innerHTML +=
          `<li data-name="${escapeHtml(name)}" data-direction="${direction}" class="packet ${direction}">
            <label>
              <input type="checkbox" ${!state.hiddenPackets[direction].includes(name) ? 'checked' : ''}/>
              <span class="id">${escapeHtml(key)}</span>
              <span class="name">${escapeHtml(name)}</span>
            </label>
          </li>`
        appendTo.push(name)
      }
    }
  }

  addPacketsToFiltering(state.proxyCapabilities.serverboundPackets, 'serverbound', allServerboundPackets)
  addPacketsToFiltering(state.proxyCapabilities.clientboundPackets, 'clientbound', allClientboundPackets)
}

exports.updateFilteringPackets = updateFilteringPackets

exports.showAllPackets = function () {
  state.hiddenPackets = {
    serverbound: [], clientbound: []
  }
  updateFilteringTab()
}

exports.hideAllPackets = function () {
  state.hiddenPackets = {
    serverbound: [...allServerboundPackets], clientbound: [...allClientboundPackets]
  }
  updateFilteringTab()
}

exports.resetHiddenToDefaults = function () {
  const defaultHidden = state.findDefault('hiddenPackets')
  state.hiddenPackets = {
    serverbound: [...defaultHidden.serverbound], clientbound: [...defaultHidden.clientbound]
  }
  updateFilteringTab()
}

// Context menu action: hide every packet of the same type as the packet
exports.hideAllOfType = function (packetId) {
  const packet = state.allPackets[packetId]
  if (!packet) {
    return
  }

  if (!state.hiddenPackets[packet.direction].includes(packet.meta.name)) {
    state.hiddenPackets[packet.direction].push(packet.meta.name)
  }
  for (const item of filteringPackets.children) {
    if (item.dataset.name === packet.meta.name && item.dataset.direction === packet.direction) {
      const checkbox = item.querySelector('input[type=checkbox]')
      checkbox.checked = false
      checkbox.readOnly = false
      checkbox.indeterminate = false
    }
  }
  packetList.deselectPacket()
  updateFiltering()
  updateFilteringStorage()
}

exports.setup = function () {
  // Checkbox changes in the filtering tab
  filteringPackets.addEventListener('change', (event) => {
    const box = event.target
    if (box.type !== 'checkbox') {
      return
    }
    const row = box.closest('li')
    toggleCheckbox(row.dataset.name, row.dataset.direction, box)
  })

  // Update every 0.1 seconds
  window.setInterval(updateFilterBox, 100)
  filterInput.addEventListener('input', updateFilterBox)
}
