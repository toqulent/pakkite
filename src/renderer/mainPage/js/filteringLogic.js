// Pure filtering logic - no DOM access

// Returns true when the packet should be hidden from the list
exports.packetIsHidden = function (packet, filter, regex, hiddenPackets, inverseFiltering) {
  if (hiddenPackets[packet.direction].includes(packet.meta.name)) {
    return true
  }

  if (filter === '') {
    return false
  }

  const comparisonString = packet.hexIdString + ' ' + packet.meta.name + ' ' + JSON.stringify(packet.data)

  const result = regex ? regex.test(comparisonString) : comparisonString.includes(filter)

  return inverseFiltering ? result : !result
}
