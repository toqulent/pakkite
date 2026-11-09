/* global jsonTree, escapeHtml */

const state = require('./state.js').state
const settings = require('./settings.js')
const filteringLogic = require('./filteringLogic.js')

let tree
let treeElement

function trimData (data) { // Function to trim the size of stringified data for previews
  if (data === undefined) {
    // Undefined data, probably an invalid packet
    return 'Could not parse packet'
  }

  let newData
  if (state.proxyCapabilities.jsonData) {
    newData = Object.assign({}, data)
    Object.entries(newData).forEach(function (entry) {
      try {
        if (JSON.stringify(entry[1]).length > 15) {
          if (typeof entry[1] === 'number') {
            newData[entry[0]] = Math.round((entry[1] + Number.EPSILON) * 100) / 100
          } else {
            newData[entry[0]] = '...'
          }
        }
      } catch (err) {

      }
    })
    newData = JSON.stringify(newData)
  } else {
    newData = data.data
  }
  if (newData.length > 750) {
    newData = newData.slice(0, 750)
  }
  return newData
}

function formatTime (ms) {
  // Based on https://stackoverflow.com/a/50409993/4012708
  return new Date(new Date(ms).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[1].replace(/[0-9]Z$/, '')
}

exports.updateHiddenCounter = function () {
  const hiddenPacketsCounter = document.getElementById('hiddenPackets')
  hiddenPacketsCounter.innerHTML = state.hiddenPacketsAmount + ' hidden packets'
  if (state.hiddenPacketsAmount !== 0) {
    hiddenPacketsCounter.innerHTML += ' (<a href="#">show all</a>)'
  }
}

exports.addPacketToDOM = function (packet) {
  const isHidden = filteringLogic.packetIsHidden(packet, state.lastFilter,
    settings.getSetting('regexFilter') ? buildRegex(state.lastFilter) : undefined,
    state.hiddenPackets,
    settings.getSetting('inverseFiltering'))
  state.allPacketsHTML.push([
    `<li data-uid="${packet.uid}" class="packet ${packet.direction} ${isHidden ? 'filter-hidden' : 'filter-shown'} ${packet.packetValid ? '' : 'invalid'}">
        <div class="main-data">
          <span class="id">${escapeHtml(packet.hexIdString)}</span>
          <span class="name">${escapeHtml(packet.meta.name)}</span>
          <span class="data">${escapeHtml(trimData(packet.data))}</span>
        </div>
        <span class="time">${escapeHtml(formatTime(packet.time))}</span>
      </li>`])
  if (isHidden) {
    state.hiddenPacketsAmount += 1
  } else {
    state.packetsUpdated = true
  }
  exports.updateHiddenCounter()
}

function buildRegex (filter) {
  try {
    return new RegExp(filter)
  } catch (err) {
    // TODO: handle
    console.error(err)
    return new RegExp('')
  }
}

exports.setup = function () {
  treeElement = document.getElementById('tree')
  tree = jsonTree.create({}, treeElement)

  treeElement.firstElementChild.innerHTML = 'No packet selected!'
}

exports.addPacket = function (data) {
  state.allPackets.push(data)
  data.uid = state.allPackets.length - 1
  exports.addPacketToDOM(data)
}

exports.getTreeElement = function () {
  return treeElement
}

exports.getTree = function () {
  return tree
}
