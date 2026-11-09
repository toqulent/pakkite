const { Menu } = require('electron')

// Builds the right click menu for a packet row
exports.buildPacketMenu = function (packet, capabilities, sendToWindow, iconsPath) {
  if (packet.direction !== 'clientbound' && packet.direction !== 'serverbound') {
    // This probably isn't a packet
    return
  }

  const items = [
    {
      icon: iconsPath + `${packet.direction}${packet.invalid ? '-invalid' : ''}.png`,
      label: packet.text,
      enabled: false
    },
    {
      type: 'separator'
    }
  ]

  if (!packet.noData) {
    items.push({
      label: capabilities.jsonData ? 'Copy JSON data' : 'Copy data',
      click: () => sendToWindow('copyPacketData', { id: packet.id })
    })
  }

  if (capabilities.rawData) {
    items.push({
      label: 'Copy hex data',
      click: () => sendToWindow('copyHexData', { id: packet.id })
    })
  }

  if (!packet.noData && packet.direction === 'clientbound' && packet.text.split(' ')[1] === 'position') {
    items.push({
      label: 'Copy teleport as command',
      click: () => sendToWindow('copyTeleportCommand', { id: packet.id })
    })
  }

  if (capabilities.modifyPackets) {
    items.push({
      label: 'Edit and resend',
      click: () => sendToWindow('editAndResend', { id: packet.id })
    })
  }

  items.push({
    label: 'Hide all packets of this type',
    click: () => sendToWindow('hideAllOfType', { id: packet.id })
  })

  return Menu.buildFromTemplate(items)
}
